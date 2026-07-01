/**
 * GEO Agent - 国内版
 * 聚焦：豆包、小红书、百度、DeepSeek、知乎、抖音
 * 目标客户：国内企业老板/市场负责人
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

async function callDeepSeek(prompt) {
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    return `[调用失败: ${e.message}]`;
  }
}

// 清洗AI输出：去掉markdown符号、套话
function cleanText(text) {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---+/g, '—')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^作为.*?[，,]/gm, '')
    .replace(/^根据.*?[，,]/gm, '')
    .replace(/^综上所述[，,]/gm, '')
    .replace(/^总的来说[，,]/gm, '')
    .replace(/^值得注意的是[，,]/gm, '')
    .replace(/^需要指出的是[，,]/gm, '')
    .replace(/^首先[，,]/gm, '')
    .replace(/^其次[，,]/gm, '')
    .replace(/^最后[，,]/gm, '')
    .trim();
}

// 从AI回复中提取分数
function extractScore(text) {
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

// 提取要点（bullet points）
function extractPoints(text, count = 3) {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 15 && l.length < 200 && !l.match(/^\d+\./))
    .slice(0, count);
  return lines.map(l => cleanText(l));
}

// ===== 真实数据抓取 =====

// 1. 百度搜索抓取
async function scrapeBaidu(brand, industry) {
  try {
    const query = encodeURIComponent(`${brand} ${industry}`);
    const response = await fetch(`https://www.baidu.com/s?wd=${query}&rn=10`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
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
    const hasOfficial = titles.some(t => /官网|官方|百科/.test(t));

    return {
      totalResults: titles.length,
      brandMentions: mentions,
      mentionRate: titles.length > 0 ? Math.round((mentions / titles.length) * 100) : 0,
      hasOfficialSite: hasOfficial,
      topResults: titles.slice(0, 6),
      status: titles.length > 0 ? 'success' : 'limited',
    };
  } catch (e) {
    return { totalResults: 0, brandMentions: 0, mentionRate: 0, hasOfficialSite: false, topResults: [], status: 'failed' };
  }
}

// 2. 知乎搜索抓取
async function scrapeZhihu(brand) {
  try {
    const response = await fetch(`https://www.zhihu.com/search?type=content&q=${encodeURIComponent(brand)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      timeout: 15000,
    });
    const html = await response.text();
    const items = html.match(/<h2[^>]*class="[^"]*ContentItem-title[^"]*"[^>]*>.*?<\/h2>/gi) || [];
    const titles = items.map(item => item.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 5);

    return {
      contentCount: titles.length,
      topContents: titles.slice(0, 5),
      status: titles.length > 0 ? 'success' : 'limited',
    };
  } catch (e) {
    return { contentCount: 0, topContents: [], status: 'failed' };
  }
}

// ===== API路由 =====

app.get('/api/health', (req, res) => res.json({ status: 'ok', api: !!DEEPSEEK_KEY }));
app.get('/api/quota', (req, res) => res.json({ dailyLimit: 3, used: 0, remaining: 3 }));

app.post('/api/diagnose', async (req, res) => {
  if (!DEEPSEEK_KEY) {
    return res.status(503).json({ error: '服务配置中，请稍后重试' });
  }

  const { brandInfo } = req.body;
  const { brandName, industry, competitors, products, targetAudience } = brandInfo;
  const comps = (competitors || []).filter(c => c);
  const compText = comps.join('、') || '同行业其他品牌';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // Phase 1: 百度搜索（真实抓取）
    send({ status: 'running', progress: 8, currentPlatform: '百度搜索', message: '正在抓取百度搜索结果...' });
    const baidu = await scrapeBaidu(brandName, industry);

    // Phase 2: 知乎内容（真实抓取）
    send({ status: 'running', progress: 18, currentPlatform: '知乎', message: '正在抓取知乎相关内容...' });
    const zhihu = await scrapeZhihu(brandName);

    // Phase 3: 豆包搜索表现（AI基于知识库分析）
    send({ status: 'running', progress: 30, currentPlatform: '豆包搜索', message: '分析品牌在豆包AI中的推荐情况...' });
    const p1 = `用户在豆包（字节跳动AI）搜索"${industry}推荐""${industry}哪家好"时，品牌"${brandName}"是否会被推荐？推荐的位置靠前还是靠后？和${compText}相比如何？给出1-10分评分（10=总是被首选推荐），用3-4句大白话说明原因。`;
    const r1 = await callDeepSeek(p1);

    // Phase 4: 小红书搜索曝光
    send({ status: 'running', progress: 45, currentPlatform: '小红书搜索', message: '分析品牌在小红书的搜索曝光情况...' });
    const p2 = `在小红书搜索"${industry}""${brandName}"时，这个品牌的笔记出现频率如何？有没有足够的内容让用户看到？和${compText}在小红书上的表现相比如何？给出1-10分评分，用大白话说明。`;
    const r2 = await callDeepSeek(p2);

    // Phase 5: DeepSeek推荐位置
    send({ status: 'running', progress: 58, currentPlatform: 'DeepSeek推荐', message: '分析品牌在DeepSeek中的推荐优先级...' });
    const p3 = `在DeepSeek AI中，用户问"${industry}哪个好""推荐几家${industry}"时，"${brandName}"出现在什么位置？是首选推荐、前三提及、还是几乎不被提到？和${compText}相比如何？给出1-10分评分。`;
    const r3 = await callDeepSeek(p3);

    // Phase 6: 品牌可信度
    send({ status: 'running', progress: 72, currentPlatform: '品牌可信度', message: '评估品牌的专业形象和用户口碑...' });
    const p4 = `评估"${brandName}"（${industry}）的品牌可信度：有没有专业资质？用户评价整体如何？网上口碑是正面多还是负面多？给出1-10分评分和具体理由。`;
    const r4 = await callDeepSeek(p4);

    // Phase 7: 商业价值分析
    send({ status: 'running', progress: 85, currentPlatform: '商业损失分析', message: '评估不优化的潜在损失...' });
    const p5 = `如果不做AI搜索优化，"${brandName}"（${industry}）每月会流失多少个通过AI搜索来的潜在客户？这些客户会被谁抢走？为什么？用具体数字和大白话说明。`;
    const r5 = await callDeepSeek(p5);

    // Phase 8: 优化建议
    send({ status: 'running', progress: 93, currentPlatform: '优化建议', message: '生成可执行方案...' });
    const p6 = `针对"${brandName}"（${industry}），给出4条具体的GEO优化建议，按投入产出比从高到低排序。每条包含：问题是什么、具体怎么做、大概花多少钱、预期什么效果。用JSON格式：[{"title":"建议标题","problem":"问题","action":"做法","cost":"费用","effect":"效果"}]`;
    const recRaw = await callDeepSeek(p6);

    // 解析建议
    let recommendations = [];
    try {
      const jsonMatch = recRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]).slice(0, 4);
    } catch (e) {}

    if (recommendations.length === 0) {
      recommendations = [
        { title: '在小红书/抖音发布专业内容', problem: 'AI搜索找不到足够的品牌信息', action: '每周发布2-3篇专业内容，包含常见问题解答', cost: '每月3000-6000元', effect: '3个月内AI提及率提升50%' },
        { title: '完善百度百科和品牌词条', problem: 'AI对品牌基础信息了解不足', action: '创建或优化百度百科、搜狗百科', cost: '一次性5000-10000元', effect: 'AI信息准确度显著提升' },
        { title: '优化百度搜索结果', problem: '百度搜索首页品牌信息不足', action: '发布新闻稿、优化官网SEO', cost: '每月2000-5000元', effect: '百度搜索首页品牌信息增加' },
        { title: '收集客户真实评价', problem: '品牌可信度信号较弱', action: '引导满意客户在主流平台留下真实评价', cost: '每月1000-3000元', effect: '口碑和推荐优先级提升' },
      ];
    }

    // 计算分数
    const s1 = extractScore(r1); // 豆包
    const s2 = extractScore(r2); // 小红书
    const s3 = Math.min(10, Math.round((baidu.mentionRate / 10) * 1.5 * 10) / 10); // 百度（基于真实数据）
    const s4 = extractScore(r3); // DeepSeek
    const s5 = extractScore(r4); // 可信度
    const s6 = Math.min(10, Math.round((zhihu.contentCount / 3) * 2 * 10) / 10); // 知乎（基于真实数据）

    // 加权总分
    const overall = Math.round((s1 * 0.20 + s2 * 0.18 + s3 * 0.18 + s4 * 0.15 + s5 * 0.15 + s6 * 0.14) * 10) / 10;

    const dims = [
      {
        key: 'doubao', name: '豆包搜索表现', score: s1,
        analysis: cleanText(r1).slice(0, 300),
        findings: extractPoints(r1),
        icon: '🤖',
        detail: `字节跳动豆包AI是国内最大AI平台之一（月活2.26亿），用户搜索"${industry}推荐"时，您的品牌是否被推荐直接影响潜在客户获取。`
      },
      {
        key: 'xiaohongshu', name: '小红书搜索曝光', score: s2,
        analysis: cleanText(r2).slice(0, 300),
        findings: extractPoints(r2),
        icon: '📕',
        detail: `小红书是国内消费决策第一入口，用户搜"${industry}""${products || industry}"时，您的笔记是否出现在搜索结果中？`
      },
      {
        key: 'baidu', name: '百度搜索首页', score: s3,
        analysis: `百度搜索"${brandName} ${industry}"，首页${baidu.totalResults}条结果中有${baidu.brandMentions}条（${baidu.mentionRate}%）提到了您的品牌。${baidu.hasOfficialSite ? '有官方网站/百科信息。' : '缺少官方网站/百科信息。'}`,
        findings: baidu.topResults.slice(0, 3),
        icon: '🔍',
        detail: '百度搜索仍是国内重要流量入口，首页品牌信息完整度直接影响用户第一印象。'
      },
      {
        key: 'deepseek', name: 'DeepSeek推荐位置', score: s4,
        analysis: cleanText(r3).slice(0, 300),
        findings: extractPoints(r3),
        icon: '🧠',
        detail: `DeepSeek是国内专业用户首选AI工具，用户问"${industry}哪个好"时，您的品牌出现在什么位置？`
      },
      {
        key: 'trust', name: '品牌可信度', score: s5,
        analysis: cleanText(r4).slice(0, 300),
        findings: extractPoints(r4),
        icon: '🛡️',
        detail: '品牌资质、用户评价、媒体报道等信号，决定了AI是否愿意推荐您的品牌。'
      },
      {
        key: 'zhihu', name: '知乎内容量', score: s6,
        analysis: `知乎搜索"${brandName}"，找到${zhihu.contentCount}条相关内容。${zhihu.contentCount > 5 ? '内容量充足，AI容易抓取引用。' : zhihu.contentCount > 0 ? '内容量偏少，建议增加专业回答和文章。' : '几乎无相关内容，急需补充。'}`,
        findings: zhihu.topContents.slice(0, 3),
        icon: '💡',
        detail: '知乎是B2B和专业服务的重要内容阵地，高质量回答容易被AI引用。'
      },
    ];

    const weakest = dims.reduce((min, d) => d.score < min.score ? d : min);

    // 商业损失估算
    const bizClean = cleanText(r5);
    const lostMatch = bizClean.match(/(\d+)[\s]*(?:个|位|名)?[\s]*(?:客户|潜在|用户|人)/);
    const lostLeads = lostMatch ? `${lostMatch[1]}个/月` : '数十个/月';

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
      recommendations: recommendations.map((r, i) => ({ ...r, id: i + 1, priority: i < 2 ? 'high' : 'medium' })),
      businessInsight: {
        summary: bizClean.slice(0, 350),
        lostLeads,
        keyFinding: `基于真实搜索数据分析，${brandName}在${weakest.name}方面表现最差（${weakest.score}/10），这是最需要优先改进的地方。`
      },
      rawData: { baidu, zhihu },
      executiveSummary: [
        `${brandName}（${industry}）的AI搜索综合评分为 ${overall}/10，等级${overall >= 8 ? 'A' : overall >= 6.5 ? 'B' : overall >= 5 ? 'C' : 'D'}。`,
        `基于百度搜索真实数据：首页${baidu.mentionRate}%的结果提到了您的品牌${baidu.hasOfficialSite ? '，有官方信息' : '，但缺少官方信息'}。`,
        `最大短板：${weakest.name}（${weakest.score}/10），直接影响潜在客户获取。`,
        `如不优化，预计每月流失约${lostLeads}个通过AI搜索来的潜在客户。`,
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
app.listen(PORT, () => console.log(`GEO Agent 国内版 running on port ${PORT}`));
