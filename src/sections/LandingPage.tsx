import { Brain, Zap, Shield, TrendingUp, ArrowRight, CheckCircle, BarChart3, Search, FileText } from 'lucide-react';

interface LandingPageProps {
  onStartDiagnosis: () => void;
  onViewPricing: () => void;
  onViewHistory: () => void;
}

export function LandingPage({ onStartDiagnosis, onViewPricing, onViewHistory }: LandingPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50/80" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            全球首款AI Agent驱动的GEO诊断SaaS
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            让你的品牌被
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> AI搜索认识</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            输入品牌名称，AI Agent自动在Kimi、ChatGPT、豆包等5大平台完成诊断，
            10分钟生成专业GEO分析报告
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartDiagnosis}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
            >
              <Brain className="w-5 h-5" />
              免费开始诊断
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onViewPricing}
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 text-lg font-semibold rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              查看定价方案
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 5大AI平台覆盖</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 10分钟出报告</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 无需技术背景</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">三步完成GEO诊断</h2>
          <p className="text-center text-slate-500 mb-14">AI Agent全程自动化，你只需要输入品牌信息</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: '01', title: '输入品牌信息', desc: '填写品牌名称、行业、竞品等基本信息，30秒完成' },
              { icon: Brain, step: '02', title: 'AI Agent自动诊断', desc: 'Agent自动访问5大AI平台，执行45次搜索测试' },
              { icon: FileText, step: '03', title: '获取诊断报告', desc: '自动生成包含评分、对标、建议的专业PDF报告' },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                  <div className="text-5xl font-black text-blue-100 mb-4">{item.step}</div>
                  <item.icon className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-14">核心功能</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Search, title: '多平台自动测试', desc: '覆盖Kimi、豆包、ChatGPT、Perplexity、DeepSeek五大AI搜索平台' },
              { icon: BarChart3, title: '四维度智能评分', desc: '可见度、频次、准确度、丰富度四个维度全面评估品牌GEO表现' },
              { icon: TrendingUp, title: '竞品对标分析', desc: '与2-3个主要竞品进行全维度对比，找出差距和优势' },
              { icon: Shield, title: '可执行优化建议', desc: '按高/中/低优先级给出具体可执行的GEO优化方案' },
              { icon: FileText, title: '专业报告导出', desc: '一键生成PDF格式诊断报告，可直接提交给客户或上级' },
              { icon: Zap, title: '月度追踪监测', desc: '持续追踪品牌GEO得分变化，评估优化效果' },
            ].map((feat, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{feat.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">开始你的第一次GEO诊断</h2>
          <p className="text-blue-100 mb-8 text-lg">完全免费，无需注册，输入品牌信息即可开始</p>
          <button
            onClick={onStartDiagnosis}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-2xl hover:bg-blue-50 transition-all shadow-xl"
          >
            立即免费诊断
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-700">GEO Agent</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onViewHistory} className="hover:text-blue-600 transition-colors">历史记录</button>
            <button onClick={onViewPricing} className="hover:text-blue-600 transition-colors">定价方案</button>
          </div>
          <p> GEO Agent. AI品牌诊断官.</p>
        </div>
      </footer>
    </div>
  );
}
