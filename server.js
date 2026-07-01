const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

async function callAI(prompt) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function cleanAIOutput(text) {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/作为.*?专家[，,]/g, '')
    .replace(/基于.*?分析[，,]/g, '')
    .replace(/根据.*?信息[，,]/g, '')
    .replace(/我将.*?评估[，,]/g, '')
    .replace(/本文将.*?进行/g, '进行')
    .replace(/值得注意的是[，,]/g, '')
    .replace(/综上所述[，,]/g, '')
    .replace(/总的来说[，,]/g, '')
    .trim();
}

function extractScore(text) {
  const m = text.match(/(\d+(?:\.\d)?)/);
  return m ? Math.min(10, Math.max(1, parseFloat(m[1]))) : 5;
}

function extractFindings(text, count = 3) {
  const lines = text.split('\n').filter(l => l.trim().length > 15);
  return lines.slice(0, count).map(l => cleanAIOutput(l));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', api: !!DEEPSEEK_KEY }));
app.get('/api/quota', (req, res) => res.json({ dailyLimit: 3, used: 0, remaining: 3 }));

app.post('/api/diagnose', async (req, res) => {
  if (!DEEPSEEK_KEY) return res.status(503).json({ error: 'API未配置' });

  const { brandInfo } = req.body;
  const { brandName, industry, competitors } = brandInfo;
  const comps = (competitors || []).filter(c => c).join('、') || '同行业竞品';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // Dimension 1: AI搜索知名度
    send({ status: 'running', progress: 12, currentPlatform: 'AI搜索知名度', message: '分析品牌在AI搜索中被用户看到的频率...' });
    const r1 = await callAI(`分析品牌"${brandName}"(${industry})在AI搜索(ChatGPT/Kimi/DeepSeek等)中的知名度。用户搜索"${industry}推荐"时，这个品牌被AI提到的概率是多少？和${comps}比怎么样？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s1 = extractScore(r1);
    const findings1 = extractFindings(r1);

    // Dimension 2: 品牌可信度
    send({ status: 'running', progress: 28, currentPlatform: '品牌可信度', message: '评估品牌的专业形象和用户信任度...' });
    const r2 = await callAI(`评估"${brandName}"(${industry})的品牌可信度：有没有专业资质？用户评价怎么样？媒体报道多不多？信息是否透明？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s2 = extractScore(r2);
    const findings2 = extractFindings(r2);

    // Dimension 3: 信息完整度
    send({ status: 'running', progress: 44, currentPlatform: '信息完整度', message: '检查AI能否准确获取品牌的产品、价格、服务信息...' });
    const r3 = await callAI(`评估"${brandName}"(${industry})的信息完整度：AI是否能准确描述这个品牌的产品、价格、服务？官网、社交媒体上的信息是否一致和完整？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s3 = extractScore(r3);
    const findings3 = extractFindings(r3);

    // Dimension 4: AI推荐优先级
    send({ status: 'running', progress: 58, currentPlatform: 'AI推荐优先级', message: '分析品牌在AI回答中被推荐的优先程度...' });
    const r4 = await callAI(`分析"${brandName}"(${industry})在AI生成回答中的推荐位置：AI是直接推荐为首选，还是简单提一下？和${comps}相比，用户看到的推荐顺序是什么？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s4 = extractScore(r4);
    const findings4 = extractFindings(r4);

    // Dimension 5: 市场占位
    send({ status: 'running', progress: 72, currentPlatform: '市场占位', message: '对比竞品在AI搜索中的表现差距...' });
    const r5 = await callAI(`对比"${brandName}"和${comps}在AI搜索中的竞争位置：谁在AI里更出名？各自的优势是什么？这个品牌落后在哪里？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s5 = extractScore(r5);
    const findings5 = extractFindings(r5);

    // Dimension 6: 平台覆盖度
    send({ status: 'running', progress: 86, currentPlatform: '平台覆盖度', message: '检查品牌在各AI平台的覆盖情况...' });
    const r6 = await callAI(`评估"${brandName}"(${industry})在主流AI平台(ChatGPT、Kimi、DeepSeek、百度文心一言)的覆盖情况：哪些平台能找到这个品牌？哪些平台几乎找不到？用大白话给出1-10分评分和3点具体发现。禁止用markdown格式。`);
    const s6 = extractScore(r6);
    const findings6 = extractFindings(r6);

    // Business impact analysis
    send({ status: 'running', progress: 93, currentPlatform: '商业价值分析', message: '评估不优化的潜在损失...' });
    const biz = await callAI(`分析"${brandName}"(${industry})如果不做AI搜索优化，会损失什么？每个月可能流失多少潜在客户？竞品在抢哪些客户？用具体数字和大白话说明。禁止用markdown格式。`);

    // Generate recommendations
    send({ status: 'running', progress: 97, currentPlatform: '优化建议', message: '生成可执行的优化方案...' });
    const rec = await callAI(`针对"${brandName}"(${industry})，给出4条具体的GEO优化建议。每条建议包含：问题是什么、具体怎么做、大概花多少钱、预期有什么效果。按投入产出比从高到低排序。用大白话，禁止用markdown格式。用JSON数组格式：[{"title":"建议标题","problem":"问题描述","action":"具体做法","cost":"费用","effect":"预期效果"}]`);

    let recommendations = [];
    try { recommendations = JSON.parse(rec.match(/\[[\s\S]*\]/)?.[0] || '[]').slice(0, 4); } catch(e) {}
    if (recommendations.length === 0) {
      recommendations = [
        { title: '在知乎/小红书发布专业内容', problem: 'AI搜索找不到足够的品牌信息', action: '每周发布2-3篇专业内容，包含FAQ格式', cost: '每月2000-5000元（内容创作）', effect: '3个月内AI提及率提升50%' },
        { title: '完善百度百科和品牌词条', problem: 'AI对品牌基础信息了解不足', action: '创建/优化百度百科，完善品牌故事和产品信息', cost: '一次性3000-8000元', effect: 'AI信息准确度显著提升' },
        { title: '收集和展示客户真实评价', problem: '品牌可信度信号较弱', action: '引导满意客户在主流平台留下真实评价', cost: '每月1000-3000元（运营激励）', effect: '口碑和推荐优先级提升' },
        { title: '官网添加FAQ和结构化数据', problem: 'AI难以抓取和理解官网信息', action: '添加常见问题页面，实施Schema标记', cost: '一次性5000-10000元（技术开发）', effect: 'AI回答中品牌信息更完整' }
      ];
    }

    // Build dimensions with new names
    const dims = [
      { key: 'awareness', name: 'AI搜索知名度', score: s1, analysis: cleanAIOutput(r1).slice(0, 300), findings: findings1, icon: '🔍' },
      { key: 'trust', name: '品牌可信度', score: s2, analysis: cleanAIOutput(r2).slice(0, 300), findings: findings2, icon: '🛡️' },
      { key: 'info', name: '信息完整度', score: s3, analysis: cleanAIOutput(r3).slice(0, 300), findings: findings3, icon: '📋' },
      { key: 'priority', name: 'AI推荐优先级', score: s4, analysis: cleanAIOutput(r4).slice(0, 300), findings: findings4, icon: '⭐' },
      { key: 'position', name: '市场占位', score: s5, analysis: cleanAIOutput(r5).slice(0, 300), findings: findings5, icon: '📊' },
      { key: 'coverage', name: '平台覆盖度', score: s6, analysis: cleanAIOutput(r6).slice(0, 300), findings: findings6, icon: '🌐' },
    ];

    const overall = Math.round(((s1*0.2 + s2*0.25 + s3*0.2 + s4*0.15 + s5*0.12 + s6*0.08) / 1.0) * 10) / 10;
    const weakest = dims.reduce((min, d) => d.score < min.score ? d : min);

    // Business insight
    const bizClean = cleanAIOutput(biz);
    const lostLeadsMatch = bizClean.match(/(\d+)[\s]*(?:个|位)?[\s]*(?:客户|潜在客户|用户)/);
    const lostLeads = lostLeadsMatch ? lostLeadsMatch[1] + '个/月' : '数十个/月';

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
        summary: bizClean.slice(0, 400),
        lostLeads,
        keyFinding: `您的品牌在${weakest.name}方面得分最低(${weakest.score}/10)，这是最需要优先改进的地方。`
      },
      executiveSummary: [
        `${brandName}的AI搜索综合评分为 ${overall}/10，等级${overall >= 8 ? 'A' : overall >= 6.5 ? 'B' : overall >= 5 ? 'C' : 'D'}。`,
        `最大短板：${weakest.name}（${weakest.score}/10），建议优先投入资源改进。`,
        `如不优化，预计每月流失约${lostLeads}个通过AI搜索来的潜在客户。`,
        `执行前2条高优先级建议，预计1-3个月内可见明显改善。`
      ]
    };

    send({ status: 'completed', progress: 100, report });
    res.end();

  } catch (err) {
    send({ status: 'error', message: err.message });
    res.end();
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GEO Agent on port ${PORT}`));
