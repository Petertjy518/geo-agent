import { useState, useCallback } from 'react';
import type { BrandInfo, DiagnosisReport, OptimizationSuggestion, DimensionResult, RadarDataPoint } from '@/types';

const DIMENSION_TEMPLATES: Omit<DimensionResult, 'score' | 'analysis' | 'benchmark'>[] = [
  {
    dimension: 'AI认知度', dimensionEn: 'AI Brand Awareness', weight: 0.20, maxScore: 10,
    details: ['评估品牌在ChatGPT、Kimi、DeepSeek等AI平台被提及的频率', '分析品牌在AI回答中的位置（首选/前3/附带/未提及）', '对比竞品在AI推荐中的可见度差异'],
  },
  {
    dimension: 'E-E-A-T权威信号', dimensionEn: 'E-E-A-T Authority Signals', weight: 0.25, maxScore: 10,
    details: ['Experience (经验): 第一手实践经验展示', 'Expertise (专业度): 专业资质与知识深度', 'Authoritativeness (权威性): 行业认可与背书', 'Trustworthiness (可信度): 信息透明与口碑'],
  },
  {
    dimension: '信息完整度', dimensionEn: 'Information Richness', weight: 0.20, maxScore: 10,
    details: ['产品信息完整度：AI是否能准确描述产品线、功能、价格', '品牌故事清晰度：品牌定位、核心价值主张的传达', '结构化数据质量：Schema标记、FAQ、结构化内容', '多平台信息一致性：官网、社交媒体、电商平台信息统一', '信息时效性：内容更新频率和新鲜度'],
  },
  {
    dimension: '引用语境质量', dimensionEn: 'Citation Context Quality', weight: 0.15, maxScore: 10,
    details: ['Primary Recommendation (10/10)：AI直接推荐为最佳选择', 'Top 3 Mention (8/10)：AI列为领先选项之一', 'Comparison Participant (6/10)：AI在品牌对比中提及', 'Category Mention (4/10)：AI在品类列举中提到', 'Passing Reference (2/10)：AI仅附带提及'],
  },
  {
    dimension: '竞品竞争位势', dimensionEn: 'Competitive Position', weight: 0.12, maxScore: 10,
    details: ['AI声量份额预估：品牌在品类中的引用占比', '竞争位势：领导者/主要竞争者/挑战者/利基玩家', '与主要竞品在AI推荐中的相对位置对比', '各品牌在AI搜索中的核心优势领域分析'],
  },
  {
    dimension: '多平台覆盖度', dimensionEn: 'Platform Coverage', weight: 0.08, maxScore: 10,
    details: ['ChatGPT (OpenAI)：8亿周活，偏好权威结构化内容', 'Kimi (月之暗面)：国内主流，偏好中文权威来源', 'DeepSeek：高增长，偏好数据驱动内容', 'Perplexity：实时搜索，偏好新鲜准确内容', 'Google AI Overviews：20亿月活，深度整合E-E-A-T', '百度文心一言：国内生态，偏好百度系内容'],
  },
];

function generateMockDimensions(brand: string, industry: string): DimensionResult[] {
  const seed = brand.length + industry.length;
  
  return DIMENSION_TEMPLATES.map((template, i) => {
    const baseScore = 4 + ((seed + i * 13) % 5);
    const score = Math.min(9.5, Math.max(2, baseScore + (Math.random() * 2 - 1)));
    const roundedScore = Math.round(score * 10) / 10;
    
    let analysis = '';
    let benchmark = '';
    
    switch(template.dimension) {
      case 'AI认知度':
        analysis = `${brand}在主流AI搜索引擎中的认知度${roundedScore >= 7 ? '较高' : roundedScore >= 4.5 ? '中等' : '较低'}。当用户搜索${industry}相关问题时，${roundedScore >= 7 ? '品牌有较大概率被AI提及和推荐' : roundedScore >= 4.5 ? '品牌偶尔会被AI提及，但推荐优先级不高' : '品牌很少出现在AI生成的回答中'}。`;
        benchmark = roundedScore >= 7 ? '高于行业平均' : roundedScore >= 4.5 ? '行业平均水准' : '低于行业平均';
        break;
      case 'E-E-A-T权威信号':
        analysis = `${brand}的E-E-A-T信号强度${roundedScore >= 7 ? '良好' : roundedScore >= 4.5 ? '中等' : '偏弱'}。品牌在${roundedScore >= 7 ? '专业性展示、权威背书和用户信任方面均有较好表现' : roundedScore >= 4.5 ? '部分维度表现良好，但仍有提升空间' : '多个维度需要加强建设和优化'}。`;
        benchmark = roundedScore >= 7 ? 'E-E-A-T信号强' : roundedScore >= 4.5 ? 'E-E-A-T信号中等' : 'E-E-A-T信号弱，需重点建设';
        break;
      case '信息完整度':
        analysis = `AI对${brand}的信息掌握程度${roundedScore >= 7 ? '较为完整' : roundedScore >= 4.5 ? '基本完整' : '存在明显缺失'}。${roundedScore >= 7 ? '品牌的产品信息、品牌故事和结构化数据均能被AI较好理解' : roundedScore >= 4.5 ? '部分信息可被AI获取，但深度和广度有待提升' : 'AI对品牌的了解有限，需要系统性地完善信息架构'}。`;
        benchmark = roundedScore >= 7 ? '信息架构完善' : roundedScore >= 4.5 ? '信息基本完整' : '信息缺失严重';
        break;
      case '引用语境质量':
        analysis = `${brand}在AI生成内容中的引用语境质量${roundedScore >= 7 ? '较高' : roundedScore >= 4.5 ? '中等' : '较低'}。品牌通常以${roundedScore >= 8 ? '首选推荐或前三提及' : roundedScore >= 6 ? '领先选项之一' : roundedScore >= 4 ? '品类参与者' : '附带提及'}的形式出现在AI回答中。`;
        benchmark = roundedScore >= 7 ? '推荐优先级高' : roundedScore >= 4.5 ? '推荐优先级中等' : '推荐优先级低';
        break;
      case '竞品竞争位势':
        analysis = `在AI搜索竞争中，${brand}处于${roundedScore >= 8 ? '领导者' : roundedScore >= 6 ? '主要竞争者' : roundedScore >= 4 ? '挑战者' : '利基玩家'}位置。品牌的AI声量份额预估在${roundedScore >= 8 ? '25-35%' : roundedScore >= 6 ? '15-25%' : roundedScore >= 4 ? '8-15%' : '3-8%'}区间。`;
        benchmark = roundedScore >= 7 ? '竞争优势明显' : roundedScore >= 4.5 ? '竞争位势中等' : '竞争位势较弱';
        break;
      case '多平台覆盖度':
        analysis = `${brand}在主流AI搜索平台的覆盖度${roundedScore >= 7 ? '良好' : roundedScore >= 4.5 ? '部分平台有覆盖' : '覆盖不足'}。品牌在${roundedScore >= 7 ? '多个平台均有较好的可见度表现' : roundedScore >= 4.5 ? '部分平台表现较好，但存在平台间的差异' : '大多数平台的可见度较低，需要扩大平台覆盖'}。`;
        benchmark = roundedScore >= 7 ? '多平台覆盖良好' : roundedScore >= 4.5 ? '部分平台有覆盖' : '平台覆盖不足';
        break;
    }
    
    const result: DimensionResult = {
      ...template,
      score: roundedScore,
      analysis,
      benchmark,
    };
    
    // Add E-E-A-T sub-scores
    if (template.dimension === 'E-E-A-T权威信号') {
      result.subScores = {
        experience: Math.min(10, Math.round((roundedScore * 0.9 + Math.random()) * 10) / 10),
        expertise: Math.min(10, Math.round((roundedScore * 1.0 + Math.random()) * 10) / 10),
        authoritativeness: Math.min(10, Math.round((roundedScore * 0.95 + Math.random()) * 10) / 10),
        trustworthiness: Math.min(10, Math.round((roundedScore * 0.9 + Math.random()) * 10) / 10),
      };
    }
    
    // Add context level for citation context
    if (template.dimension === '引用语境质量') {
      result.contextLevel = roundedScore >= 8 ? 'Primary Recommendation (主推荐)' :
                            roundedScore >= 6 ? 'Top 3 Mention (前三提及)' :
                            roundedScore >= 4 ? 'Comparison Participant (对比参与者)' :
                            roundedScore >= 2 ? 'Category Mention (品类提及)' : 'Passing Reference (附带提及)';
    }
    
    // Add SoV for competitive position
    if (template.dimension === '竞品竞争位势') {
      result.estimatedSoV = roundedScore >= 8 ? '25-35%' :
                            roundedScore >= 6 ? '15-25%' :
                            roundedScore >= 4 ? '8-15%' :
                            roundedScore >= 2 ? '3-8%' : '<3%';
      result.positionLabel = roundedScore >= 8 ? '领导者 (Leader)' :
                             roundedScore >= 6 ? '主要竞争者 (Major)' :
                             roundedScore >= 4 ? '挑战者 (Challenger)' : '利基玩家 (Niche)';
    }
    
    return result;
  });
}

function generateMockSuggestions(brand: string): OptimizationSuggestion[] {
  return [
    {
      id: 1, priority: 'high',
      title: 'AI原生内容矩阵建设',
      description: `在知乎、小红书、微信公众号等平台持续发布与${brand}相关的结构化内容，采用FAQ、对比测评、使用指南等AI易抓取格式，提升品牌在AI训练数据中的曝光度和引用概率。`,
      expectedEffect: '3-6个月内AI提及率提升40-60%',
      difficulty: '中', cost: '内容运营成本', timeline: '1-3个月',
    },
    {
      id: 2, priority: 'high',
      title: '权威背书体系构建',
      description: `完善品牌About页面展示团队资质与认证，争取行业媒体报导和第三方评测，建立百度百科和品牌知识面板，强化E-E-A-T信号，提升AI对品牌的信任度。`,
      expectedEffect: '6个月内品牌权威度显著提升',
      difficulty: '中', cost: '公关运营费用', timeline: '3-6个月',
    },
    {
      id: 3, priority: 'medium',
      title: '结构化数据与Schema优化',
      description: '在官网实施Schema.org标记（Organization、Product、FAQ），建立完整的FAQ页面，确保各平台品牌信息一致且准确，便于AI引擎理解和引用。',
      expectedEffect: 'AI信息抓取完整度提升50%+',
      difficulty: '低', cost: '技术实施成本', timeline: '1-2周',
    },
    {
      id: 4, priority: 'medium',
      title: '差异化价值主张强化',
      description: `在各平台内容中持续强调${brand}的独特卖点和核心优势，建立清晰的品牌标签，使AI能准确理解和传达品牌差异化价值，提升引用语境质量。`,
      expectedEffect: 'AI推荐语境升级1-2个级别',
      difficulty: '中', cost: '内容策划费用', timeline: '1-3个月',
    },
  ];
}

function generateRadarData(dimensions: DimensionResult[]): RadarDataPoint[] {
  return dimensions.map(d => ({
    dimension: d.dimension,
    score: d.score,
    fullMark: d.maxScore,
  }));
}

export function useDiagnosis() {
  const [currentReport, setCurrentReport] = useState<DiagnosisReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState('');

  const startDiagnosis = useCallback(async (brandInfo: BrandInfo): Promise<DiagnosisReport> => {
    setIsProcessing(true);
    setProgress(0);
    
    const dimensions = ['AI认知度分析', 'E-E-A-T权威信号', '信息完整度', '引用语境质量', '竞品竞争位势', '多平台覆盖度'];
    
    for (let i = 0; i < dimensions.length; i++) {
      setCurrentPlatform(dimensions[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(Math.round(((i + 1) / dimensions.length) * 100));
    }
    
    const dimensionResults = generateMockDimensions(brandInfo.brandName, brandInfo.industry);
    const overallScore = Math.round(
      (dimensionResults.reduce((sum, d) => sum + d.score * d.weight, 0) / 
       dimensionResults.reduce((sum, d) => sum + d.weight, 0)) * 10
    ) / 10;
    
    const riskLevel = overallScore < 4.5 ? 'high' : overallScore < 6.5 ? 'medium' : 'low';
    const riskLabel = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险';
    const riskColor = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#10b981';
    
    const topDimension = dimensionResults.reduce((max, d) => d.score > max.score ? d : max);
    const weakDimension = dimensionResults.reduce((min, d) => d.score < min.score ? d : min);
    
    const report: DiagnosisReport = {
      id: `GEO-${Date.now()}`,
      brandInfo,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      overallScore,
      riskLevel,
      riskLabel,
      riskColor,
      radarData: generateRadarData(dimensionResults),
      dimensions: dimensionResults,
      recommendations: generateMockSuggestions(brandInfo.brandName),
      summary: [
        `${brandInfo.brandName}（${brandInfo.industry}）的综合GEO得分为 **${overallScore}/10**，风险等级为**${riskLabel}**。`,
        `优势维度：**${topDimension.dimension}**（${topDimension.score}/10），${topDimension.benchmark}。`,
        `薄弱维度：**${weakDimension.dimension}**（${weakDimension.score}/10），${weakDimension.benchmark}，建议优先优化。`,
        `整体评估：${overallScore >= 6.5 ? '品牌在AI搜索中具备较好的可见度和权威性，建议保持优势并持续扩大领先。' : overallScore >= 4.5 ? '品牌在AI搜索中有一定基础，但存在明显短板，针对性优化后可显著提升GEO表现。' : '品牌在AI搜索中的可见度较低，需要系统性的GEO策略重建。'}`,
      ],
      methodology: {
        framework: '基于Princeton/MIT GEO Framework + E-E-A-T Guidelines + "两大核心+四轮驱动"方法论',
        dimensions: 6,
        aiModel: 'DeepSeek-V3',
        dataSource: 'AI模拟分析 + 公开信息评估',
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
    startDiagnosis,
    getHistory,
    deleteReport,
    setCurrentReport,
  };
}
