export interface BrandInfo {
  brandName: string;
  industry: string;
  products: string;
  targetAudience: string;
  competitors: string[];
  onlineChannels: string;
  location: string;
}

export interface DimensionResult {
  dimension: string;
  dimensionEn: string;
  score: number;
  maxScore: number;
  weight: number;
  analysis: string;
  benchmark: string;
  details?: string[];
  subScores?: Record<string, number>;
  contextLevel?: string;
  estimatedSoV?: string;
  positionLabel?: string;
}

export interface RadarDataPoint {
  dimension: string;
  score: number;
  fullMark: number;
}

export interface OptimizationSuggestion {
  id: number;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedEffect: string;
  difficulty: string;
  cost: string;
  timeline: string;
}

export interface MethodologyInfo {
  framework: string;
  dimensions: number;
  aiModel: string;
  dataSource: string;
}

export interface DiagnosisReport {
  id: string;
  brandInfo: BrandInfo;
  createdAt: string;
  overallScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskLabel: string;
  riskColor: string;
  radarData: RadarDataPoint[];
  dimensions: DimensionResult[];
  recommendations: OptimizationSuggestion[];
  summary: string[];
  methodology: MethodologyInfo;
}

export type PageView = 'landing' | 'apikeys' | 'diagnose' | 'processing' | 'report' | 'history' | 'pricing';
