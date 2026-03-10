import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileCog, RefreshCw, CheckCircle, Calendar } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { fetchReportLogs, generateAndDownloadReport } from '../../services/api';
import CalendarPicker from '../../components/CalendarPicker/CalendarPicker';
import './Reports.css';

const PERIOD_OPTIONS = [
  { label: 'This Month',   type: 'thisMonth' },
  { label: 'Last Month',   type: 'lastMonth' },
  { label: 'Custom Dates', type: 'custom'    },
];

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getPeriodLabel(type, customFrom, customTo) {
  const now = new Date();
  if (type === 'thisMonth')
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  if (type === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (type === 'custom' && customFrom && customTo) {
    const fmt = d => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    return `${fmt(customFrom)} to ${fmt(customTo)}`;
  }
  return 'Custom';
}

export default function Reports() {
  const [generating,   setGenerating]   = useState(false);
  const [generated,    setGenerated]    = useState(false);
  const [genError,     setGenError]     = useState('');
  const [activePeriod, setActivePeriod] = useState('thisMonth');
  const [format,       setFormat]       = useState('csv');
  const [showCal,      setShowCal]      = useState(false);
  const [customFrom,   setCustomFrom]   = useState(null);
  const [customTo,     setCustomTo]     = useState(null);

  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useApi(fetchReportLogs, 20);
  const logs = logsData?.items ?? [];

  const periodLabel = getPeriodLabel(activePeriod, customFrom, customTo);
  const canGenerate = activePeriod !== 'custom' || (customFrom && customTo);

  const customChipLabel = activePeriod === 'custom' && customFrom && customTo
    ? `${customFrom.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} – ${customTo.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`
    : 'Custom Dates';

  const handleChipClick = (type) => {
    setActivePeriod(type);
    setGenerated(false);
    setGenError('');
    if (type === 'custom') setShowCal(true);
  };

  const handleCalSelect = ({ from, to }) => {
    setCustomFrom(from);
    setCustomTo(to);
    setGenerated(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    setGenError('');
    try {
      await generateAndDownloadReport({
        period_label: periodLabel,
        format,
        date_from: customFrom ? customFrom.toISOString().slice(0,10) : undefined,
        date_to:   customTo   ? customTo.toISOString().slice(0,10)   : undefined,
      });
      setGenerated(true);
      refetchLogs(); // refresh history table
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page">
      {showCal && (
        <CalendarPicker
          onSelect={handleCalSelect}
          onClose={() => setShowCal(false)}
          initialFrom={customFrom}
          initialTo={customTo}
        />
      )}

      {/* ── Generate section ─────────────────────────────────────────────── */}
      <motion.div className="gen-card glass" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <div className="gen-icon"><FileCog size={28} /></div>

        <div className="gen-body">
          <h2 className="gen-title">Generate Report</h2>
          <p className="gen-sub">
            Pulls live inventory data from the database and streams the file to your browser.
          </p>

          {/* Period chips */}
          <div className="period-scroller-wrap">
            <div className="period-scroller">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  className={`period-chip ${activePeriod === opt.type ? 'period-chip--active' : ''}`}
                  onClick={() => handleChipClick(opt.type)}
                >
                  {opt.type === 'custom' ? <><Calendar size={13}/> {customChipLabel}</> : opt.label}
                </button>
              ))}
            </div>
            {activePeriod === 'custom' && customFrom && customTo && (
              <motion.button
                className="period-chip period-chip--edit"
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                onClick={() => setShowCal(true)}
              >
                <Calendar size={13}/> Edit Dates
              </motion.button>
            )}
          </div>

          <p className="period-active-label">Period: <strong>{periodLabel}</strong></p>

          {/* Format toggle */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px', alignItems:'center' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Format:</span>
            {['csv','json'].map(f => (
              <button
                key={f}
                className={`period-chip ${format === f ? 'period-chip--active' : ''}`}
                style={{ padding:'6px 16px', borderRadius:'8px' }}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            className={`btn-generate ${generating ? 'btn-generate--loading' : ''} ${generated ? 'btn-generate--done' : ''}`}
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
          >
            {generating ? (
              <><RefreshCw size={15} className="spin-icon"/> Generating & Downloading…</>
            ) : generated ? (
              <><CheckCircle size={15}/> Downloaded!</>
            ) : (
              <><RefreshCw size={15}/> Generate & Download</>
            )}
          </button>

          {genError && (
            <motion.p
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              style={{ color:'var(--red-400)', fontSize:'0.8rem', marginTop:'8px' }}
            >
              ⚠️ {genError}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* ── Report history from database ──────────────────────────────────── */}
      <motion.div className="reports-table-wrap glass" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
        <div className="reports-table-header">
          <h3 className="chart-title">Report History</h3>
          <span className="badge badge-purple">{logs.length} reports</span>
        </div>
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Report Name</th>
              <th>Period</th>
              <th>Format</th>
              <th>Rows</th>
              <th>Triggered</th>
              <th>Generated At</th>
            </tr>
          </thead>
          <tbody>
            {logsLoading
              ? Array.from({length:3}).map((_,i)=>(
                  <tr key={i} className="inv-row">
                    {Array.from({length:7}).map((_,j)=><td key={j}><div className="skeleton-cell"/></td>)}
                  </tr>
                ))
              : logs.map((r, i) => (
                <motion.tr
                  key={r.id}
                  className="inv-row"
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                >
                  <td className="td-sku">#{r.id}</td>
                  <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{r.report_name}</td>
                  <td className="td-muted">{r.period_label}</td>
                  <td><span className="badge badge-info">{r.format.toUpperCase()}</span></td>
                  <td className="td-muted">{r.row_count}</td>
                  <td><span className="badge badge-purple">{r.triggered_by}</span></td>
                  <td className="td-muted">{new Date(r.generated_at).toLocaleString()}</td>
                </motion.tr>
              ))
            }
          </tbody>
        </table>
        {!logsLoading && logs.length === 0 && (
          <p style={{textAlign:'center', padding:'24px', color:'var(--text-muted)', fontSize:'0.84rem'}}>
            No reports generated yet. Generate one above!
          </p>
        )}
      </motion.div>
    </div>
  );
}
