import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ArrowUpDown, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { fetchInventory, deleteProduct } from '../../services/api';
import AddProductModal from '../../components/AddProductModal/AddProductModal';
import './Inventory.css';

const statusConfig = {
  'In Stock':    { cls: 'badge-success', dot: '#4ade80' },
  'Low Stock':   { cls: 'badge-warning', dot: '#facc15' },
  'Out of Stock':{ cls: 'badge-danger',  dot: '#f87171' },
};

export default function Inventory() {
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey,      setSortKey]      = useState('quantity');
  const [sortDir,      setSortDir]      = useState('asc');
  const [showAdd,      setShowAdd]      = useState(false);

  // Build params for the API hook — changes trigger re-fetch automatically
  const params = useCallback(
    () => ({ search, status: filterStatus }),
    [search, filterStatus]
  );

  const { data, loading, error, refetch } = useApi(fetchInventory, { search, status: filterStatus });

  const items = data?.items ?? [];

  // Client-side sort (server returns unsorted within page)
  const sorted = [...items].sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    refetch();
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)
    : <ArrowUpDown size={12} style={{ opacity: 0.4 }}/>;

  return (
    <div className="page">
      {/* Add Product Modal */}
      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); refetch(); }}
        />
      )}
      {/* Filters */}
      <motion.div className="inv-filters glass" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <div className="inv-search-wrap">
          <Search size={15} className="inv-search-icon" />
          <input
            className="inv-search"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="inv-chips">
          {[['','All'],['In Stock','In Stock'],['Low Stock','Low Stock'],['Out of Stock','Out of Stock']].map(([val, label]) => (
            <button
              key={val}
              className={`inv-chip ${filterStatus === val ? 'inv-chip--active' : ''}`}
              onClick={() => setFilterStatus(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="inv-chip" onClick={refetch} title="Refresh" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={13} /> Refresh
        </button>
        <button
          className="inv-chip inv-chip--add"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={14} /> Add Product
        </button>
        <div className="inv-count">{loading ? '…' : `${data?.total ?? 0} items`}</div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div className="api-error glass" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          ⚠️ {error} — <button onClick={refetch} style={{ color:'var(--purple-300)' }}>retry</button>
        </motion.div>
      )}

      {/* Table */}
      <motion.div className="inv-table-wrap glass" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
        <table className="inv-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sku')}       className="th-sort">SKU <SortIcon k="sku" /></th>
              <th onClick={() => handleSort('name')}      className="th-sort">Product <SortIcon k="name" /></th>
              <th>Category</th>
              <th onClick={() => handleSort('quantity')}  className="th-sort">Qty <SortIcon k="quantity" /></th>
              <th>Threshold</th>
              <th onClick={() => handleSort('unit_price')}className="th-sort">Price <SortIcon k="unit_price" /></th>
              <th>Status</th>
              <th>Trend</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="inv-row">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton-cell" /></td>
                  ))}
                </tr>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {sorted.map((item, i) => {
                  const sc = statusConfig[item.status] ?? statusConfig['In Stock'];
                  const isPositive = (item.mom_trend ?? 0) >= 0;
                  return (
                    <motion.tr
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.025 }}
                      className="inv-row"
                    >
                      <td className="td-sku">{item.sku}</td>
                      <td className="td-name">{item.name}</td>
                      <td><span className="badge badge-purple">{item.category}</span></td>
                      <td className={`td-qty ${item.quantity === 0 ? 'td-qty--zero' : item.quantity <= item.threshold ? 'td-qty--low' : ''}`}>
                        {item.quantity}
                      </td>
                      <td className="td-muted">&lt;{item.threshold}</td>
                      <td>${(+item.unit_price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${sc.cls}`}>
                          <span className="status-dot" style={{ background: sc.dot }} />
                          {item.status}
                        </span>
                      </td>
                      <td className={isPositive ? 'td-trend--up' : 'td-trend--down'}>
                        {isPositive ? '▲' : '▼'} {Math.abs(item.mom_trend ?? 0)}%
                      </td>
                      <td>
                        <button className="td-btn td-btn--del" title="Delete product from database" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
