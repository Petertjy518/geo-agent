const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

async function callAI(prompt) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.2 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractScore(text) {
  const m = text.match(/(\d+(?:\.\d)?)/);
  return m ? Math.min(10, Math.max(1, parseFloat(m[1]))) : 5;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', api: !!DEEPSEEK_KEY }));

app.get('/api/quota', (req, res) => res.json({ dailyLimit: 3, used: 0, remaining: 3 }));

app.post('/api/diagnose', async (req, res) => {
  if (!DEEPSEEK_KEY) return res.status(503).json({ error: 'API未配置' });
  
  const { brandInfo } = req.body;
  const { brandName, industry, competitors } = brandInfo;
  const comps = (competitors || []).filter(c => c).join('、') || '竞品';
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  try {
    send({ status: 'running', progress: 10, currentPlatform: 'AI认知度分析', message: '分析品牌在AI搜索中的认知度...' });
    const r1 = await callAI(`分析"${brandName}"(${industry})在ChatGPT/Kimi/DeepSeek等AI平台的品牌认知度，与${comps}对比。给出1-10分评分和详细分析。`);
    const s1 = extractScore(r1);
    
    send({ status: 'running', progress: 28, currentPlatform: 'E-E-A-T权威信号', message: '评估品牌的经验、专业度、权威性、可信度...' });
    const r2 = await callAI(`评估"${brandName}"(${industry})的E-E-A-T信号(Experience经验, Expertise专业度, Authoritativeness权威性, Trustworthiness可信度)。给出综合1-10分评分和详细分析。`);
    const s2 = extractScore(r2);
    
    send({ status: 'running', progress: 45, currentPlatform: '信息完整度', message: '评估品牌信息的完整性和结构化程度...' });
    const r3 = await callAI(`评估"${brandName}"(${industry})的信息完整度：产品信息、品牌故事、结构化数据、多平台一致性、时效性。给出1-10分评分和详细分析。`);
    const s3 = extractScore(r3);
    
    send({ status: 'running', progress: 58, currentPlatform: '引用语境质量', message: '分析品牌在AI生成内容中的引用位置和方式...' });
    const r4 = await callAI(`分析"${brandName}"(${industry})在AI生成内容中的引用语境质量：是主推荐(10分)、前三提及(8分)、对比参与者(6分)、品类提及(4分)还是附带提及(2分)。给出1-10分评分。`);
    const s4 = extractScore(r4);
    
    send({ status: 'running', progress: 72, currentPlatform: '竞品竞争位势', message: '分析品牌相对于竞品的AI搜索竞争位势...' });
    const r5 = await callAI(`分析"${brandName}"(${industry})与${comps}在AI搜索可见度方面的竞争位势，预估SoV(声量份额)。给出1-10分评分和详细分析。`);
    const s5 = extractScore(r5);
    
    send({ status: 'running', progress: 86, currentPlatform: '多平台覆盖度', message: '评估品牌跨AI平台的覆盖表现...' });
    const r6 = await callAI(`分析"${brandName}"(${industry})在ChatGPT、Kimi、DeepSeek、Perplexity、Google AI Overviews等平台的覆盖度。给出1-10分评分。`);
    const s6 = extractScore(r6);
    
    send({ status: 'running', progress: 95, currentPlatform: '优化建议', message: '生成个性化GEO优化方案...' });
    const rec = await callAI(`基于${brandName}(${industry})的GEO诊断结果(各维度得分: 认知度${s1}, E-E-A-T${s2}, 信息${s3}, 语境${s4}, 竞争${s5}, 平台${s6})，生成4条优化建议。用JSON格式: [{"priority":"high","title":"...","description":"...","expectedEffect":"...","difficulty":"低","cost":"免费"}]`);
    
    let recommendations = [];
    try { recommendations = JSON.parse(rec.match(/\[[\s\S]*\]/)?.[0] || '[]').slice(0, 4); } catch(e) {}
    if (recommendations.length === 0) {
      recommendations = [
        { priority: 'high', title: 'AI原生内容矩阵建设', description: '在知乎、小红书等平台发布结构化内容，提升AI引用概率。', expectedEffect: '3-6个月AI提及率提升40-60%', difficulty: '中', cost: '内容运营成本' },
        { priority: 'high', title: '权威背书体系构建', description: '完善品牌资质展示，争取行业媒体报导，强化E-E-A-T信号。', expectedEffect: '6个月内品牌权威度显著提升', difficulty: '中', cost: '公关费用' },
        { priority: 'medium', title: '结构化数据优化', description: '实施Schema.org标记，建立FAQ页面，确保多平台信息一致。', expectedEffect: 'AI信息抓取完整度提升50%+', difficulty: '低', cost: '技术成本' },
        { priority: 'medium', title: '差异化价值主张强化', description: '持续强调独特卖点，使AI准确理解和传达品牌价值。', expectedEffect: 'AI推荐语境升级1-2个级别', difficulty: '中', cost: '策划费用' }
      ];
    }
    
    const dims = [
      { dimension: 'AI认知度', dimensionEn: 'AI Brand Awareness', score: s1, maxScore: 10, weight: 0.20, analysis: r1.slice(0, 400), benchmark: s1 >= 7 ? '高于行业平均' : s1 >= 4.5 ? '行业平均水准' : '低于行业平均' },
      { dimension: 'E-E-A-T权威信号', dimensionEn: 'E-E-A-T Authority', score: s2, maxScore: 10, weight: 0.25, analysis: r2.slice(0, 400), benchmark: s2 >= 7 ? 'E-E-A-T信号强' : s2 >= 4.5 ? 'E-E-A-T信号中等' : 'E-E-A-T信号弱' },
      { dimension: '信息完整度', dimensionEn: 'Information Richness', score: s3, maxScore: 10, weight: 0.20, analysis: r3.slice(0, 400), benchmark: s3 >= 7 ? '信息架构完善' : s3 >= 4.5 ? '信息基本完整' : '信息缺失严重' },
      { dimension: '引用语境质量', dimensionEn: 'Citation Context', score: s4, maxScore: 10, weight: 0.15, analysis: r4.slice(0, 400), benchmark: s4 >= 7 ? '推荐优先级高' : s4 >= 4.5 ? '推荐优先级中等' : '推荐优先级低' },
      { dimension: '竞品竞争位势', dimensionEn: 'Competitive Position', score: s5, maxScore: 10, weight: 0.12, analysis: r5.slice(0, 400), benchmark: s5 >= 7 ? '竞争优势明显' : s5 >= 4.5 ? '竞争位势中等' : '竞争位势较弱' },
      { dimension: '多平台覆盖度', dimensionEn: 'Platform Coverage', score: s6, maxScore: 10, weight: 0.08, analysis: r6.slice(0, 400), benchmark: s6 >= 7 ? '多平台覆盖良好' : s6 >= 4.5 ? '部分平台有覆盖' : '平台覆盖不足' },
    ];
    
    const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
    const weightedSum = dims.reduce((s, d) => s + d.score * d.weight, 0);
    const overall = Math.round((weightedSum / totalWeight) * 10) / 10;
    
    const report = {
      id: `GEO-${Date.now()}`,
      brandInfo,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      overallScore: overall,
      riskLevel: overall < 4.5 ? 'high' : overall < 6.5 ? 'medium' : 'low',
      riskLabel: overall < 4.5 ? '高风险' : overall < 6.5 ? '中风险' : '低风险',
      riskColor: overall < 4.5 ? '#ef4444' : overall < 6.5 ? '#f59e0b' : '#10b981',
      radarData: dims.map(d => ({ dimension: d.dimension, score: d.score, fullMark: 10 })),
      dimensions: dims,
      recommendations: recommendations.map((r, i) => ({ ...r, id: i + 1, timeline: r.difficulty === '低' ? '1-2周' : r.difficulty === '中' ? '1-3个月' : '3-6个月' })),
      summary: [
        `${brandName}（${industry}）的综合GEO得分为 **${overall}/10**。`,
        `优势维度：**${dims.reduce((m,d)=>d.score>m.score?d:m).dimension}**（${dims.reduce((m,d)=>d.score>m.score?d:m).score}/10）。`,
        `薄弱维度：**${dims.reduce((m,d)=>d.score<m.score?d:m).dimension}**（${dims.reduce((m,d)=>d.score<m.score?d:m).score}/10），建议优先优化。`,
      ],
      methodology: { framework: 'Princeton/MIT GEO Framework + E-E-A-T Guidelines', dimensions: 6, aiModel: 'DeepSeek-V3', dataSource: 'AI深度分析' },
    };
    
    send({ status: 'completed', progress: 100, currentPlatform: '完成', message: '诊断完成！', report });
    res.end();
    
  } catch (err) {
    send({ status: 'error', message: err.message });
    res.end();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GEO Agent running on port ${PORT}, API: ${DEEPSEEK_KEY ? 'OK' : 'MISSING'}`));
