import { useRef } from 'react';
import { Brain, ArrowLeft, Download, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Shield, Target, Lightbulb, BarChart3, Award, Globe } from 'lucide-react';
import type { DiagnosisReport, OptimizationSuggestion } from '@/types';
import { Button } from '@/components/ui/button';

interface DiagnosisReportProps {
  report: DiagnosisReport;
  onBack: () => void;
  onNewDiagnosis: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'text-emerald-600';
  if (score >= 4.5) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 7) return 'bg-emerald-50 border-emerald-200';
  if (score >= 4.5) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getProgressWidth(score: number): string {
  return `${score * 10}%`;
}

function getProgressColor(score: number): string {
  if (score >= 7) return 'bg-emerald-500';
  if (score >= 4.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function getRiskLabel(level: string): { text: string; color: string; icon: typeof AlertTriangle } {
  switch (level) {
    case 'high': return { text: '高风险', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
    case 'medium': return { text: '中等风险', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Shield };
    default: return { text: '低风险', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
  }
}

function SuggestionCard({ suggestion }: { suggestion: OptimizationSuggestion }) {
  const priorityConfig = {
    high: { label: '高优先级', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: AlertTriangle },
    medium: { label: '中优先级', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: Target },
    low: { label: '低优先级', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: Lightbulb },
  };
  const config = priorityConfig[suggestion.priority];
  const PriorityIcon = config.icon;

  return (
    <div className={`p-5 rounded-xl border ${config.bg} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        <PriorityIcon className="w-4 h-4" />
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-xs text-slate-500 ml-auto">难度：{suggestion.difficulty} | 成本：{suggestion.cost}</span>
      </div>
      <h4 className="font-bold text-slate-900 mb-2">{suggestion.id}. {suggestion.title}</h4>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{suggestion.description}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-emerald-700 font-medium"><TrendingUp className="w-3.5 h-3.5 inline mr-1" />{suggestion.expectedEffect}</p>
        <span className="text-xs text-slate-400">周期：{suggestion.timeline}</span>
      </div>
    </div>
  );
}

// Radar Chart Component
function RadarChart({ data }: { data: Array<{ dimension: string; score: number; fullMark: number }> }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (item.score / item.fullMark) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 28) * Math.cos(angle),
      labelY: center + (radius + 28) * Math.sin(angle),
      score: item.score,
      dimension: item.dimension,
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Background grid */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => {
        const gridPoints = data.map((_, j) => {
          const angle = j * angleStep - Math.PI / 2;
          const r = radius * scale;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={i} points={gridPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="#e2e8f0" strokeWidth="1" />
        );
      })}
      {/* Data area */}
      <path d={pathD} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
          <text x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#475569" fontWeight="500">
            {p.dimension}
          </text>
          <text x={p.labelX} y={p.labelY + 14} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">
            {p.score}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function DiagnosisReport({ report, onBack, onNewDiagnosis }: DiagnosisReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const risk = getRiskLabel(report.riskLevel);
  const RiskIcon = risk.icon;

  const handleExport = () => {
    const content = reportRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.brandInfo.brandName} - GEO诊断报告</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #333; line-height: 1.6; }
            h1 { font-size: 28px; color: #1e3a5f; border-bottom: 3px solid #d4a843; padding-bottom: 10px; }
            h2 { font-size: 20px; color: #1e3a5f; margin-top: 30px; border-left: 4px solid #d4a843; padding-left: 12px; }
            .score-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
            .score-num { font-size: 48px; font-weight: bold; color: #1e3a5f; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; font-weight: 600; }
            .priority-high { border-left: 4px solid #ef4444; padding-left: 12px; background: #fef2f2; }
            .priority-medium { border-left: 4px solid #f59e0b; padding-left: 12px; background: #fffbeb; }
            .priority-low { border-left: 4px solid #3b82f6; padding-left: 12px; background: #eff6ff; }
            .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 4px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              导出PDF
            </Button>
            <Button onClick={onNewDiagnosis} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Sparkles className="w-4 h-4" />
              新诊断
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Report Header */}
          <div className="p-8 text-white bg-gradient-to-r from-blue-700 to-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">
                GEO Agent 专业诊断报告 (AI深度分析)
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{report.brandInfo.brandName} GEO诊断报告</h1>
            <p className="text-blue-100">{report.brandInfo.industry} | 诊断日期：{report.createdAt}</p>
            {report.methodology && (
              <p className="text-xs text-blue-200 mt-2 opacity-80">
                方法论：{report.methodology.framework}
              </p>
            )}
          </div>

          <div className="p-8 space-y-10">
            {/* Executive Summary */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                执行摘要
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Score Card */}
                <div className={`p-6 rounded-xl border-2 text-center ${getScoreBg(report.overallScore)}`}>
                  <div className="text-sm text-slate-500 mb-1">综合GEO得分</div>
                  <div className={`text-5xl font-black ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore}
                    <span className="text-lg text-slate-400">/10</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">6维度加权评估</div>
                </div>
                
                {/* Risk Card */}
                <div className={`p-6 rounded-xl border-2 text-center ${risk.color}`}>
                  <div className="text-sm opacity-70 mb-1">风险等级</div>
                  <div className="flex items-center justify-center gap-2 text-xl font-bold">
                    <RiskIcon className="w-5 h-5" />
                    {risk.text}
                  </div>
                  <div className="text-xs opacity-60 mt-2">AI搜索可见度风险</div>
                </div>
                
                {/* Dimensions Card */}
                <div className="p-6 rounded-xl border-2 border-slate-100 bg-slate-50 text-center">
                  <div className="text-sm text-slate-500 mb-1">诊断维度</div>
                  <div className="text-4xl font-bold text-slate-800">{report.dimensions?.length || 6}</div>
                  <div className="text-xs text-slate-400 mt-2">专业GEO框架</div>
                </div>
              </div>
              
              {/* Summary Points */}
              <div className="space-y-2">
                {report.summary?.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700" dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                ))}
              </div>
            </section>

            {/* Radar Chart + Dimension Scores */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                六维能力雷达图
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Radar Chart */}
                <div className="flex justify-center">
                  {report.radarData && <RadarChart data={report.radarData} />}
                </div>
                
                {/* Dimension List */}
                <div className="space-y-4">
                  {report.dimensions?.map((dim, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{dim.dimension}</span>
                          <span className="text-xs text-slate-400">({dim.dimensionEn})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                          <span className="text-xs text-slate-400">/10</span>
                          <span className="text-xs text-slate-400">权重{dim.weight * 100}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${getProgressColor(dim.score)}`} style={{ width: getProgressWidth(dim.score) }} />
                      </div>
                      <p className="text-xs text-slate-500">{dim.benchmark}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Detailed Dimension Analysis */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                维度深度分析
              </h2>
              <div className="space-y-4">
                {report.dimensions?.map((dim, i) => (
                  <div key={i} className={`p-5 rounded-xl border ${getScoreBg(dim.score)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dim.dimension}</span>
                        <span className="text-xs text-slate-500">{dim.dimensionEn}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">权重 {dim.weight * 100}%</span>
                        <span className={`text-xl font-bold ${getScoreColor(dim.score)}`}>{dim.score}<span className="text-sm text-slate-400">/10</span></span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-3 leading-relaxed">{dim.analysis}</p>
                    
                    {/* E-E-A-T Sub-scores */}
                    {dim.subScores && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {Object.entries(dim.subScores).map(([key, val]) => (
                          <div key={key} className="bg-white/60 rounded-lg p-2 text-center">
                            <div className="text-xs text-slate-500 capitalize">{key}</div>
                            <div className={`text-lg font-bold ${getScoreColor(val)}`}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Special fields */}
                    {dim.contextLevel && (
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">当前语境级别：</span>{dim.contextLevel}
                      </div>
                    )}
                    {dim.estimatedSoV && (
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">AI声量份额预估：</span>{dim.estimatedSoV} | <span className="font-medium">竞争位势：</span>{dim.positionLabel}
                      </div>
                    )}
                    
                    {/* Details list */}
                    {dim.details && (
                      <div className="space-y-1 mt-2">
                        {dim.details.map((detail, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Optimization Suggestions */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                GEO优化建议
              </h2>
              <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-slate-600">
                <p className="font-medium text-blue-800 mb-1">优化方法论框架</p>
                <p>基于DSS原则（语义深度、数据支持、权威来源）和"两大核心+四轮驱动"方法论，针对诊断发现的最薄弱环节，生成以下4条高优先级优化建议。</p>
              </div>
              <div className="space-y-4">
                {report.recommendations?.map((suggestion, i) => (
                  <SuggestionCard key={i} suggestion={suggestion} />
                ))}
              </div>
            </section>

            {/* Methodology Note */}
            {report.methodology && (
              <section className="bg-slate-50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  诊断方法论说明
                </h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-800 mb-1">分析框架</p>
                    <p>{report.methodology.framework}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 mb-1">技术参数</p>
                    <p>诊断维度：{report.methodology.dimensions}个 | AI模型：{report.methodology.aiModel} | 数据来源：{report.methodology.dataSource}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-slate-100 text-center text-sm text-slate-400">
              <p>本报告由 GEO Agent 专业诊断系统生成 | {report.createdAt}</p>
              <p className="mt-1">基于Princeton/MIT GEO Framework、E-E-A-T Guidelines及行业权威方法论</p>
              <p className="mt-1 text-xs">报告仅供参考，具体执行请结合品牌实际情况</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
