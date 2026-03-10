import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CalendarPicker.css';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
}

function isBetween(day, from, to) {
  if (!from || !to) return false;
  const t = day.getTime();
  return t > from.getTime() && t < to.getTime();
}

/**
 * CalendarPicker
 * Props:
 *  onSelect({ from, to })  – called when both dates are picked
 *  onClose()               – called when the X is pressed
 */
export default function CalendarPicker({ onSelect, onClose, initialFrom, initialTo }) {
  const today  = new Date();
  const [view, setView]  = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [from, setFrom]  = useState(initialFrom || null);
  const [to,   setTo]    = useState(initialTo   || null);
  const [hovering, setHovering] = useState(null);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const prevMonth = () => setView(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
  );
  const nextMonth = () => setView(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
  );

  // Build grid: get first day of month, pad empties
  const firstDay = new Date(view.year, view.month, 1).getDay(); // 0-6
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null),
                  ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1))];

  const handleDayClick = (day) => {
    if (!from || (from && to)) {
      // start new range
      setFrom(day);
      setTo(null);
    } else {
      // complete range
      if (day < from) {
        setTo(from);
        setFrom(day);
        onSelect({ from: day, to: from });
      } else {
        setTo(day);
        onSelect({ from, to: day });
      }
    }
  };

  const effectiveTo = to || hovering;

  const fmt = (d) => d
    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <AnimatePresence>
      <motion.div
        className="cal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="cal-popup glass"
          ref={ref}
          initial={{ opacity: 0, scale: 0.92, y: -10 }}
          animate={{ opacity: 1, scale: 1,    y: 0    }}
          exit={{    opacity: 0, scale: 0.92, y: -10  }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="cal-header">
            <span className="cal-header-title">Select Date Range</span>
            <button className="cal-close" onClick={onClose}><X size={14} /></button>
          </div>

          {/* Selected range display */}
          <div className="cal-range-display">
            <div className={`cal-range-pill ${from ? 'cal-range-pill--active' : ''}`}>
              <span className="cal-range-label">FROM</span>
              <span className="cal-range-val">{fmt(from)}</span>
            </div>
            <div className="cal-range-arrow">→</div>
            <div className={`cal-range-pill ${to ? 'cal-range-pill--active' : ''}`}>
              <span className="cal-range-label">TO</span>
              <span className="cal-range-val">{fmt(to)}</span>
            </div>
          </div>

          {/* Month navigation */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <span className="cal-month-label">{MONTHS[view.month]} {view.year}</span>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          {/* Day-of-week headers */}
          <div className="cal-grid cal-grid--header">
            {DAYS.map(d => <span key={d} className="cal-day-name">{d}</span>)}
          </div>

          {/* Day cells */}
          <div className="cal-grid">
            {cells.map((day, i) => {
              if (!day) return <span key={`e-${i}`} />;
              const isFrom    = sameDay(day, from);
              const isTo      = sameDay(day, to);
              const inRange   = isBetween(day, from, effectiveTo && effectiveTo > from ? effectiveTo : to);
              const isToday   = sameDay(day, today);
              const isPast    = day > today;

              return (
                <button
                  key={day.toISOString()}
                  className={[
                    'cal-day',
                    isFrom    ? 'cal-day--from'    : '',
                    isTo      ? 'cal-day--to'      : '',
                    inRange   ? 'cal-day--in-range' : '',
                    isToday   ? 'cal-day--today'   : '',
                  ].join(' ')}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => from && !to && setHovering(day)}
                  onMouseLeave={() => setHovering(null)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="cal-actions">
            <button className="cal-btn-clear" onClick={() => { setFrom(null); setTo(null); }}>
              Clear
            </button>
            <button
              className="cal-btn-apply"
              onClick={() => { if (from && to) { onSelect({ from, to }); onClose(); } }}
              disabled={!from || !to}
            >
              Apply
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
