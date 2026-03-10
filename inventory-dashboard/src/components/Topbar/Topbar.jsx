import { motion } from 'framer-motion';
import { Bell, Search, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Topbar.css';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();

  // First letter of display name for avatar
  const avatarLetter = user?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <motion.header
      className="topbar glass"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-search">
        <Search size={15} className="search-icon" />
        <input type="text" placeholder="Search products, SKUs…" className="search-input" />
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn" aria-label="notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
        <div className="topbar-user">
          <div className="user-avatar">
            {avatarLetter}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.displayName || 'User'}</span>
            <span className="user-role">{user?.email || ''}</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </motion.header>
  );
}
