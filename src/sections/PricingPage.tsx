import { Check, Sparkles, Zap, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PricingPageProps {
  onBack: () => void;
  onStartTrial: () => void;
}

const plans = [
  {
    name: '入门版',
    icon: Sparkles,
    price: '99',
    period: '/月',
    yearlyPrice: '79',
    description: '适合个人GEO服务商和小品牌',
    features: [
      '每月1个品牌诊断',
      '3个AI平台测试',
      '基础诊断报告',
      'PDF导出',
      '邮件支持',
    ],
    cta: '免费试用',
    popular: false,
    color: 'from-slate-500 to-slate-600',
  },
  {
    name: '专业版',
    icon: Zap,
    price: '299',
    period: '/月',
    yearlyPrice: '249',
    description: '适合专业GEO顾问和中小企业',
    features: [
      '每月3个品牌诊断',
      '5个AI平台全覆盖',
      '完整竞品对标分析',
      '优化建议清单',
      'PDF + Excel导出',
      '优先客服支持',
    ],
    cta: '开始试用',
    popular: true,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    name: '企业版',
    icon: Building2,
    price: '999',
    period: '/月',
    yearlyPrice: '799',
    description: '适合大型企业和品牌集团',
    features: [
      '每月10个品牌诊断',
      '5个AI平台全覆盖',
      '月度追踪监测',
      'API接口访问',
      '白标报告定制',
      '专属客户经理',
      'SLA服务保障',
    ],
    cta: '联系销售',
    popular: false,
    color: 'from-indigo-600 to-purple-600',
  },
  {
    name: '定制版',
    icon: Crown,
    price: '定制',
    period: '',
    yearlyPrice: '',
    description: '适合有特殊需求的大型客户',
    features: [
      '无限品牌诊断',
      '私有部署选项',
      '定制功能开发',
      '数据安全合规',
      '7x24技术支持',
      '培训与咨询',
    ],
    cta: '预约演示',
    popular: false,
    color: 'from-amber-500 to-orange-500',
  },
];

export function PricingPage({ onBack, onStartTrial }: PricingPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">定价方案</h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            选择适合你的方案，所有方案均可免费试用。年付享受8折优惠。
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${
                plan.popular 
                  ? 'border-blue-300 shadow-xl shadow-blue-500/10 scale-105' 
                  : 'border-slate-200 shadow-sm'
              } bg-white overflow-hidden transition-all hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center text-xs font-semibold py-1.5">
                  最受欢迎
                </div>
              )}
              
              <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <plan.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {plan.price === '定制' ? (
                    <span className="text-3xl font-black text-slate-900">定制</span>
                  ) : (
                    <>
                      <span className="text-sm text-slate-400">$</span>
                      <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    </>
                  )}
                  {plan.yearlyPrice && (
                    <p className="text-sm text-slate-500 mt-1">
                      年付 <span className="font-semibold text-blue-600">${plan.yearlyPrice}/月</span>
                    </p>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-6">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={plan.name === '入门版' || plan.name === '专业版' ? onStartTrial : onBack}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Notes */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">常见问题</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: '可以免费试用吗？', a: '是的，所有方案都提供7天免费试用，无需绑定信用卡。' },
              { q: '可以随时取消订阅吗？', a: '当然可以，随时可以取消，无任何违约金。' },
              { q: '诊断报告可以商用吗？', a: '可以，所有付费方案生成的报告均可用于商业用途。' },
              { q: '支持哪些AI搜索平台？', a: '目前支持Kimi、豆包、ChatGPT、Perplexity、DeepSeek五大平台。' },
              { q: '报告支持导出什么格式？', a: '支持PDF和Excel格式导出，企业版支持白标定制。' },
              { q: '如何升级或降级方案？', a: '在账户设置中可随时更改方案，费用按比例计算。' },
            ].map((item, i) => (
              <div key={i}>
                <h4 className="font-semibold text-slate-800 mb-1">{item.q}</h4>
                <p className="text-sm text-slate-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
