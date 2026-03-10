import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Package, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import './KpiCard.css';

const iconMap = {
  package:   Package,
  alert:     AlertTriangle,
  'x-circle': XCircle,
  dollar:    DollarSign,
};

const colorMap = {
  purple: { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.25)', bg: 'rgba(139,92,246,0.1)' },
  yellow: { accent: '#facc15', glow: 'rgba(250,204,21,0.25)',  bg: 'rgba(250,204,21,0.08)' },
  red:    { accent: '#f87171', glow: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.08)' },
  green:  { accent: '#4ade80', glow: 'rgba(74,222,128,0.25)',  bg: 'rgba(74,222,128,0.08)' },
};

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

export default function KpiCard({ card, index }) {
  const colors = colorMap[card.color];
  const Icon = iconMap[card.icon];
  const animated = useCountUp(card.value, 1400);
  const isPositive = card.change >= 0;

  return (
    <motion.div
      className="kpi-card glass"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ '--accent': colors.accent, '--glow': colors.glow, '--bg': colors.bg }}
    >
      <div className="kpi-card-header">
        <div className="kpi-icon-wrap">
          <Icon size={20} />
        </div>
        <div className={`kpi-change ${isPositive ? 'kpi-change--up' : 'kpi-change--down'}`}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{Math.abs(card.change)}%</span>
        </div>
      </div>

      <div className="kpi-value">
        {card.unit === '$' && <span className="kpi-unit">$</span>}
        {animated >= 1000
          ? (animated >= 1000000
            ? `${(animated / 1000000).toFixed(1)}M`
            : `${(animated / 1000).toFixed(0)}K`)
          : animated}
      </div>

      <p className="kpi-title">{card.title}</p>

      <div className="kpi-bar">
        <motion.div
          className="kpi-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((card.value / 2000) * 100, 100)}%` }}
          transition={{ delay: index * 0.1 + 0.6, duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
