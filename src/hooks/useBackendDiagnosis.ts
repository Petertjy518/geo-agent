import { useState, useCallback } from 'react';
import type { DiagnosisReport, BrandInfo } from '@/types';

export function useBackendDiagnosis() {
  const [currentReport, setCurrentReport] = useState<DiagnosisReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');
  const [quota, setQuota] = useState({ dailyLimit: 3, used: 0, remaining: 3 });

  // Check user's remaining quota
  const checkQuota = useCallback(async () => {
    try {
      const res = await fetch('/api/quota');
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
        return data.remaining;
      }
    } catch {
      // Backend might not be ready, assume unlimited for demo
    }
    return 3;
  }, []);

  // Start diagnosis - server handles API key, user just provides brand info
  const startDiagnosis = useCallback(async (brandInfo: BrandInfo): Promise<DiagnosisReport> => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentPlatform('');
    setProgressMessage('正在初始化诊断引擎...');
    setError('');

    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandInfo }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }));
      setError(err.message || '诊断请求失败');
      setIsProcessing(false);
      throw new Error(err.message || '诊断请求失败');
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      setError('无法读取响应');
      setIsProcessing(false);
      throw new Error('无法读取响应');
    }

    return new Promise((resolve, reject) => {
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const dataMatch = line.match(/^data: (.+)/m);
              if (dataMatch) {
                try {
                  const data = JSON.parse(dataMatch[1]);
                  
                  setProgress(data.progress || 0);
                  setCurrentPlatform(data.currentPlatform || '');
                  setProgressMessage(data.message || '');

                  if (data.status === 'completed' && data.report) {
                    completed = true;
                    // Save to localStorage
                    const history = JSON.parse(localStorage.getItem('geo_reports') || '[]');
                    history.unshift(data.report);
                    localStorage.setItem('geo_reports', JSON.stringify(history.slice(0, 50)));
                    
                    setCurrentReport(data.report);
                    setIsProcessing(false);
                    resolve(data.report);
                    return;
                  }

                  if (data.status === 'error') {
                    completed = true;
                    setError(data.message || '诊断失败');
                    setIsProcessing(false);
                    reject(new Error(data.message));
                    return;
                  }
                } catch (e) {
                  console.error('SSE parse error:', e);
                }
              }
            }
          }

          if (!completed) {
            setIsProcessing(false);
            reject(new Error('诊断流意外结束'));
          }
        } catch (e) {
          setIsProcessing(false);
          reject(e);
        }
      };

      readStream();

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!completed) {
          reader.cancel();
          setIsProcessing(false);
          reject(new Error('诊断超时，请重试'));
        }
      }, 300000);
    });
  }, []);

  // Fallback: use localStorage for history
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
    progressMessage,
    error,
    quota,
    checkQuota,
    startDiagnosis,
    getHistory,
    deleteReport,
    setCurrentReport,
  };
}
