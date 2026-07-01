import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Trash2, Calendar, Building2, TrendingUp, ChevronRight, Brain } from 'lucide-react';
import type { DiagnosisReport } from '@/types';
import { Button } from '@/components/ui/button';

interface HistoryPageProps {
  getHistory: () => DiagnosisReport[] | Promise<DiagnosisReport[]>;
  onViewReport: (report: DiagnosisReport) => void;
  onDelete: (id: string) => void | Promise<void>;
  onBack: () => void;
}

export function HistoryPage({ getHistory, onViewReport, onDelete, onBack }: HistoryPageProps) {
  const [reports, setReports] = useState<DiagnosisReport[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const result = getHistory();
    if (result instanceof Promise) {
      result.then(setReports);
    } else {
      setReports(result);
    }
  }, [getHistory]);

  const handleDelete = async (id: string) => {
    await Promise.resolve(onDelete(id));
    const updated = await getHistory();
    setReports(updated);
    setDeleteId(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'text-green-600 bg-green-50';
    if (score >= 5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">诊断历史</h1>
            <p className="text-slate-500">查看所有已完成的GEO诊断报告</p>
          </div>
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无诊断记录</h3>
            <p className="text-slate-500 mb-6">完成你的第一次GEO诊断后，记录将显示在这里</p>
            <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
              开始诊断
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{report.brandInfo.brandName}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {report.brandInfo.industry}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {report.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(report.overallScore)}`}>
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {report.overallScore}/10
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewReport(report)}
                        className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        查看
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      {deleteId === report.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            确认
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(null)}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(report.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
