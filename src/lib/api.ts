// API client for backend communication
const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // API Keys
  saveKeys: (keys: Record<string, string>) =>
    fetchJSON('/api/keys', { method: 'POST', body: JSON.stringify({ keys }) }),
  
  getKeyStatus: () => fetchJSON('/api/keys/status'),

  // Diagnosis
  startDiagnosis: (brandInfo: any) =>
    fetchJSON('/api/diagnose', { method: 'POST', body: JSON.stringify({ brandInfo }) }),
  
  getReport: (taskId: string) => fetchJSON(`/api/diagnose/${taskId}/report`),
  
  subscribeProgress: (taskId: string, onUpdate: (data: any) => void) => {
    const es = new EventSource(`${API_BASE}/api/diagnose/${taskId}/progress`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      onUpdate(data);
      if (data.status === 'completed' || data.status === 'error') {
        es.close();
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  },

  // Reports
  getReports: () => fetchJSON('/api/reports'),
  getReportById: (id: string) => fetchJSON(`/api/reports/${id}`),
  deleteReport: (id: string) =>
    fetch(`${API_BASE}/api/reports/${id}`, { method: 'DELETE' }),
};
