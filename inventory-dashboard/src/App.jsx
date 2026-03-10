import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import Alerts from './pages/Alerts/Alerts';
import Reports from './pages/Reports/Reports';
import Analytics from './pages/Analytics/Analytics';
import './App.css';

const pageTitles = {
  '/':          'Dashboard',
  '/inventory': 'Inventory',
  '/alerts':    'Alerts',
  '/reports':   'Reports',
  '/analytics': 'Analytics',
};

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'StockPulse';

  return (
    <>
      <Topbar title={title} />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ width: '100%' }}
          >
            <Routes location={location}>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/alerts"    element={<Alerts />} />
              <Route path="/reports"   element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

function AppShell() {
  const { user } = useAuth();

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', minHeight: '100vh' }}
        >
          <Login />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      key="app"
      className="app-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Sidebar />
      <div className="app-body">
        <AnimatedRoutes />
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
