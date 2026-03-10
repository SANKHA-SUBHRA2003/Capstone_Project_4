import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { revenueData, stockLevelData } from '../../data/mockData';
import './Analytics.css';

const radarData = [
  { metric: 'Stock Velocity', value: 85 },
  { metric: 'Fill Rate',      value: 92 },
  { metric: 'Turnover',       value: 68 },
  { metric: 'Accuracy',       value: 96 },
  { metric: 'Lead Time',      value: 74 },
  { metric: 'Demand Forecast',value: 79 },
];

const scatterData = [
  { x: 20, y: 349.99,  name: 'Headphones'  },
  { x: 48, y: 129.99,  name: 'Sneakers'    },
  { x: 122,y: 159.99,  name: 'Kindle'      },
  { x: 35, y: 849.99,  name: 'LEGO Set'    },
  { x: 210,y: 79.99,   name: 'Books Set'   },
  { x: 74, y: 59.99,   name: 'Garden Hose' },
  { x: 5,  y: 49.99,   name: 'Yoga Mat'    },
  { x: 8,  y: 179.99,  name: 'Ultraboost'  },
];

export default function Analytics() {
  return (
    <div className="page">
      <motion.p
        className="analytics-intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Deep-dive performance metrics & forecasting signals for your inventory.
      </motion.p>

      <div className="analytics-grid">
        {/* Radar chart */}
        <motion.div
          className="chart-card glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">KPI Radar</h3>
              <p className="chart-sub">Operational health across 6 dimensions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(139,92,246,0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#7c6fa0', fontSize: 11 }} />
              <Radar name="KPI" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Scatter chart */}
        <motion.div
          className="chart-card glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Price vs Quantity</h3>
              <p className="chart-sub">Margin opportunity mapping</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="x" name="Qty" tick={{ fill: '#7c6fa0', fontSize: 11 }} label={{ value: 'Qty', position: 'insideBottom', offset: -2, fill: '#7c6fa0', fontSize: 11 }} />
              <YAxis dataKey="y" name="Price" tick={{ fill: '#7c6fa0', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(139,92,246,0.3)' }}
                contentStyle={{ background: 'rgba(30,16,64,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#f1eeff', fontSize: '12px' }}
                formatter={(val, name) => [name === 'Price' ? `$${val}` : val, name]}
              />
              <Scatter data={scatterData} fill="#f472b6" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Combined multi-line */}
      <motion.div
        className="chart-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Revenue vs Orders — Trend Overlay</h3>
            <p className="chart-sub">Correlation over the past 8 months</p>
          </div>
          <span className="badge badge-cyan">Live Data</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
            <XAxis dataKey="month" tick={{ fill: '#7c6fa0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" tick={{ fill: '#7c6fa0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
            <YAxis yAxisId="ord" orientation="right" tick={{ fill: '#7c6fa0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(30,16,64,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#f1eeff', fontSize: '12px' }} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#c4b5fd' }} />
            <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
            <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
