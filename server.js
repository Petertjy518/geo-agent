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
    new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeoutMs))
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
        max_tokens: 2000,
        temperature: 0.1
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    return `[调用失败: ${e.message}]`;
  }
}

// ===== 强力清洗：去掉所有AI套话和markdown =====
function cleanText(text) {
  if (!text || text.length < 5) return '暂无分析数据';
  
  let cleaned = text;
  
  // 第一步：去掉markdown符号
  cleaned = cleaned.replace(/#{1,6}\s*/g, '');
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/---+/g, ' ');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // 第二步：去掉AI套话开头
  cleaned = cleaned.replace(/^好的[,，]?/gm, '');
  cleaned = cleaned.replace(/^作为.*?专家[,，]?/gm, '');
  cleaned = cleaned.replace(/^根据.*?[，,]/gm, '');
  cleaned = cleaned.replace(/^基于.*?[，,]/gm, '');
  cleaned = cleaned.replace(/^以下是.*?[：:]/gm, '');
  cleaned = cleaned.replace(/^以下是/gm, '');
  cleaned = cleaned.replace(/^以下/gm, '');
  cleaned = cleaned.replace(/^.*?分析如下[：:]/gm, '');
  cleaned = cleaned.replace(/^.*?评估如下[：:]/gm, '');
  cleaned = cleaned.replace(/^.*?结果如下[：:]/gm, '');
  
  // 第三步：去掉AI套话结尾
  cleaned = cleaned.replace(/综上所述[，,。.]/g, '');
  cleaned = cleaned.replace(/总的来说[，,。.]/g, '');
  cleaned = cleaned.replace(/总体而言[，,。.]/g, '');
  cleaned = cleaned.replace(/值得注意的是[，,]/g, '');
  cleaned = cleaned.replace(/需要指出的是[，,]/g, '');
  cleaned = cleaned.replace(/综上所述.*?$/gm, '');
  
  // 第四步：去掉序号和列表符号（保留内容）
  cleaned = cleaned.replace(/^\d+[.、．]\s*/gm, '');
  cleaned = cleaned.replace(/^[-•·]\s*/gm, '');
  
  // 第五步：清理多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\s+/gm, '');
  
  // 第六步：去掉英文术语混排
  cleaned = cleaned.replace(/\(.*?\)/g, '');
  cleaned = cleaned.replace（/Primary Recommendation|Top 3 Mention|Comparison Participant|Category Mention|Passing Reference/g, '');
  
  return cleaned.trim() || '暂无分析数据';
}

// 提取要点（从清洗后的文本中提取有意义的句子）
function extractPoints(text, count = 3) {
  if (!text || text.length < 10) return ['数据获取中，暂无可展示要点'];
  
  const cleaned = cleanText(text);
  // 按句号、问号、感叹号分割
  const sentences = cleaned
    .split(/[。！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 120)
    .filter(s => !s.match(/^(评分|得分|分数|结论|总结)/))
    .slice(0, count);
  
  if (sentences.length === 0) {
    // 如果分句失败，按行分割
    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 15 && l.length < 120);
    return lines.slice(0, count).length > 0 ? lines.slice(0, count) : ['数据获取中，暂无可展示要点'];
  }
  
  return sentences;
}

// 提取分数
function extractScore(text) {
  if (!text) return 5;
  const patterns = [
    /(\d+(?:\.\d)?)\s*分/,
    /(\d+(?:\.\d)?)\s*\/\s*10/,
    /评分[:：]?\s*(\d+(?:\.\d)?)/,
    /得分[:：]?\s*(\d+(?:\.\d)?)/,
    /给.*?(\d+(?:\.\d)?).*?分/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const s = parseFloat(m[1]);
      if (s >= 1 && s <= 10) return Math.round(s * 10) / 10;
    }
  }
  return 5;
}

// ===== 百度搜索抓取 =====
async function scrapeBaidu(brand, industry) {
  try {
    const response = await fetchWithTimeout(`https://www.baidu.com/s?wd=${encodeURIComponent(brand + ' ' + industry)}&rn=10`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    const html = await response.text();
    const titles = [];
    const blocks = html.match(/<h3[^>]*class="[^"]*t[^"]*"[^>]*>.*?<\/h3>/gi) || [];
    for (const block of blocks) {
      const text = block.replace(/<[^>]+>/g, '').trim();
      if (text && text.length > 5) titles.push(text);
    }
    const brandLower = brand.toLowerCase();
    const mentions = titles.filter(t => t.toLowerCase().includes(brandLower)).length;
    return {
      totalResults: titles.length,
      brandMentions: mentions,
      mentionRate: titles.length > 0 ? Math.round((mentions / titles.length) * 100) : 0,
      hasOfficialSite: titles.some(t => /官网|官方|百科/.test(t)),
      topResults: titles.slice(0, 6),
      status: titles.length > 0 ? 'success' : 'limited',
    };
  } catch (e) {
    return { totalResults: 0, brandMentions: 0, mentionRate: 0, hasOfficialSite: false, topResults: [], status: 'failed' };
  }
}

// ===== 知乎搜索抓取 =====
async function scrapeZhihu(brand) {
  try {
    const response = await fetchWithTimeout(`https://www.zhihu.com/search?type=content&q=${encodeURIComponent(brand)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
    });
    const html = await response.text();
    const items = html.match(/<h2[^>]*class="[^"]*ContentItem-title[^"]*"[^>]*>.*?<\/h2>/gi) || [];
    const titles = items.map(item => item.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 5);
    return { contentCount: titles.length, topContents: titles.slice(0, 5), status: titles.length > 0 ? 'success' : 'limited' };
  } catch (e) {
    return { contentCount: 0, topContents: [], status: 'failed' };
  }
}

// ===== API路由 =====
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
    // Phase 1: 百度搜索（真实抓取）
    send({ status: 'running', progress: 5, currentPlatform: '百度搜索', message: '正在抓取百度搜索结果...' });
    const baidu = await scrapeBaidu(brandName, industry);

    // Phase 2: 知乎（真实抓取）
    send({ status: 'running', progress: 15, currentPlatform: '知乎', message: '正在抓取知乎相关内容...' });
    const zhihu = await scrapeZhihu(brandName);

    // Phase 3: 豆包搜索表现
    send({ status: 'running', progress: 30, currentPlatform: '豆包搜索', message: '分析品牌在豆包AI中的推荐情况...' });
    const r1 = await callDeepSeek(`用户在豆包（字节跳动AI）搜索"${industry}推荐""${industry}哪家好"时，品牌"${brandName}"是否会被推荐？和${compText}相比如何？给出1-10分评分，用3句大白话说明原因。不要写"作为专家"等套话。`);

    // Phase 4: 小红书
    send({ status: 'running', progress: 45, currentPlatform: '小红书搜索', message: '分析品牌在小红书的搜索曝光...' });
    const r2 = await callDeepSeek(`在小红书搜索"${industry}""${brandName}"时，这个品牌的笔记出现频率如何？和${compText}相比如何？给出1-10分评分，用3句大白话。不要套话。`);

    // Phase 5: DeepSeek推荐
    send({ status: 'running', progress: 58, currentPlatform: 'DeepSeek推荐', message: '分析品牌在DeepSeek中的推荐优先级...' });
    const r3 = await callDeepSeek(`在DeepSeek AI中，用户问"${industry}哪个好"时，"${brandName}"出现在什么位置？和${compText}相比？给出1-10分评分，用3句大白话。不要套话。`);

    // Phase 6: 品牌可信度
    send({ status: 'running', progress: 72, currentPlatform: '品牌可信度', message: '评估品牌的专业形象和口碑...' });
    const r4 = await callDeepSeek(`"${brandName}"（${industry}）的品牌可信度如何？用户评价怎么样？网上口碑正面多还是负面多？给出1-10分评分，用3句大白话。不要套话。`);

    // Phase 7: 商业损失
    send({ status: 'running', progress: 85, currentPlatform: '商业损失分析', message: '评估不优化的潜在损失...' });
    const r5 = await callDeepSeek(`如果不做AI搜索优化，"${brandName}"（${industry}）每月会流失多少个通过AI搜索来的潜在客户？为什么？给出具体数字，用大白话说明。不要套话。`);

    // Phase 8: 优化建议
    send({ status: 'running', progress: 93, currentPlatform: '优化建议', message: '生成可执行方案...' });
    const r6 = await callDeepSeek(`针对"${brandName}"（${industry}），给出4条具体的优化建议。按投入产出比排序。每条格式：标题+问题+做法+费用+效果。不要套话。`);

    // 计算分数
    const s1 = extractScore(r1);
    const s2 = extractScore(r2);
    const s3 = Math.min(10, Math.round((baidu.mentionRate / 10) * 1.5 * 10) / 10);
    const s4 = extractScore(r3);
    const s5 = extractScore(r4);
    const s6 = Math.min(10, Math.round((zhihu.contentCount / 3) * 2 * 10) / 10);
    
    const overall = Math.round((s1 * 0.20 + s2 * 0.18 + s3 * 0.18 + s4 * 0.15 + s5 * 0.15 + s6 * 0.14) * 10) / 10;

    // 清洗所有分析文本
    const clean1 = cleanText(r1);
    const clean2 = cleanText(r2);
    const clean3 = cleanText(r3);
    const clean4 = cleanText(r4);
    const clean5 = cleanText(r5);
    const clean6 = cleanText(r6);

    // 提取要点
    const findings1 = extractPoints(r1);
    const findings2 = extractPoints(r2);
    const findings3 = extractPoints(r3);
    const findings4 = extractPoints(r4);
    const findings5 = extractPoints(r5);

    // 解析建议（简单解析）
    let recommendations = [];
    try {
      const lines = clean6.split('\n').filter(l => l.trim().length > 10);
      // 尝试提取4条建议
      const recTexts = [];
      let currentRec = '';
      for (const line of lines) {
        if (line.match(/^\d+[.、]/) || line.match(/^(建议|第)/)) {
          if (currentRec) recTexts.push(currentRec);
          currentRec = line;
        } else if (currentRec) {
          currentRec += ' ' + line;
        }
      }
      if (currentRec) recTexts.push(currentRec);
      
      for (let i = 0; i < Math.min(4, recTexts.length); i++) {
        const text = recTexts[i];
        recommendations.push({
          id: i + 1,
          title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
          problem: text.slice(0, 80),
          action: text.slice(0, 100),
          cost: '详询服务商',
          effect: '提升品牌AI搜索可见度',
          priority: i < 2 ? 'high' : 'medium'
        });
      }
    } catch (e) {}

    // 默认建议
    if (recommendations.length === 0) {
      recommendations = [
        { id: 1, title: '在小红书/抖音发布专业内容', problem: 'AI搜索找不到足够的品牌信息', action: '每周发布2-3篇专业内容，包含常见问题解答', cost: '每月3000-6000元', effect: '3个月内AI提及率提升50%', priority: 'high' },
        { id: 2, title: '完善百度百科和品牌词条', problem: 'AI对品牌基础信息了解不足', action: '创建或优化百度百科、搜狗百科', cost: '一次性5000-10000元', effect: 'AI信息准确度显著提升', priority: 'high' },
        { id: 3, title: '优化百度搜索结果', problem: '百度搜索首页品牌信息不足', action: '发布新闻稿、优化官网SEO', cost: '每月2000-5000元', effect: '百度搜索首页品牌信息增加', priority: 'medium' },
        { id: 4, title: '收集客户真实评价', problem: '品牌可信度信号较弱', action: '引导满意客户在主流平台留下真实评价', cost: '每月1000-3000元', effect: '口碑和推荐优先级提升', priority: 'medium' }
      ];
    }

    // 提取流失客户数
    const lostMatch = clean5.match(/(\d+)/);
    const lostLeads = lostMatch ? `${lostMatch[1]}个/月` : '数十个/月';

    // 确定最弱维度
    const dimScores = [
      { key: 'doubao', name: '豆包搜索表现', score: s1 },
      { key: 'xiaohongshu', name: '小红书搜索曝光', score: s2 },
      { key: 'baidu', name: '百度搜索首页', score: s3 },
      { key: 'deepseek', name: 'DeepSeek推荐位置', score: s4 },
      { key: 'trust', name: '品牌可信度', score: s5 },
      { key: 'zhihu', name: '知乎内容量', score: s6 },
    ];
    const weakest = dimScores.reduce((min, d) => d.score < min.score ? d : min);

    const dims = [
      { key: 'doubao', name: '豆包搜索表现', score: s1, analysis: clean1, findings: findings1, icon: '🤖', detail: '字节跳动豆包AI是国内最大AI平台之一，用户搜索时您的品牌是否被推荐' },
      { key: 'xiaohongshu', name: '小红书搜索曝光', score: s2, analysis: clean2, findings: findings2, icon: '📕', detail: '小红书是国内消费决策第一入口，您的笔记是否出现在搜索结果中' },
      { key: 'baidu', name: '百度搜索首页', score: s3, analysis: `百度搜索"${brandName}"，首页${baidu.totalResults}条结果中有${baidu.brandMentions}条（${baidu.mentionRate}%）提到了您的品牌`, findings: baidu.topResults.slice(0, 3), icon: '🔍', detail: '百度搜索仍是重要流量入口，首页品牌信息完整度影响用户第一印象' },
      { key: 'deepseek', name: 'DeepSeek推荐位置', score: s4, analysis: clean3, findings: findings3, icon: '🧠', detail: 'DeepSeek是国内专业用户首选AI工具，用户问哪家好时您的位置' },
      { key: 'trust', name: '品牌可信度', score: s5, analysis: clean4, findings: findings4, icon: '🛡️', detail: '品牌资质、用户评价、媒体报道等信号，决定AI是否愿意推荐您' },
      { key: 'zhihu', name: '知乎内容量', score: s6, analysis: `知乎搜索"${brandName}"，找到${zhihu.contentCount}条相关内容`, findings: zhihu.topContents.slice(0, 3), icon: '💡', detail: '知乎是B2B和专业服务的重要阵地，高质量回答容易被AI引用' },
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
        summary: clean5.slice(0, 300),
        lostLeads: lostLeads,
        keyFinding: `您的品牌在${weakest.name}方面表现最差（${weakest.score}/10），这是最需要优先改进的地方。`
      },
      dataSources: {
        realtime: [
          { platform: '百度搜索', method: '实时抓取搜索结果页面', status: baidu.status === 'success' ? '已抓取' : '抓取受限' },
          { platform: '知乎', method: '实时抓取搜索内容', status: zhihu.status === 'success' ? '已抓取' : '抓取受限' },
        ],
        aiAnalysis: [
          { platform: '豆包搜索表现', method: 'DeepSeek AI基于训练数据分析', note: '豆包暂无公开搜索API，由AI基于公开信息判断趋势' },
          { platform: '小红书搜索曝光', method: 'DeepSeek AI基于训练数据分析', note: '小红书反爬虫严格，由AI基于公开信息判断趋势' },
          { platform: 'DeepSeek推荐', method: 'DeepSeek AI自我评估', note: '基于AI对品牌公开信息的理解程度评估' },
          { platform: '品牌可信度', method: 'DeepSeek AI综合评估', note: '基于品牌资质、口碑、媒体等公开信息评估' },
        ]
      },
      executiveSummary: [
        `${brandName}（${industry}）的AI搜索综合评分为 ${overall}/10，等级${overall >= 8 ? 'A' : overall >= 6.5 ? 'B' : overall >= 5 ? 'C' : 'D'}。`,
        `百度搜索（真实抓取）：首页${baidu.mentionRate}%的结果提到了您的品牌。`,
        `知乎（真实抓取）：找到${zhihu.contentCount}条相关内容。`,
        `最大短板：${weakest.name}（${weakest.score}/10），建议优先改进。`,
        `如不优化，预计每月流失约${lostLeads}潜在客户。`,
        `执行前2条建议，预计1-3个月内可见明显改善。`
      ]
    };

    send({ status: 'completed', progress: 100, report });
    res.end();

  } catch (err) {
    console.error('Diagnosis error:', err);
    send({ status: 'error', message: `诊断出错: ${err.message}` });
    res.end();
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GEO Agent on port ${PORT}`));
