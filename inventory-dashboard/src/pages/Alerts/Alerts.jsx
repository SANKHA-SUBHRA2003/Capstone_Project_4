import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { fetchAlerts, resolveAlert } from '../../services/api';
import RestockModal from '../../components/RestockModal/RestockModal';
import './Alerts.css';

const severityConfig = {
  critical: { icon: XCircle,       color: '#f87171', cls: 'badge-danger',  bgCls: 'alert-card--critical' },
  warning:  { icon: AlertTriangle, color: '#facc15', cls: 'badge-warning', bgCls: 'alert-card--warning'  },
  info:     { icon: Info,          color: '#22d3ee', cls: 'badge-info',    bgCls: 'alert-card--info'     },
};

export default function Alerts() {
  const [filter,   setFilter]   = useState('all');
  const [scanning, setScanning] = useState(false);

  // Restock modal state
  const [modalAlert,   setModalAlert]   = useState(null);  // the alert being resolved
  const [modalProduct, setModalProduct] = useState(null);  // full product data
  const [loadingProd,  setLoadingProd]  = useState(false);

  // Fetch unresolved alerts from backend
  const { data, loading, error, refetch } = useApi(fetchAlerts, { resolved: false });
  const allAlerts = data?.items ?? [];

  // Client-side filter by severity tab
  const visible = filter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.severity === filter);

  // When "Resolve" is clicked: fetch full product, then open modal
  const handleResolveClick = async (alert) => {
    setLoadingProd(true);
    try {
      const res = await fetch(`http://localhost:8000/inventory/${alert.product_id}`);
      const product = await res.json();
      setModalProduct(product);
      setModalAlert(alert);
    } catch {
      // Fallback: open modal with only alert info
      setModalProduct({ id: alert.product_id, name: alert.product_name ?? '', category: 'Other', quantity: 0, threshold: 1, unit_price: 0 });
      setModalAlert(alert);
    } finally {
      setLoadingProd(false);
    }
  };

  // Called by modal when user saves the restock form
  const handleSave = async (newQty, threshold) => {
    setModalAlert(null);
    setModalProduct(null);
    // If new qty > threshold the product status changed to "In Stock" on the backend
    // → also resolve the alert so it disappears from the list
    if (newQty > threshold) {
      await resolveAlert(modalAlert?.id ?? 0, true);
    }
    refetch();
  };

  const handleCloseModal = () => {
    setModalAlert(null);
    setModalProduct(null);
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); refetch(); }, 1800);
  };

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    warning:  allAlerts.filter(a => a.severity === 'warning').length,
    info:     allAlerts.filter(a => a.severity === 'info').length,
  };

  return (
    <div className="page">
      {/* Restock modal (portal-style, rendered inside page but fixed overlay) */}
      {modalAlert && modalProduct && (
        <RestockModal
          alert={modalAlert}
          product={modalProduct}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {/* Header */}
      <motion.div className="alerts-header glass" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <div>
          <h2 className="alerts-heading">Active Alerts</h2>
          <p className="alerts-sub">
            {loading ? 'Loading…' : `${allAlerts.length} active · click Resolve to restock`}
          </p>
        </div>
        <div className="alerts-header-right">
          <div className="alerts-chips">
            {['all','critical','warning','info'].map(f => (
              <button
                key={f}
                className={`inv-chip ${filter === f ? 'inv-chip--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className={`btn-scan ${scanning ? 'btn-scan--running' : ''}`} onClick={handleScan}>
            <RefreshCw size={15} className={scanning ? 'spin-icon' : ''} />
            {scanning ? 'Scanning…' : 'Run Scan'}
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="api-error glass" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          ⚠️ {error} — <button onClick={refetch} style={{ color:'var(--purple-300)' }}>retry</button>
        </motion.div>
      )}

      {/* Summary pills */}
      <div className="alerts-summary">
        {['critical','warning','info'].map(sev => {
          const sc   = severityConfig[sev];
          const Icon = sc.icon;
          return (
            <motion.div
              key={sev}
              className={`summary-pill glass ${sc.bgCls}`}
              initial={{ scale:0.9, opacity:0 }}
              animate={{ scale:1,   opacity:1 }}
              whileHover={{ scale:1.03 }}
            >
              <Icon size={20} style={{ color: sc.color }} />
              <span className="summary-count" style={{ color: sc.color }}>{counts[sev]}</span>
              <span className="summary-label">{sev}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Alert cards */}
      <div className="alerts-list">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="alert-card glass"
                initial={{ opacity:0 }}
                animate={{ opacity:[0.3,0.6,0.3] }}
                transition={{ repeat: Infinity, duration: 1.4, delay: i*0.15 }}
                style={{ height: 90 }}
              />
            ))
          ) : visible.map((alert, i) => {
            const sc   = severityConfig[alert.severity] ?? severityConfig.info;
            const Icon = sc.icon;
            const isFetching = loadingProd && modalAlert?.id === alert.id;

            return (
              <motion.div
                key={alert.id}
                layout
                className={`alert-card glass ${sc.bgCls}`}
                initial={{ opacity:0, x:-20 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:40, height:0, marginBottom:0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="alert-icon-wrap" style={{ background:`${sc.color}18`, border:`1px solid ${sc.color}30` }}>
                  <Icon size={18} style={{ color: sc.color }} />
                </div>

                <div className="alert-body">
                  <div className="alert-top">
                    <span className="alert-sku">{alert.product_sku ?? `#${alert.product_id}`}</span>
                    <span className={`badge ${sc.cls}`}>{alert.severity}</span>
                    <span className="alert-time">{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="alert-name">{alert.product_name ?? 'Unknown Product'}</p>
                  <p className="alert-msg">{alert.message}</p>
                </div>

                <div className="alert-actions">
                  <button
                    className="alert-btn alert-btn--resolve"
                    onClick={() => handleResolveClick(alert)}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <><span className="rm-spinner" style={{ width:12,height:12 }}/> Loading…</>
                    ) : (
                      <><CheckCircle size={14} /> Resolve</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!loading && visible.length === 0 && (
          <motion.div className="empty-state glass" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <CheckCircle size={40} style={{ color:'#4ade80', marginBottom:'12px' }} />
            <p className="empty-title">All Clear!</p>
            <p className="empty-sub">No active alerts for the selected filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
