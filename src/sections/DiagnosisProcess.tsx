import { Brain, Loader2, CheckCircle, Search, MessageSquare, BarChart3 } from 'lucide-react';

interface DiagnosisProcessProps {
  progress: number;
  currentPlatform: string;
  message?: string;
  error?: string;
}

export function DiagnosisProcess({ progress, currentPlatform, message, error }: DiagnosisProcessProps) {
  const platforms = ['DeepSeek', '百度搜索', '知乎'];
  const currentIndex = platforms.indexOf(currentPlatform);
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated Brain Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          <div className="absolute inset-2 bg-blue-500/10 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {error ? '诊断出错' : 'AI深度诊断中'}
        </h2>
        <p className="text-slate-500 mb-2">
          {error ? error : message || '正在基于6维度专业框架分析品牌在AI搜索中的表现...'}
        </p>
        {error && (
          <p className="text-sm text-red-500 mb-6">请检查API Key配置或稍后重试</p>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>诊断进度</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          {platforms.map((platform, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div 
                key={platform}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent ? 'bg-blue-50 border border-blue-200' : 
                  isDone ? 'bg-green-50/50' : 'bg-slate-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-green-500' : 
                  isCurrent ? 'bg-blue-500' : 'bg-slate-200'
                }`}>
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className={`font-medium ${isCurrent ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                    {platform}
                  </span>
                </div>
                <span className={`text-xs ${isDone ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                  {isDone ? '已完成' : isCurrent ? '测试中...' : '等待中'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Steps Indicator */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            <span>搜索测试</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>结果分析</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>生成报告</span>
          </div>
        </div>
      </div>
    </div>
  );
}
