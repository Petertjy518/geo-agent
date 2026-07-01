import { useState } from 'react';
import { Brain, Building2, Target, Users, ShoppingCart, Globe, MapPin, ArrowRight, Zap, Sparkles } from 'lucide-react';
import type { BrandInfo } from '@/types';

interface DiagnosisFormProps {
  onSubmit: (brandInfo: BrandInfo) => Promise<any>;
  quota: { dailyLimit: number; used: number; remaining: number };
}

export function DiagnosisForm({ onSubmit, quota }: DiagnosisFormProps) {
  const [form, setForm] = useState<BrandInfo>({
    brandName: '',
    industry: '',
    products: '',
    targetAudience: '',
    competitors: ['', ''],
    onlineChannels: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName || !form.industry) return;
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
  };

  const updateField = (field: keyof BrandInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCompetitor = (index: number, value: string) => {
    setForm(prev => {
      const newCompetitors = [...prev.competitors];
      newCompetitors[index] = value;
      return { ...prev, competitors: newCompetitors };
    });
  };

  const isQuotaExhausted = quota.remaining <= 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 bg-blue-100 text-blue-700">
            <Sparkles className="w-4 h-4" />
            AI深度诊断引擎已就绪
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">品牌GEO诊断</h1>
          <p className="text-slate-500">基于6维度专业框架，AI实时分析品牌在搜索引擎中的可见度</p>
          
          {/* Quota indicator */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600">今日剩余额度：</span>
            <span className={`font-bold ${quota.remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {quota.remaining}
            </span>
            <span className="text-slate-400">/ {quota.dailyLimit} 次</span>
            {isQuotaExhausted && (
              <span className="text-red-500 font-medium ml-2">额度已用完</span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Required fields note */}
            <div className="text-sm text-slate-500 mb-2">
              <span className="text-red-500">*</span> 为必填项
            </div>

            {/* Brand Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                品牌名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.brandName}
                onChange={e => updateField('brandName', e.target.value)}
                placeholder="例如：喜茶、小米、华为"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Industry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                所属行业 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.industry}
                onChange={e => updateField('industry', e.target.value)}
                placeholder="例如：新式茶饮、智能手机、新能源汽车"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Products */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                主要产品/服务
              </label>
              <input
                type="text"
                value={form.products}
                onChange={e => updateField('products', e.target.value)}
                placeholder="例如：芝士茶、果茶、烘焙产品"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                目标人群
              </label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={e => updateField('targetAudience', e.target.value)}
                placeholder="例如：18-35岁年轻消费者"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Competitors */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                主要竞品（2-3个）
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.competitors[0]}
                  onChange={e => updateCompetitor(0, e.target.value)}
                  placeholder="竞品1"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  value={form.competitors[1]}
                  onChange={e => updateCompetitor(1, e.target.value)}
                  placeholder="竞品2"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Online Channels */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                线上渠道
              </label>
              <input
                type="text"
                value={form.onlineChannels}
                onChange={e => updateField('onlineChannels', e.target.value)}
                placeholder="例如：官网、小程序、天猫、京东"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                企业所在地
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => updateField('location', e.target.value)}
                placeholder="例如：深圳、北京、上海"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">诊断流程说明</p>
              <p>AI引擎将基于6维度专业框架（AI认知度、E-E-A-T信号、信息完整度、引用语境质量、竞品竞争位势、多平台覆盖度）进行深度分析，整个过程约需1-2分钟。</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !form.brandName || !form.industry || isQuotaExhausted}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                准备中...
              </>
            ) : isQuotaExhausted ? (
              <>
                <Zap className="w-5 h-5" />
                今日额度已用完
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                启动AI诊断
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
