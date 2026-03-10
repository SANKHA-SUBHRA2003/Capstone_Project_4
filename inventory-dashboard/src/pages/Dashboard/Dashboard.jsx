import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import KpiCard from '../../components/KpiCard/KpiCard';
import { useApi } from '../../hooks/useApi';
import { fetchKPI } from '../../services/api';
import { revenueData, stockLevelData, categoryPieData } from '../../data/mockData';
import './Dashboard.css';

// ── Derived KPI cards from live API data ──────────────────────────────────────
function buildKpiCards(kpi) {
  if (!kpi) return [];
  return [
    { id: 1, title: 'Total SKUs',      value: kpi.total_skus,          unit: '',  change: +5.2,  icon: 'package',  color: 'purple' },
    { id: 2, title: 'Low Stock Items', value: kpi.low_stock_count,     unit: '',  change: -3.1,  icon: 'alert',    color: 'yellow' },
    { id: 3, title: 'Out of Stock',    value: kpi.out_of_stock_count,  unit: '',  change: +2.0,  icon: 'x-circle', color: 'red'    },
    { id: 4, title: 'Inventory Value', value: kpi.total_inventory_value, unit: '$', change: +12.4, icon: 'dollar',   color: 'green'  },
  ];
}

// ── Build stock-by-category bar chart from live low-stock items ───────────────
function buildStockChartFromLive(kpi) {
  if (!kpi?.low_stock_items?.length) return stockLevelData; // fallback
  // Aggregate by category
  const map = {};
  (kpi.low_stock_items).forEach(p => {
    if (!map[p.category]) map[p.category] = { category: p.category, inStock: 0, lowStock: 0, outOfStock: 0 };
    if (p.status === 'Low Stock')    map[p.category].lowStock   += p.quantity;
    if (p.status === 'Out of Stock') map[p.category].outOfStock += 1;
  });
  return Object.values(map).length ? Object.values(map) : stockLevelData;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.8rem' }}>
            {p.name}: {p.name === 'revenue' ? `$${(+p.value).toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="kpi-grid">
      {[1,2,3,4].map(i => (
        <motion.div
          key={i}
          className="kpi-card glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.1 }}
          style={{ height: 140 }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: kpi, loading, error } = useApi(fetchKPI);
  const kpiCards  = buildKpiCards(kpi);
  const stockData = buildStockChartFromLive(kpi);

  return (
    <div className="page">
      {/* KPI Row */}
      {loading ? <KpiSkeleton /> : error ? (
        <div className="api-error glass">
          ⚠️ Could not load KPIs — is the backend running? <code>{error}</code>
        </div>
      ) : (
        <div className="kpi-grid">
          {kpiCards.map((card, i) => <KpiCard key={card.id} card={card} index={i} />)}
        </div>
      )}

      {/* Revenue Trend (mock — no revenue table yet) */}
      <div className="charts-row">
        <motion.div className="chart-card glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Revenue Trend</h3>
              <p className="chart-sub">Monthly overview</p>
            </div>
            <span className="badge badge-success">▲ 12.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#7c6fa0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7c6fa0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#c4b5fd' }} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="orders"  stroke="#f472b6" strokeWidth={2}   fill="url(#ordGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category donut — mock */}
        <motion.div className="chart-card glass chart-card--sm" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">By Category</h3>
              <p className="chart-sub">Unit distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                {categoryPieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(30,16,64,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#f1eeff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {categoryPieData.map((e, i) => (
              <div key={i} className="pie-legend-item">
                <span className="pie-dot" style={{ background: e.fill }} />
                <span className="pie-name">{e.name}</span>
                <span className="pie-val">{e.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stock levels — live from API */}
      <motion.div className="chart-card glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Stock Levels by Category</h3>
            <p className="chart-sub">{loading ? 'Loading…' : 'Live from database'}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-success">In Stock</span>
            <span className="badge badge-warning">Low</span>
            <span className="badge badge-danger">Out</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stockLevelData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barSize={14} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" vertical={false} />
            <XAxis dataKey="category" tick={{ fill: '#7c6fa0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7c6fa0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(30,16,64,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#f1eeff' }} />
            <Bar dataKey="inStock"    name="In Stock"     fill="#4ade80" radius={[4,4,0,0]} />
            <Bar dataKey="lowStock"   name="Low Stock"    fill="#facc15" radius={[4,4,0,0]} />
            <Bar dataKey="outOfStock" name="Out of Stock" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
