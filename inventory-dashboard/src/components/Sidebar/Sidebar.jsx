import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, Bell, FileText,
  TrendingUp, LogOut, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory',  icon: Package         },
  { path: '/alerts',    label: 'Alerts',     icon: Bell            },
  { path: '/reports',   label: 'Reports',    icon: FileText        },
  { path: '/analytics', label: 'Analytics',  icon: TrendingUp      },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar glass">
      {/* Logo */}
      <motion.div
        className="sidebar-logo"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="logo-icon">
          <Zap size={20} />
        </div>
        <div className="logo-text">
          <span className="logo-title">StockPulse</span>
          <span className="logo-sub">Inventory Manager</span>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">MAIN MENU</p>
        {navItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        className="sidebar-link-bg"
                        layoutId="activeNav"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={18} className="sidebar-link-icon" />
                    <span>{item.label}</span>
                    {item.label === 'Alerts' && (
                      <span className="sidebar-badge">3</span>
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          );
        })}

        <p className="sidebar-section-label" style={{ marginTop: '24px' }}>ACCOUNT</p>
        <button className="sidebar-link sidebar-link--danger sidebar-logout-btn" onClick={logout}>
          <LogOut size={18} className="sidebar-link-icon" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Bottom card */}
      <motion.div
        className="sidebar-card glass-strong"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="sidebar-card-icon">⚡</div>
        <p className="sidebar-card-title">Auto-Alerts Active</p>
        <p className="sidebar-card-sub">Next scan in 4 minutes</p>
        <div className="sidebar-card-progress">
          <motion.div
            className="sidebar-card-progress-fill"
            initial={{ width: '0%' }}
            animate={{ width: '73%' }}
            transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </aside>
  );
}
