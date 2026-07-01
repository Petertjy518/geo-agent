/**
 * GEO Diagnosis Engine v2.0 - Professional Edition
 * Based on: Princeton/MIT GEO Framework, E-E-A-T Guidelines, "Two Cores + Four Drivers" Methodology
 * References: arXiv:2311.09735, Search Engine Land 2026, Omnicom Media Group Research
 */

const fetch = require('node-fetch');

// ============================================
// 1. DeepSeek API Integration
// ============================================

async function callDeepSeek(apiKey, prompt, maxTokens = 2000) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('DeepSeek API error:', e.message);
    return `[API Error: ${e.message}]`;
  }
}

// ============================================
// 2. Prompt Engineering - Professional GEO Queries
// ============================================

function buildAIAwarenessPrompt(brand, industry, products, competitors) {
  const compList = competitors.filter(c => c).join('、') || '同行业其他品牌';
  return `你是一位GEO（生成式引擎优化）研究专家。请模拟分析品牌"${brand}"在主流AI搜索引擎（ChatGPT、Kimi、DeepSeek、Perplexity）中的品牌认知度。

【品牌信息】
- 行业：${industry}
- 产品/服务：${products || industry + '相关产品'}
- 主要竞品：${compList}

【分析任务】
请基于你对AI搜索引擎训练数据的了解，分析以下方面：

1. 当用户在AI平台询问"${industry}推荐""最好的${industry}品牌""${industry}哪个好"时，${brand}被提及的概率和频率
2. ${brand}在AI回答中的位置（首选推荐/前3提及/附带提及/未被提及）
3. AI对${brand}的了解程度（是否能准确描述其产品、定位、特点）
4. 与竞品${compList}相比，${brand}在AI推荐中的相对位置

请给出详细的专业分析，包含具体数据和推理过程。`;
}

function buildEEATPrompt(brand, industry, products, targetAudience) {
  return `你是一位数字权威评估专家。请根据公开信息评估品牌"${brand}"（${industry}）的E-E-A-T信号强度。

E-E-A-T是Google和AI搜索引擎评估内容质量的核心框架：
- E (Experience/经验)：是否有第一手实践经验
- E (Expertise/专业度)：是否具备专业知识和技能  
- A (Authoritativeness/权威性)：是否被行业认可为权威来源
- T (Trustworthiness/可信度)：信息是否可信、准确、透明

【评估任务】
请从以下维度评估${brand}的E-E-A-T信号：

1. **Experience信号**：品牌是否有明确的产品使用场景展示、用户案例、实操经验分享？
2. **Expertise信号**：品牌是否展示专业资质、技术专利、行业认证、专家团队？
3. **Authoritativeness信号**：品牌是否获得行业奖项、媒体报导、第三方背书、权威引用？
4. **Trustworthiness信号**：品牌信息是否透明（公司信息、联系方式、隐私政策）、用户评价如何、是否有负面舆情？

请给出每个维度的1-10分评分，并附详细分析。`;
}

function buildInfoRichnessPrompt(brand, industry, products) {
  return `你是一位信息架构分析师。请评估品牌"${brand}"（${industry}）的信息完整度——即AI搜索引擎能够获取和理解的关于该品牌的信息丰富程度。

【评估维度】
1. **产品信息完整度**：AI是否能准确描述${brand}的产品线、核心功能、价格区间、适用人群？
2. **品牌故事清晰度**：AI是否能正确描述${brand}的品牌定位、创立背景、核心价值主张？
3. **结构化数据质量**：品牌官网是否有良好的Schema标记、FAQ、结构化内容便于AI解析？
4. **多平台信息一致性**：品牌在各平台（官网、社交媒体、电商平台、新闻）的信息是否一致、不矛盾？
5. **时效性**：品牌信息是否保持更新（最新产品、最新动态）？

请给出每个维度1-10分评分和详细分析。`;
}

function buildCitationContextPrompt(brand, industry, competitors) {
  const compList = competitors.filter(c => c).join('、') || '竞品';
  return `你是一位GEO语境分析专家。请分析品牌"${brand}"（${industry}）在AI生成内容中的引用语境质量。

引用语境质量分级标准（行业通用）：
- **Primary Recommendation (主推荐)** 10/10：AI直接推荐"${brand}是最好的选择"
- **Top 3 Mention (前三提及)** 8/10：AI将${brand}列为"领先选项之一"
- **Comparison Participant (对比参与者)** 6/10：AI在对比中提到"${brand} vs ${compList}"
- **Category Mention (品类提及)** 4/10：AI说"该品类包括${brand}等"
- **Passing Reference (附带提及)** 2/10：AI简单提到"一些替代方案有${brand}"

【分析任务】
1. 评估${brand}在AI回答中最可能出现的语境级别
2. 分析影响语境质量的因素（品牌知名度、差异化程度、口碑等）
3. 与${compList}相比，${brand}的语境质量如何？
4. 给出提升语境质量的具体建议

请给出1-10分的综合语境质量评分。`;
}

function buildCompetitivePositionPrompt(brand, industry, competitors) {
  const compList = competitors.filter(c => c).join('、') || '行业内其他品牌';
  return `你是一位竞争情报分析师。请分析${industry}行业中${brand}与${compList}在AI搜索可见度方面的竞争位势。

【分析框架：AI声量份额 Share of Voice】
SoV = (品牌被AI提及次数 / 品类总提及次数) × 100%

【分析任务】
1. 评估在AI搜索引擎中，${brand}与${compList}各自的可见度排名
2. 分析各品牌在AI推荐中的核心优势领域
3. 评估${brand}相对于竞品的差异化竞争位势
4. 给出${brand}在AI搜索竞争中应采取的策略定位

竞争位势分级：
- 领导者 (Leader)：30-45% SoV
- 主要竞争者 (Major)：15-30% SoV
- 挑战者 (Challenger)：5-15% SoV
- 利基玩家 (Niche)：<5% SoV

请为每个竞争品牌给出SoV预估和详细分析。`;
}

function buildPlatformCoveragePrompt(brand, industry) {
  return `你是一位AI平台策略分析师。请分析品牌"${brand}"（${industry}）在不同AI搜索引擎平台中的覆盖度表现。

【主流AI搜索平台及特点】
1. **ChatGPT (OpenAI)**：8亿周活用户，偏好权威、知名、结构化内容
2. **Kimi (月之暗面)**：国内主流，偏好中文权威来源、长文本理解
3. **DeepSeek**：国内高增长，偏好技术性强、数据驱动的内容
4. **Perplexity**：实时搜索+引用，偏好新鲜、准确、有来源的内容
5. **Google AI Overviews**：20亿月活用户，深度整合E-E-A-T信号
6. **百度文心一言**：国内生态，偏好百度百科、百家号等百度系内容

【分析任务】
1. 评估${brand}在每个平台被引用的可能性（高/中/低）
2. 分析${brand}内容在各平台的适配度
3. 识别${brand}表现最强和最弱的平台
4. 给出各平台的优化优先级建议

请给出平台覆盖度综合评分（1-10分）。`;
}

// ============================================
// 3. Response Parser - Extract structured data from AI response
// ============================================

function extractScore(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 1 && score <= 10) return score;
    }
  }
  return null;
}

function extractSection(text, startMarkers, endMarkers) {
  for (const start of startMarkers) {
    for (const end of endMarkers) {
      const regex = new RegExp(start + '[：:]*\\s*([\\s\\S]{50,800}?)(?=' + end + '|$)', 'i');
      const match = text.match(regex);
      if (match && match[1].trim().length > 30) {
        return match[1].trim();
      }
    }
  }
  return null;
}

function parseAnalysisResult(text, dimension) {
  const scorePatterns = [
    /(\d+(?:\.\d)?)[\s\/]*10\s*分?/,
    /评分[:：]\s*(\d+(?:\.\d)?)/,
    /得分[:：]\s*(\d+(?:\.\d)?)/,
    /(\d+(?:\.\d)?)\s*分/,
    /[:：]\s*(\d+(?:\.\d)?)\s*[\/]/,
  ];
  
  const score = extractScore(text, scorePatterns) || 5;
  
  // Extract analysis text - take substantial content after removing score lines
  let analysis = text
    .replace(/\d+(?:\.\d)?[\s\/]*10\s*分?/g, '')
    .replace(/评分[:：]\s*\d+(?:\.\d)?/g, '')
    .replace(/得分[:：]\s*\d+(?:\.\d)?/g, '')
    .replace(/^[^\u4e00-\u9fa5a-zA-Z]*/, '')
    .trim();
  
  if (analysis.length < 20) {
    analysis = `${dimension}分析显示该品牌在此维度表现${score >= 7 ? '良好' : score >= 4 ? '中等' : '较弱'}，需要${score >= 7 ? '保持优势并持续优化' : '针对性改进提升'}。`;
  }
  
  return { score: Math.min(10, Math.max(1, score)), analysis: analysis.slice(0, 500) };
}

// ============================================
// 4. Main Diagnosis Runner
// ============================================

async function runDiagnosis(taskId, brandInfo, apiKeys, onProgress) {
  const { brandName, industry, competitors, products, targetAudience, onlineChannels, location } = brandInfo;
  const deepseekKey = apiKeys?.deepseek;

  if (!deepseekKey || deepseekKey.length < 20) {
    onProgress({ status: 'error', progress: 0, message: '请先配置 DeepSeek API Key' });
    return;
  }

  const compList = competitors?.filter(c => c) || [];
  const results = [];

  // Phase 1: AI Awareness Analysis
  onProgress({
    status: 'running', progress: 8,
    currentPlatform: 'AI认知度分析',
    message: `正在评估"${brandName}"在AI搜索引擎中的品牌认知度...`,
  });

  const awarenessResponse = await callDeepSeek(deepseekKey, buildAIAwarenessPrompt(brandName, industry, products, compList), 2500);
  const awareness = parseAnalysisResult(awarenessResponse, 'AI认知度');
  results.push({
    dimension: 'AI认知度',
    dimensionEn: 'AI Brand Awareness',
    score: awareness.score,
    maxScore: 10,
    weight: 0.20,
    analysis: awareness.analysis,
    details: [
      '评估品牌在ChatGPT、Kimi、DeepSeek等AI平台被提及的频率',
      '分析品牌在AI回答中的位置（首选/前3/附带/未提及）',
      '对比竞品在AI推荐中的可见度差异',
    ],
    benchmark: awareness.score >= 7 ? '高于行业平均' : awareness.score >= 4 ? '行业平均水准' : '低于行业平均',
  });

  // Phase 2: E-E-A-T Signals
  onProgress({
    status: 'running', progress: 25,
    currentPlatform: 'E-E-A-T权威信号',
    message: '正在评估品牌的经验、专业度、权威性、可信度信号...',
  });

  const eeatResponse = await callDeepSeek(deepseekKey, buildEEATPrompt(brandName, industry, products, targetAudience), 2500);
  const eeat = parseAnalysisResult(eeatResponse, 'E-E-A-T');
  
  // Parse sub-dimensions from E-E-A-T response
  const eeatSubScores = {
    experience: extractScore(eeatResponse, [/Experience.*?[:：]\s*(\d+(?:\.\d)?)/i, /经验.*?[:：]\s*(\d+(?:\.\d)?)/]) || Math.round(eeat.score * 0.9),
    expertise: extractScore(eeatResponse, [/Expertise.*?[:：]\s*(\d+(?:\.\d)?)/i, /专业度.*?[:：]\s*(\d+(?:\.\d)?)/]) || Math.round(eeat.score * 1.0),
    authoritativeness: extractScore(eeatResponse, [/Authoritativeness.*?[:：]\s*(\d+(?:\.\d)?)/i, /权威性.*?[:：]\s*(\d+(?:\.\d)?)/]) || Math.round(eeat.score * 0.95),
    trustworthiness: extractScore(eeatResponse, [/Trustworthiness.*?[:：]\s*(\d+(?:\.\d)?)/i, /可信度.*?[:：]\s*(\d+(?:\.\d)?)/]) || Math.round(eeat.score * 0.9),
  };
  
  results.push({
    dimension: 'E-E-A-T权威信号',
    dimensionEn: 'E-E-A-T Authority Signals',
    score: eeat.score,
    maxScore: 10,
    weight: 0.25,
    analysis: eeat.analysis,
    subScores: eeatSubScores,
    details: [
      `Experience (经验): ${eeatSubScores.experience}/10 - 第一手实践经验展示`,
      `Expertise (专业度): ${eeatSubScores.expertise}/10 - 专业资质与知识深度`,
      `Authoritativeness (权威性): ${eeatSubScores.authoritativeness}/10 - 行业认可与背书`,
      `Trustworthiness (可信度): ${eeatSubScores.trustworthiness}/10 - 信息透明与口碑`,
    ],
    benchmark: eeat.score >= 7 ? 'E-E-A-T信号强' : eeat.score >= 4 ? 'E-E-A-T信号中等' : 'E-E-A-T信号弱，需重点建设',
  });

  // Phase 3: Information Richness
  onProgress({
    status: 'running', progress: 42,
    currentPlatform: '信息完整度',
    message: '正在评估品牌信息的完整性和结构化程度...',
  });

  const infoResponse = await callDeepSeek(deepseekKey, buildInfoRichnessPrompt(brandName, industry, products), 2500);
  const infoRichness = parseAnalysisResult(infoResponse, '信息完整度');
  results.push({
    dimension: '信息完整度',
    dimensionEn: 'Information Richness',
    score: infoRichness.score,
    maxScore: 10,
    weight: 0.20,
    analysis: infoRichness.analysis,
    details: [
      '产品信息完整度：AI是否能准确描述产品线、功能、价格',
      '品牌故事清晰度：品牌定位、核心价值主张的传达',
      '结构化数据质量：Schema标记、FAQ、结构化内容',
      '多平台信息一致性：官网、社交媒体、电商平台信息统一',
      '信息时效性：内容更新频率和新鲜度',
    ],
    benchmark: infoRichness.score >= 7 ? '信息架构完善' : infoRichness.score >= 4 ? '信息基本完整' : '信息缺失严重',
  });

  // Phase 4: Citation Context Quality
  onProgress({
    status: 'running', progress: 58,
    currentPlatform: '引用语境质量',
    message: '正在分析品牌在AI生成内容中的引用位置和方式...',
  });

  const contextResponse = await callDeepSeek(deepseekKey, buildCitationContextPrompt(brandName, industry, compList), 2500);
  const contextQuality = parseAnalysisResult(contextResponse, '引用语境');
  
  // Determine context level based on score
  const contextLevel = contextQuality.score >= 8 ? 'Primary Recommendation (主推荐)' :
                       contextQuality.score >= 6 ? 'Top 3 Mention (前三提及)' :
                       contextQuality.score >= 4 ? 'Comparison Participant (对比参与者)' :
                       contextQuality.score >= 2 ? 'Category Mention (品类提及)' : 'Passing Reference (附带提及)';
  
  results.push({
    dimension: '引用语境质量',
    dimensionEn: 'Citation Context Quality',
    score: contextQuality.score,
    maxScore: 10,
    weight: 0.15,
    analysis: contextQuality.analysis,
    contextLevel: contextLevel,
    details: [
      `当前语境级别：${contextLevel}`,
      'Primary Recommendation (10/10)：AI直接推荐为最佳选择',
      'Top 3 Mention (8/10)：AI列为领先选项之一',
      'Comparison Participant (6/10)：AI在品牌对比中提及',
      'Category Mention (4/10)：AI在品类列举中提到',
      'Passing Reference (2/10)：AI仅附带提及',
    ],
    benchmark: contextQuality.score >= 7 ? '推荐优先级高' : contextQuality.score >= 4 ? '推荐优先级中等' : '推荐优先级低',
  });

  // Phase 5: Competitive Position
  onProgress({
    status: 'running', progress: 74,
    currentPlatform: '竞品竞争位势',
    message: '正在分析品牌相对于竞品的AI搜索竞争位势...',
  });

  const competitiveResponse = await callDeepSeek(deepseekKey, buildCompetitivePositionPrompt(brandName, industry, compList), 2500);
  const competitive = parseAnalysisResult(competitiveResponse, '竞争位势');
  
  // Estimate SoV based on score
  const estimatedSoV = competitive.score >= 8 ? '25-35%' :
                       competitive.score >= 6 ? '15-25%' :
                       competitive.score >= 4 ? '8-15%' :
                       competitive.score >= 2 ? '3-8%' : '<3%';
  
  const positionLabel = competitive.score >= 8 ? '领导者 (Leader)' :
                        competitive.score >= 6 ? '主要竞争者 (Major)' :
                        competitive.score >= 4 ? '挑战者 (Challenger)' : '利基玩家 (Niche)';
  
  results.push({
    dimension: '竞品竞争位势',
    dimensionEn: 'Competitive Position',
    score: competitive.score,
    maxScore: 10,
    weight: 0.12,
    analysis: competitive.analysis,
    estimatedSoV: estimatedSoV,
    positionLabel: positionLabel,
    details: [
      `AI声量份额预估：${estimatedSoV}`,
      `竞争位势：${positionLabel}`,
      '与主要竞品在AI推荐中的相对位置对比',
      '各品牌在AI搜索中的核心优势领域分析',
    ],
    benchmark: competitive.score >= 7 ? '竞争优势明显' : competitive.score >= 4 ? '竞争位势中等' : '竞争位势较弱',
  });

  // Phase 6: Platform Coverage
  onProgress({
    status: 'running', progress: 88,
    currentPlatform: '多平台覆盖度',
    message: '正在评估品牌跨AI平台的覆盖表现...',
  });

  const platformResponse = await callDeepSeek(deepseekKey, buildPlatformCoveragePrompt(brandName, industry), 2500);
  const platformCoverage = parseAnalysisResult(platformResponse, '平台覆盖度');
  
  results.push({
    dimension: '多平台覆盖度',
    dimensionEn: 'Platform Coverage',
    score: platformCoverage.score,
    maxScore: 10,
    weight: 0.08,
    analysis: platformCoverage.analysis,
    details: [
      'ChatGPT (OpenAI)：8亿周活，偏好权威结构化内容',
      'Kimi (月之暗面)：国内主流，偏好中文权威来源',
      'DeepSeek：高增长，偏好数据驱动内容',
      'Perplexity：实时搜索，偏好新鲜准确内容',
      'Google AI Overviews：20亿月活，深度整合E-E-A-T',
      '百度文心一言：国内生态，偏好百度系内容',
    ],
    benchmark: platformCoverage.score >= 7 ? '多平台覆盖良好' : platformCoverage.score >= 4 ? '部分平台有覆盖' : '平台覆盖不足',
  });

  // Calculate overall GEO Score (weighted average)
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = results.reduce((sum, r) => sum + (r.score * r.weight), 0);
  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  // Determine risk level
  let riskLevel = 'low';
  let riskLabel = '低风险';
  let riskColor = '#10b981';
  if (overallScore < 4.5) {
    riskLevel = 'high';
    riskLabel = '高风险';
    riskColor = '#ef4444';
  } else if (overallScore < 6.5) {
    riskLevel = 'medium';
    riskLabel = '中风险';
    riskColor = '#f59e0b';
  }

  // Phase 7: Generate Recommendations
  onProgress({
    status: 'running', progress: 95,
    currentPlatform: '优化建议生成',
    message: '正在基于诊断结果生成个性化优化方案...',
  });

  const recommendations = await generateRecommendations(deepseekKey, brandName, industry, results, overallScore);

  // Build summary
  const summary = buildSummary(brandName, industry, overallScore, riskLabel, results, compList);

  // Platform scores for radar chart
  const radarData = results.map(r => ({
    dimension: r.dimension,
    score: r.score,
    fullMark: 10,
  }));

  const report = {
    id: taskId,
    brandInfo,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    overallScore,
    riskLevel,
    riskLabel,
    riskColor,
    radarData,
    dimensions: results,
    recommendations,
    summary,
    methodology: {
      framework: '基于Princeton/MIT GEO Framework + E-E-A-T Guidelines + "两大核心+四轮驱动"方法论',
      dimensions: 6,
      aiModel: 'DeepSeek-V3',
      dataSource: 'AI模拟分析 + 公开信息评估',
    },
  };

  onProgress({
    status: 'completed',
    progress: 100,
    currentPlatform: '完成',
    message: 'GEO专业诊断完成！',
    report,
  });

  return report;
}

// ============================================
// 5. Recommendation Generator
// ============================================

async function generateRecommendations(apiKey, brand, industry, dimensions, overallScore) {
  // Find weakest dimensions
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 3);
  
  const prompt = `你是一位GEO优化策略顾问。品牌"${brand}"（${industry}）的GEO诊断结果如下：

综合得分：${overallScore}/10
各维度得分：
${dimensions.map(d => `- ${d.dimension}: ${d.score}/10`).join('\n')}

最弱维度：
${weakest.map(d => `- ${d.dimension}: ${d.score}/10 - ${d.analysis.slice(0, 100)}...`).join('\n')}

请基于DSS原则（语义深度、数据支持、权威来源）和"两大核心+四轮驱动"方法论，生成4条高优先级的GEO优化建议。

每条建议需包含：
1. 优先级（high/medium/low）
2. 标题（15字以内，专业术语）
3. 具体描述（80-120字， actionable）
4. 预期效果（量化）
5. 实施难度（低/中/高）
6. 成本估算

用JSON数组格式回复（只返回JSON）：
[
  {"priority":"high","title":"...","description":"...","expectedEffect":"...","difficulty":"中","cost":"免费"},
  ...
]`;

  const raw = await callDeepSeek(apiKey, prompt, 2000);
  
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const recs = JSON.parse(jsonMatch[0]);
      return recs.slice(0, 4).map((r, i) => ({
        id: i + 1,
        ...r,
        timeline: r.difficulty === '低' ? '1-2周' : r.difficulty === '中' ? '1-3个月' : '3-6个月',
      }));
    }
  } catch (e) {
    console.error('Recommendation parse error:', e.message);
  }
  
  // Fallback: generate based on weakest dimensions
  return generateFallbackRecommendations(weakest, brand, overallScore);
}

function generateFallbackRecommendations(weakestDimensions, brand, overallScore) {
  const recs = [];
  
  for (let i = 0; i < Math.min(4, weakestDimensions.length + 1); i++) {
    const dim = weakestDimensions[i];
    if (!dim) break;
    
    let title, desc, effect;
    
    switch(dim.dimension) {
      case 'AI认知度':
        title = 'AI原生内容矩阵建设';
        desc = `在知乎、小红书、微信公众号等平台持续发布与${brand}相关的结构化内容，采用FAQ、对比测评、使用指南等AI易抓取格式，提升品牌在AI训练数据中的曝光度。`;
        effect = '3-6个月内AI提及率提升40-60%';
        break;
      case 'E-E-A-T权威信号':
        title = '权威背书体系构建';
        desc = `完善品牌About页面展示团队资质与认证，争取行业媒体报导和第三方评测，建立百度百科和品牌知识面板，强化E-E-A-T信号。`;
        effect = '6个月内品牌权威度显著提升';
        break;
      case '信息完整度':
        title = '结构化数据优化';
        desc = `在官网实施Schema.org标记（Organization、Product、FAQ），建立完整的FAQ页面，确保各平台品牌信息一致且准确。`;
        effect = 'AI信息抓取完整度提升50%+';
        break;
      case '引用语境质量':
        title = '差异化价值主张强化';
        desc = `在各平台内容中持续强调${brand}的独特卖点和核心优势，建立清晰的品牌标签，使AI能准确理解和传达品牌差异化价值。`;
        effect = 'AI推荐语境升级1-2个级别';
        break;
      case '竞品竞争位势':
        title = '竞品差异化定位策略';
        desc = `分析竞品在AI搜索中的优势领域，找到差异化切入点，通过针对性内容策略在细分场景建立AI推荐优势。`;
        effect = 'SoV提升5-10个百分点';
        break;
      default:
        title = 'GEO内容资产积累';
        desc = `系统性地创建和优化品牌相关内容资产，确保内容结构清晰、数据支撑充分、来源权威可信。`;
        effect = '综合GEO得分提升1-2分';
    }
    
    recs.push({
      id: i + 1,
      priority: i < 2 ? 'high' : 'medium',
      title,
      description: desc,
      expectedEffect: effect,
      difficulty: i < 2 ? '中' : '低',
      cost: i < 2 ? '内容运营成本' : '免费',
      timeline: i < 2 ? '1-3个月' : '1-2周',
    });
  }
  
  return recs;
}

// ============================================
// 6. Summary Builder
// ============================================

function buildSummary(brand, industry, score, riskLabel, dimensions, competitors) {
  const topDimension = dimensions.reduce((max, d) => d.score > max.score ? d : max);
  const weakDimension = dimensions.reduce((min, d) => d.score < min.score ? d : min);
  const compText = competitors?.length > 0 ? `主要竞品包括${competitors.slice(0, 3).join('、')}等` : '行业竞争激烈';
  
  return [
    `${brand}（${industry}）的综合GEO得分为 **${score}/10**，风险等级为**${riskLabel}**。${compText}。`,
    `优势维度：**${topDimension.dimension}**（${topDimension.score}/10），${topDimension.benchmark}。`,
    `薄弱维度：**${weakDimension.dimension}**（${weakDimension.score}/10），${weakDimension.benchmark}，建议优先优化。`,
    `整体评估：${score >= 7 ? '品牌在AI搜索中具备较好的可见度和权威性，建议保持优势并持续扩大领先。' : score >= 4.5 ? '品牌在AI搜索中有一定基础，但存在明显短板，针对性优化后可显著提升GEO表现。' : '品牌在AI搜索中的可见度较低，需要系统性的GEO策略重建。'}`,
  ];
}

module.exports = { runDiagnosis };
