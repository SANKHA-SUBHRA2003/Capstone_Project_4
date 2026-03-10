/**
 * Central API client for StockPulse backend (http://localhost:8000)
 * All functions return the parsed JSON body, or throw on error.
 */

const BASE_URL = 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export const fetchKPI = () => request('/dashboard/kpi');

// ── Inventory ──────────────────────────────────────────────────────────────
export const fetchInventory = ({ page = 1, per_page = 50, search = '', category = '', status = '' } = {}) => {
  const params = new URLSearchParams({ page, per_page });
  if (search)   params.set('search',   search);
  if (category) params.set('category', category);
  if (status)   params.set('status',   status);
  return request(`/inventory/?${params}`);
};

export const createProduct  = (data)       => request('/inventory/',        { method: 'POST',   body: JSON.stringify(data) });
export const updateProduct  = (id, data)   => request(`/inventory/${id}`,   { method: 'PATCH',  body: JSON.stringify(data) });
export const deleteProduct  = (id)         => request(`/inventory/${id}`,   { method: 'DELETE' });
export const adjustStock    = (data)       => request('/inventory/adjust-stock', { method: 'POST', body: JSON.stringify(data) });

// ── Alerts ─────────────────────────────────────────────────────────────────
export const fetchAlerts    = ({ resolved = false, severity = '' } = {}) => {
  const params = new URLSearchParams({ resolved });
  if (severity) params.set('severity', severity);
  return request(`/alerts/?${params}`);
};

export const resolveAlert   = (id, resolved = true) =>
  request(`/alerts/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolved }) });

export const deleteAlert    = (id) => request(`/alerts/${id}`, { method: 'DELETE' });

// ── Reports ────────────────────────────────────────────────────────────────
export const fetchReportLogs = (limit = 20) => request(`/reports/logs?limit=${limit}`);

/**
 * Generate + download a report directly from the backend.
 * Streams the file and triggers a browser download.
 */
export async function generateAndDownloadReport({ period_label, format, date_from, date_to }) {
  const res = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period_label, format, date_from, date_to }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Report generation failed (${res.status})`);
  }
  const blob     = await res.blob();
  const url      = URL.createObjectURL(blob);
  const filename = `StockPulse_${period_label.replace(/\s+/g,'_')}.${format}`;
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
