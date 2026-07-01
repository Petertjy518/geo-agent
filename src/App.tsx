import { useState } from 'react';
import { useBackendDiagnosis } from '@/hooks/useBackendDiagnosis';
import type { PageView, BrandInfo } from '@/types';
import { LandingPage } from '@/sections/LandingPage';
import { DiagnosisForm } from '@/sections/DiagnosisForm';
import { DiagnosisProcess } from '@/sections/DiagnosisProcess';
import { DiagnosisReport } from '@/sections/DiagnosisReport';
import { HistoryPage } from '@/sections/HistoryPage';
import { PricingPage } from '@/sections/PricingPage';
import { Navigation } from '@/sections/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [page, setPage] = useState<PageView>('landing');
  
  const {
    currentReport,
    progress,
    currentPlatform,
    progressMessage,
    error,
    quota,
    checkQuota,
    startDiagnosis,
    getHistory,
    deleteReport,
    setCurrentReport,
  } = useBackendDiagnosis();

  // User clicks "Start Diagnosis" on landing page
  const handleStartDiagnosis = () => {
    setPage('diagnose');
  };

  // User submits the diagnosis form
  const handleFormSubmit = async (brandInfo: BrandInfo) => {
    // Check quota first
    const remaining = await checkQuota();
    if (remaining <= 0) {
      toast.error(`今日免费额度已用完（${quota.dailyLimit}次/天）`);
      setPage('pricing');
      return;
    }

    setPage('processing');
    
    try {
      await startDiagnosis(brandInfo);
      setPage('report');
      toast.success('GEO专业诊断完成！');
    } catch (e) {
      toast.error(`诊断失败: ${(e as Error).message}`);
      setPage('diagnose');
    }
  };

  const handleViewReport = (report: any) => {
    setCurrentReport(report);
    setPage('report');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navigation 
        currentPage={page} 
        onNavigate={setPage}
        onBack={() => setPage('landing')}
      />
      
      <main className="pt-16">
        {page === 'landing' && (
          <LandingPage 
            onStartDiagnosis={handleStartDiagnosis}
            onViewPricing={() => setPage('pricing')}
            onViewHistory={() => setPage('history')}
          />
        )}
        
        {page === 'diagnose' && (
          <DiagnosisForm 
            onSubmit={handleFormSubmit}
            quota={quota}
          />
        )}
        
        {page === 'processing' && (
          <DiagnosisProcess 
            progress={progress}
            currentPlatform={currentPlatform}
            message={progressMessage}
            error={error}
          />
        )}
        
        {page === 'report' && currentReport && (
          <DiagnosisReport 
            report={currentReport}
            onBack={() => setPage('landing')}
            onNewDiagnosis={handleStartDiagnosis}
          />
        )}
        
        {page === 'history' && (
          <HistoryPage 
            getHistory={getHistory}
            onViewReport={handleViewReport}
            onDelete={deleteReport}
            onBack={() => setPage('landing')}
          />
        )}
        
        {page === 'pricing' && (
          <PricingPage 
            onBack={() => setPage('landing')}
            onStartTrial={handleStartDiagnosis}
          />
        )}
      </main>
      
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
