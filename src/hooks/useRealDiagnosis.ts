import { useState, useCallback } from 'react';
import type { BrandInfo, DiagnosisReport, OptimizationSuggestion } from '@/types';

export interface ApiKeys {
  openai?: string;
  deepseek?: string;
  kimi?: string;
  doubao?: string;
  perplexity?: string;
}

// Call DeepSeek API for diagnosis
async function callDeepSeek(apiKey: string, prompt: string): Promise<string> {
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
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('DeepSeek API error:', e);
    return `[API调用失败: ${(e as Error).message}]`;
  }
}

function parseScore(text: string): number {
  const patterns = [
    /(\d+(?:\.\d)?)[\s\/]*10\s*分?/,
    /评分[:：]\s*(\d+(?:\.\d)?)/,
    /得分[:：]\s*(\d+(?:\.\d)?)/,
    /(\d+(?:\.\d)?)\s*分/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 1 && score <= 10) return score;
    }
  }
  return 5;
}

function parseAnalysis(text: string): string {
  const cleaned = text
    .replace(/\d+(?:\.\d)?[\s\/]*10\s*分?/g, '')
    .replace(/评分[:：]\s*\d+(?:\.\d)?/g, '')
    .replace(/^[^\u4e00-\u9fa5a-zA-Z]*/, '')
    .trim();
  return cleaned.length > 20 ? cleaned.slice(0, 500) : '基于AI分析得出的诊断结果。';
}

function getBenchmark(score: number): string {
  if (score >= 7) return '高于行业平均';
  if (score >= 4.5) return '行业平均水准';
  return '低于行业平均';
}

export function useRealDiagnosis() {
  const [currentReport, setCurrentReport] = useState<DiagnosisReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  const startDiagnosis = useCallback(async (
    brandInfo: BrandInfo,
    keys: ApiKeys
  ): Promise<DiagnosisReport> => {
    setIsProcessing(true);
    setProgress(0);
    setApiKeys(keys);

    const deepseekKey = keys.deepseek;
    if (!deepseekKey) {
      throw new Error('请配置 DeepSeek API Key');
    }

    const { brandName, industry, competitors } = brandInfo;
    const compList = competitors?.filter(c => c) || [];

    // Phase 1: AI Awareness
    setCurrentPlatform('AI认知度分析');
    const awarenessPrompt = `作为GEO专家，分析"${brandName}"(${industry})在AI搜索引擎(ChatGPT/Kimi/DeepSeek/Perplexity)中的品牌认知度。
评估：1)被提及频率 2)回答中的位置 3)与竞品${compList.join('、') || '竞品'}对比。
给出1-10分评分和详细分析。`;
    const awarenessResponse = await callDeepSeek(deepseekKey, awarenessPrompt);
    const awarenessScore = parseScore(awarenessResponse);
    const awarenessAnalysis = parseAnalysis(awarenessResponse);
    setProgress(15);

    // Phase 2: E-E-A-T
    setCurrentPlatform('E-E-A-T权威信号');
    const eeatPrompt = `评估"${brandName}"(${industry})的E-E-A-T信号：Experience(经验)、Expertise(专业度)、Authoritativeness(权威性)、Trustworthiness(可信度)。
给出综合1-10分评分和每个维度的分析。`;
    const eeatResponse = await callDeepSeek(deepseekKey, eeatPrompt);
    const eeatScore = parseScore(eeatResponse);
    const eeatAnalysis = parseAnalysis(eeatResponse);
    setProgress(30);

    // Phase 3: Information Richness
    setCurrentPlatform('信息完整度');
    const infoPrompt = `评估"${brandName}"(${industry})的信息完整度：产品信息、品牌故事、结构化数据、多平台一致性、时效性。
给出1-10分评分和详细分析。`;
    const infoResponse = await callDeepSeek(deepseekKey, infoPrompt);
    const infoScore = parseScore(infoResponse);
    const infoAnalysis = parseAnalysis(infoResponse);
    setProgress(45);

    // Phase 4: Citation Context
    setCurrentPlatform('引用语境质量');
    const contextPrompt = `分析"${brandName}"(${industry})在AI生成内容中的引用语境质量：是主推荐(10/10)、前三提及(8/10)、对比参与者(6/10)、品类提及(4/10)还是附带提及(2/10)？
给出1-10分评分和详细分析。`;
    const contextResponse = await callDeepSeek(deepseekKey, contextPrompt);
    const contextScore = parseScore(contextResponse);
    const contextAnalysis = parseAnalysis(contextResponse);
    const contextLevel = contextScore >= 8 ? 'Primary Recommendation (主推荐)' :
                        contextScore >= 6 ? 'Top 3 Mention (前三提及)' :
                        contextScore >= 4 ? 'Comparison Participant (对比参与者)' :
                        contextScore >= 2 ? 'Category Mention (品类提及)' : 'Passing Reference (附带提及)';
    setProgress(60);

    // Phase 5: Competitive Position
    setCurrentPlatform('竞品竞争位势');
    const compPrompt = `分析"${brandName}"(${industry})与${compList.join('、') || '竞品'}在AI搜索可见度方面的竞争位势。
预估SoV(声量份额)和竞争定位(领导者/主要竞争者/挑战者/利基玩家)。给出1-10分评分。`;
    const compResponse = await callDeepSeek(deepseekKey, compPrompt);
    const compScore = parseScore(compResponse);
    const compAnalysis = parseAnalysis(compResponse);
    const estimatedSoV = compScore >= 8 ? '25-35%' :
                         compScore >= 6 ? '15-25%' :
                         compScore >= 4 ? '8-15%' : '3-8%';
    const positionLabel = compScore >= 8 ? '领导者 (Leader)' :
                          compScore >= 6 ? '主要竞争者 (Major)' :
                          compScore >= 4 ? '挑战者 (Challenger)' : '利基玩家 (Niche)';
    setProgress(75);

    // Phase 6: Platform Coverage
    setCurrentPlatform('多平台覆盖度');
    const platformPrompt = `分析"${brandName}"(${industry})在ChatGPT、Kimi、DeepSeek、Perplexity、Google AI Overviews、百度文心一言等平台的表现。
给出1-10分综合评分和各平台分析。`;
    const platformResponse = await callDeepSeek(deepseekKey, platformPrompt);
    const platformScore = parseScore(platformResponse);
    const platformAnalysis = parseAnalysis(platformResponse);
    setProgress(90);

    // Build dimensions
    const dimensions = [
      { dimension: 'AI认知度', dimensionEn: 'AI Brand Awareness', score: awarenessScore, maxScore: 10, weight: 0.20, analysis: awarenessAnalysis, benchmark: getBenchmark(awarenessScore), details: ['评估品牌在主流AI平台被提及的频率', '分析品牌在AI回答中的位置', '对比竞品在AI推荐中的可见度差异'] },
      { dimension: 'E-E-A-T权威信号', dimensionEn: 'E-E-A-T Authority Signals', score: eeatScore, maxScore: 10, weight: 0.25, analysis: eeatAnalysis, benchmark: eeatScore >= 7 ? 'E-E-A-T信号强' : eeatScore >= 4.5 ? 'E-E-A-T信号中等' : 'E-E-A-T信号弱，需重点建设', details: ['Experience (经验): 第一手实践经验展示', 'Expertise (专业度): 专业资质与知识深度', 'Authoritativeness (权威性): 行业认可与背书', 'Trustworthiness (可信度): 信息透明与口碑'] },
      { dimension: '信息完整度', dimensionEn: 'Information Richness', score: infoScore, maxScore: 10, weight: 0.20, analysis: infoAnalysis, benchmark: getBenchmark(infoScore), details: ['产品信息完整度', '品牌故事清晰度', '结构化数据质量', '多平台信息一致性', '信息时效性'] },
      { dimension: '引用语境质量', dimensionEn: 'Citation Context Quality', score: contextScore, maxScore: 10, weight: 0.15, analysis: contextAnalysis, benchmark: contextScore >= 7 ? '推荐优先级高' : contextScore >= 4.5 ? '推荐优先级中等' : '推荐优先级低', contextLevel, details: ['Primary Recommendation (10/10): AI直接推荐', 'Top 3 Mention (8/10): AI列为领先选项', 'Comparison Participant (6/10): AI在对比中提及', 'Category Mention (4/10): AI在品类列举中提到', 'Passing Reference (2/10): AI仅附带提及'] },
      { dimension: '竞品竞争位势', dimensionEn: 'Competitive Position', score: compScore, maxScore: 10, weight: 0.12, analysis: compAnalysis, benchmark: compScore >= 7 ? '竞争优势明显' : compScore >= 4.5 ? '竞争位势中等' : '竞争位势较弱', estimatedSoV, positionLabel, details: [`AI声量份额预估: ${estimatedSoV}`, `竞争位势: ${positionLabel}`, '与主要竞品在AI推荐中的相对位置对比', '各品牌在AI搜索中的核心优势领域分析'] },
      { dimension: '多平台覆盖度', dimensionEn: 'Platform Coverage', score: platformScore, maxScore: 10, weight: 0.08, analysis: platformAnalysis, benchmark: platformScore >= 7 ? '多平台覆盖良好' : platformScore >= 4.5 ? '部分平台有覆盖' : '平台覆盖不足', details: ['ChatGPT (OpenAI): 8亿周活', 'Kimi (月之暗面): 国内主流', 'DeepSeek: 高增长', 'Perplexity: 实时搜索', 'Google AI Overviews: 20亿月活', '百度文心一言: 国内生态'] },
    ];

    // Calculate overall score
    const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
    const weightedSum = dimensions.reduce((s, d) => s + d.score * d.weight, 0);
    const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;

    const riskLevel = overallScore < 4.5 ? 'high' : overallScore < 6.5 ? 'medium' : 'low';
    const riskLabel = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险';
    const riskColor = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#10b981';

    // Generate recommendations
    setCurrentPlatform('优化建议生成');
    const recPrompt = `基于${brandName}(${industry})的GEO诊断结果(综合${overallScore}/10)，生成4条优化建议。
最弱维度: ${dimensions.sort((a,b) => a.score - b.score)[0].dimension}(${dimensions.sort((a,b) => a.score - b.score)[0].score}/10)。
用JSON格式返回: [{"priority":"high/medium/low","title":"...","description":"...","expectedEffect":"...","difficulty":"低/中/高","cost":"..."}]`;
    const recResponse = await callDeepSeek(deepseekKey, recPrompt);
    
    let recommendations: OptimizationSuggestion[] = [];
    try {
      const jsonMatch = recResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.slice(0, 4).map((r: any, i: number) => ({
          id: i + 1,
          priority: r.priority || 'medium',
          title: r.title || '优化建议',
          description: r.description || '建议优化品牌GEO表现',
          expectedEffect: r.expectedEffect || '提升GEO得分',
          difficulty: r.difficulty || '中',
          cost: r.cost || '免费',
          timeline: r.difficulty === '低' ? '1-2周' : r.difficulty === '中' ? '1-3个月' : '3-6个月',
        }));
      }
    } catch (e) {
      console.error('Parse rec error:', e);
    }

    if (recommendations.length === 0) {
      recommendations = [
        { id: 1, priority: 'high', title: 'AI原生内容矩阵建设', description: `在知乎、小红书等平台持续发布与${brandName}相关的结构化内容，提升AI训练数据中的曝光度。`, expectedEffect: '3-6个月AI提及率提升40-60%', difficulty: '中', cost: '内容运营成本', timeline: '1-3个月' },
        { id: 2, priority: 'high', title: '权威背书体系构建', description: '完善品牌资质展示，争取行业媒体报导，建立百科词条，强化E-E-A-T信号。', expectedEffect: '6个月内品牌权威度显著提升', difficulty: '中', cost: '公关费用', timeline: '3-6个月' },
        { id: 3, priority: 'medium', title: '结构化数据优化', description: '在官网实施Schema.org标记，建立FAQ页面，确保多平台信息一致。', expectedEffect: 'AI信息抓取完整度提升50%+', difficulty: '低', cost: '技术成本', timeline: '1-2周' },
        { id: 4, priority: 'medium', title: '差异化价值主张强化', description: '在各平台内容中持续强调独特卖点，使AI准确理解和传达品牌价值。', expectedEffect: 'AI推荐语境升级1-2个级别', difficulty: '中', cost: '策划费用', timeline: '1-3个月' },
      ];
    }

    const topDim = dimensions.reduce((max, d) => d.score > max.score ? d : max);
    const weakDim = dimensions.reduce((min, d) => d.score < min.score ? d : min);

    const report: DiagnosisReport = {
      id: `GEO-${Date.now()}`,
      brandInfo,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      overallScore,
      riskLevel,
      riskLabel,
      riskColor,
      radarData: dimensions.map(d => ({ dimension: d.dimension, score: d.score, fullMark: 10 })),
      dimensions,
      recommendations,
      summary: [
        `${brandName}（${industry}）的综合GEO得分为 **${overallScore}/10**，风险等级为**${riskLabel}**。`,
        `优势维度：**${topDim.dimension}**（${topDim.score}/10），${topDim.benchmark}。`,
        `薄弱维度：**${weakDim.dimension}**（${weakDim.score}/10），${weakDim.benchmark}，建议优先优化。`,
        `整体评估：${overallScore >= 6.5 ? '品牌在AI搜索中具备较好的可见度和权威性，建议保持优势并持续扩大领先。' : overallScore >= 4.5 ? '品牌在AI搜索中有一定基础，但存在明显短板，针对性优化后可显著提升GEO表现。' : '品牌在AI搜索中的可见度较低，需要系统性的GEO策略重建。'}`,
      ],
      methodology: {
        framework: '基于Princeton/MIT GEO Framework + E-E-A-T Guidelines + "两大核心+四轮驱动"方法论',
        dimensions: 6,
        aiModel: 'DeepSeek-V3',
        dataSource: 'AI深度分析 + 公开信息评估',
      },
    };

    // Save to localStorage
    const history = JSON.parse(localStorage.getItem('geo_reports') || '[]');
    history.unshift(report);
    localStorage.setItem('geo_reports', JSON.stringify(history.slice(0, 50)));

    setCurrentReport(report);
    setIsProcessing(false);
    setProgress(100);
    return report;
  }, []);

  const getHistory = useCallback((): DiagnosisReport[] => {
    return JSON.parse(localStorage.getItem('geo_reports') || '[]');
  }, []);

  const deleteReport = useCallback((id: string) => {
    const history = JSON.parse(localStorage.getItem('geo_reports') || '[]');
    const filtered = history.filter((r: DiagnosisReport) => r.id !== id);
    localStorage.setItem('geo_reports', JSON.stringify(filtered));
  }, []);

  return {
    currentReport,
    isProcessing,
    progress,
    currentPlatform,
    apiKeys,
    startDiagnosis,
    getHistory,
    deleteReport,
    setCurrentReport,
  };
}
