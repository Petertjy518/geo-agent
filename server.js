const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), timeoutMs))
  ]);
}

async function callDeepSeek(prompt) {
  try {
    const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    return '';
  }
}

// ===== 强力清洗AI输出 =====
function clean(text) {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---+/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^好的[,，]?\s*/gm, '')
    .replace(/^作为.*?[，,]\s*/gm, '')
    .replace(/^根据.*?[，,]\s*/gm, '')
    .replace(/^基于.*?[，,]\s*/gm, '')
    .replace(/^以下是.*?[：:]\s*/gm, '')
    .replace(/^.*?分析如下[：:]\s*/gm, '')
    .replace(/综上所述[，,。.]?/g, '')
    .replace(/总的来说[，,。.]?/g, '')
    .replace(/总体而言[，,。.]?/g, '')
    .replace(/值得注意的是[，,]?/g, '')
    .replace(/需要指出的是[，,]?/g, '')
    .replace(/^\d+[.、．]\s*/gm, '')
    .replace(/^[-•·]\s*/gm, '')
    .replace(/\(.*?\)/g, '')
    .replace(/ChatGPT|Perplexity|Google Bard|New Bing/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
}

function extractScore(text) {
  if (!text) return 5;
  const m = text.match(/(\d+(?:\.\d)?)/);
  if (m) {
    const s = parseFloat(m[1]);
    if (s >= 1 && s <= 10) return Math.round(s * 10) / 10;
  }
  return 5;
}

function getPoints(text, count = 3) {
  if (!text) return ['数据获取中'];
  const c = clean(text);
  const sentences = c.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 100);
  return sentences.slice(0, count).length > 0 ? sentences.slice(0, count) : ['数据获取中'];
}

// ===== 百度搜索 =====
async function scrapeBaidu(brand, industry) {
  try {
    const res = await fetchWithTimeout(`https://www.baidu.com/s?wd=${encodeURIComponent(brand + ' ' + industry)}&rn=10`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN',
      },
    });
    const html = await res.text();
    const titles = [];
    (html.match(/<h3[^>]*class="[^"]*t[^"]*"[^>]*>.*?<\/h3>/gi) || []).forEach(b => {
      const t = b.replace(/<[^>]+>/g, '').trim();
      if (t.length > 5) titles.push(t);
    });
    const mentions = titles.filter(t => t.toLowerCase().includes(brand.toLowerCase())).length;
    return {
      totalResults: titles.length,
      brandMentions: mentions,
      mentionRate: titles.length > 0 ? Math.round((mentions / titles.length) * 100) : 0,
      hasOfficialSite: titles.some(t => /官网|官方|百科/.test(t)),
      topResults: titles.slice(0, 5),
    };
  } catch (e) {
    return { totalResults: 0, brandMentions: 0, mentionRate: 0, hasOfficialSite: false, topResults: [] };
  }
}

// ===== 知乎 =====
async function scrapeZhihu(brand) {
  try {
    const res = await fetchWithTimeout(`https://www.zhihu.com/search?type=content&q=${encodeURIComponent(brand)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
    });
    const html = await res.text();
    const items = (html.match(/<h2[^>]*class="[^"]*ContentItem-title[^"]*"[^>]*>.*?<\/h2>/gi) || []);
    const titles = items.map(i => i.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 5);
    return { contentCount: titles.length, topContents: titles.slice(0, 5) };
  } catch (e) {
    return { contentCount: 0, topContents: [] };
  }
}

// ===== API =====
app.get('/api/health', (req, res) => res.json({ status: 'ok', api: !!DEEPSEEK_KEY }));
app.get('/api/quota', (req, res) => res.json({ dailyLimit: 3, used: 0, remaining: 3 }));

app.post('/api/diagnose', async (req, res) => {
  if (!DEEPSEEK_KEY) return res.status(503).json({ error: 'API未配置' });
  
  const { brandInfo } = req.body;
  const { brandName, industry, competitors } = brandInfo;
  const comps = (competitors || []).filter(c => c);
  const compText = comps.join('、') || '同行业其他品牌';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // 并行抓取真实数据（带单独超时保护）
    send({ status: 'running', progress: 10, currentPlatform: '数据抓取', message: '正在抓取百度和知乎...' });
    const baiduPromise = scrapeBaidu(brandName, industry).catch(e => ({ totalResults: 0, brandMentions: 0, mentionRate: 0, hasOfficialSite: false, topResults: [] }));
    const zhihuPromise = scrapeZhihu(brandName).catch(e => ({ contentCount: 0, topContents: [] }));
    const [baidu, zhihu] = await Promise.all([baiduPromise, zhihuPromise]);

    // AI分析（并行）
    send({ status: 'running', progress: 30, currentPlatform: 'AI分析', message: '正在分析6个维度...' });
    const [r1, r2, r3, r4, r5] = await Promise.all([
      callDeepSeek(`用户在豆包搜"${industry}推荐"时，"${brandName}"会被推荐吗？和${compText}比如何？1-10分，3句大白话，不要套话。`),
      callDeepSeek(`在小红书搜"${industry}"时，"${brandName}"的笔记出现频率如何？和${compText}比？1-10分，3句大白话。`),
      callDeepSeek(`在DeepSeek问"${industry}哪个好"时，"${brandName}"排第几？和${compText}比？1-10分，3句大白话。`),
      callDeepSeek(`"${brandName}"（${industry}）的品牌可信度如何？用户评价正面多还是负面多？1-10分，3句大白话。`),
      callDeepSeek(`如果不做AI搜索优化，"${brandName}"（${industry}）每月流失多少个AI搜索客户？为什么？给出数字，大白话。`),
    ]);

    send({ status: 'running', progress: 70, currentPlatform: '生成建议', message: '正在生成优化方案...' });
    const r6 = await callDeepSeek(`给"${brandName}"（${industry}）4条优化建议，按优先级排序。每条包含：标题（10字内）、问题（30字内）、做法（50字内）、费用、效果。不要套话。`);

    // 计算分数
    const s1 = extractScore(r1), s2 = extractScore(r2), s3 = Math.min(10, Math.round((baidu.mentionRate / 10) * 1.5 * 10) / 10);
    const s4 = extractScore(r3), s5 = extractScore(r4), s6 = Math.min(10, Math.round((zhihu.contentCount / 3) * 2 * 10) / 10);
    const overall = Math.round((s1 * 0.20 + s2 * 0.18 + s3 * 0.18 + s4 * 0.15 + s5 * 0.15 + s6 * 0.14) * 10) / 10;

    // 清洗所有文本
    const c1 = clean(r1), c2 = clean(r2), c3 = clean(r3), c4 = clean(r4), c5 = clean(r5), c6 = clean(r6);

    // 提取流失客户数
    const lostMatch = c5.match(/(\d+)/);
    const lostLeads = lostMatch ? `${lostMatch[1]}个/月` : '数十个/月';

    // 确定最弱维度
    const dimScores = [
      { name: '豆包搜索表现', score: s1 },
      { name: '小红书搜索曝光', score: s2 },
      { name: '百度搜索首页', score: s3 },
      { name: 'DeepSeek推荐位置', score: s4 },
      { name: '品牌可信度', score: s5 },
      { name: '知乎内容量', score: s6 },
    ];
    const weakest = dimScores.reduce((min, d) => d.score < min.score ? d : min);

    // 构建6个维度数据
    const dims = [
      { key: 'doubao', name: '豆包搜索表现', score: s1, icon: '🤖', detail: '豆包AI（月活2.26亿），用户搜"' + industry + '推荐"时是否推荐您的品牌', analysis: c1 || '豆包搜索表现分析中...', findings: getPoints(r1) },
      { key: 'xiaohongshu', name: '小红书搜索曝光', score: s2, icon: '📕', detail: '小红书是消费决策第一入口，您的笔记是否出现在搜索结果', analysis: c2 || '小红书搜索曝光分析中...', findings: getPoints(r2) },
      { key: 'baidu', name: '百度搜索首页', score: s3, icon: '🔍', detail: '百度搜索仍是重要流量入口', analysis: `百度搜索"${brandName}"，首页${baidu.totalResults}条结果中有${baidu.brandMentions}条（${baidu.mentionRate}%）提到您的品牌`, findings: baidu.topResults.slice(0, 3).length > 0 ? baidu.topResults.slice(0, 3) : ['百度搜索数据获取中'] },
      { key: 'deepseek', name: 'DeepSeek推荐位置', score: s4, icon: '🧠', detail: 'DeepSeek是专业用户首选AI工具', analysis: c3 || 'DeepSeek推荐位置分析中...', findings: getPoints(r3) },
      { key: 'trust', name: '品牌可信度', score: s5, icon: '🛡️', detail: '品牌资质、口碑、媒体等信号', analysis: c4 || '品牌可信度分析中...', findings: getPoints(r4) },
      { key: 'zhihu', name: '知乎内容量', score: s6, icon: '💡', detail: '知乎是B2B和专业服务重要阵地', analysis: `知乎搜索"${brandName}"，找到${zhihu.contentCount}条相关内容`, findings: zhihu.topContents.slice(0, 3).length > 0 ? zhihu.topContents.slice(0, 3) : ['知乎数据获取中'] },
    ];

    // 解析建议（确保有完整内容）
    let recommendations = [
      { id: 1, title: '在小红书/抖音发专业内容', problem: 'AI搜索找不到足够的品牌信息', action: '每周发布2-3篇专业内容，包含常见问题解答', cost: '每月3000-6000元', effect: '3个月内AI提及率提升50%', priority: 'high' },
      { id: 2, title: '完善百度百科和品牌词条', problem: 'AI对品牌基础信息了解不足', action: '创建或优化百度百科、搜狗百科', cost: '一次性5000-10000元', effect: 'AI信息准确度显著提升', priority: 'high' },
      { id: 3, title: '优化百度搜索结果', problem: '百度搜索首页品牌信息不足', action: '发布新闻稿、优化官网SEO', cost: '每月2000-5000元', effect: '百度搜索首页品牌信息增加', priority: 'medium' },
      { id: 4, title: '收集客户真实评价', problem: '品牌可信度信号较弱', action: '引导满意客户在主流平台留真实评价', cost: '每月1000-3000元', effect: '口碑和推荐优先级提升', priority: 'medium' }
    ];

    // 尝试从AI回复解析更好的建议
    if (c6 && c6.length > 50) {
      const lines = c6.split('\n').filter(l => l.trim().length > 10);
      const parsedRecs = [];
      for (let i = 0; i < Math.min(4, lines.length); i++) {
        const line = clean(lines[i]);
        if (line.length > 15) {
          parsedRecs.push({
            id: i + 1,
            title: line.slice(0, 20) + (line.length > 20 ? '...' : ''),
            problem: line.slice(0, 50),
            action: line.slice(0, 80),
            cost: '详询服务商',
            effect: '提升AI搜索可见度',
            priority: i < 2 ? 'high' : 'medium'
          });
        }
      }
      if (parsedRecs.length >= 2) recommendations = parsedRecs;
    }

    // 确保executiveSummary有6条
    const summary = [
      `${brandName}（${industry}）的AI搜索综合评分为 ${overall}/10。`,
      `百度搜索：首页${baidu.mentionRate}%的结果提到了您的品牌${baidu.hasOfficialSite ? '，有官方信息' : ''}。`,
      `知乎：找到${zhihu.contentCount}条相关内容。`,
      `最大短板：${weakest.name}（${weakest.score}/10），建议优先改进。`,
      `如不优化，预计每月流失约${lostLeads}潜在客户。`,
      `执行前2条建议，预计1-3个月内可见明显改善。`
    ];

    const report = {
      id: `GEO-${Date.now()}`,
      brandInfo,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      overallScore: overall,
      grade: overall >= 8 ? 'A' : overall >= 6.5 ? 'B' : overall >= 5 ? 'C' : 'D',
      riskLabel: overall < 5 ? '高风险 - 急需优化' : overall < 6.5 ? '中等风险 - 有待提升' : overall < 8 ? '良好 - 可进一步优化' : '优秀 - 保持领先',
      radarData: dims.map(d => ({ name: d.name, score: d.score })),
      dimensions: dims,
      weakestDimension: { name: weakest.name, score: weakest.score },
      recommendations: recommendations,
      businessInsight: {
        summary: c5 || '如果不做AI搜索优化，您的品牌每月可能流失大量通过AI工具寻找服务的潜在客户。',
        lostLeads: lostLeads,
        keyFinding: `您的品牌在${weakest.name}方面表现最差（${weakest.score}/10），这是最需要优先改进的地方。`
      },
      executiveSummary: summary
    };

    send({ status: 'completed', progress: 100, report });
    res.end();

  } catch (err) {
    console.error('Error:', err);
    send({ status: 'error', message: err.message });
    res.end();
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GEO Agent on port ${PORT}`));
