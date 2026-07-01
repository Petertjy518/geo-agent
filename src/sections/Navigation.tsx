import { Brain, History, CreditCard, ChevronLeft, Sparkles } from 'lucide-react';
import type { PageView } from '@/types';

interface NavigationProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onBack: () => void;
}

export function Navigation({ currentPage, onNavigate, onBack }: NavigationProps) {
  const isLanding = currentPage === 'landing';
  const showNav = !isLanding && currentPage !== 'processing' && currentPage !== 'apikeys';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              GEO <span className="text-blue-600">Agent</span>
            </span>
          </button>

          {/* Center Nav */}
          {showNav && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/80 rounded-full px-1.5 py-1">
              <button
                onClick={() => onNavigate('diagnose')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentPage === 'diagnose' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                开始诊断
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentPage === 'history' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                历史记录
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentPage === 'pricing' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                定价
              </button>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {!isLanding && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
            )}
            {isLanding && (
              <button
                onClick={() => onNavigate('diagnose')}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <Sparkles className="w-4 h-4" />
                免费诊断
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
