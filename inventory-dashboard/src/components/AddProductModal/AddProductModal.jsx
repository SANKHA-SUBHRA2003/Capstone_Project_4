import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Package } from 'lucide-react';
import { createProduct } from '../../services/api';
import './AddProductModal.css';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Garden',
  'Toys', 'Sports', 'Books', 'Other',
];

const EMPTY = { sku:'', name:'', category:'Electronics', quantity:'', threshold:'', unit_price:'' };

export default function AddProductModal({ onClose, onAdded }) {
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.sku.trim())        return 'SKU is required.';
    if (!form.name.trim())       return 'Product name is required.';
    if (isNaN(+form.quantity) || +form.quantity < 0)  return 'Enter a valid quantity (≥ 0).';
    if (isNaN(+form.threshold) || +form.threshold < 1) return 'Threshold must be ≥ 1.';
    if (isNaN(+form.unit_price) || +form.unit_price <= 0) return 'Enter a valid unit price.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      await createProduct({
        sku:        form.sku.trim().toUpperCase(),
        name:       form.name.trim(),
        category:   form.category,
        quantity:   parseInt(form.quantity, 10),
        threshold:  parseInt(form.threshold, 10),
        unit_price: parseFloat((+form.unit_price).toFixed(2)),
        mom_trend:  0,
      });
      onAdded();   // refresh the table
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="apm-overlay"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={(e) => e.target.className === 'apm-overlay' && onClose()}
      >
        <motion.div
          className="apm-modal glass"
          initial={{ opacity:0, scale:0.93, y:-16 }}
          animate={{ opacity:1, scale:1,    y:0   }}
          exit={{    opacity:0, scale:0.93, y:-16  }}
          transition={{ duration:0.22, ease:'easeOut' }}
        >
          {/* Header */}
          <div className="apm-header">
            <div className="apm-header-left">
              <div className="apm-header-icon"><Plus size={20} /></div>
              <div>
                <h2 className="apm-title">Add New Product</h2>
                <p className="apm-sub">Saved directly to the database</p>
              </div>
            </div>
            <button className="apm-close" onClick={onClose}><X size={15}/></button>
          </div>

          <form className="apm-form" onSubmit={handleSubmit}>
            {/* SKU + Name */}
            <div className="apm-row">
              <div className="apm-field">
                <label className="apm-label">SKU</label>
                <input className="apm-input" placeholder="e.g. SKU-1015" value={form.sku} onChange={set('sku')} required />
              </div>
              <div className="apm-field apm-field--wide">
                <label className="apm-label">Product Name</label>
                <input className="apm-input" placeholder="e.g. Nike Air Max" value={form.name} onChange={set('name')} required />
              </div>
            </div>

            {/* Category */}
            <div className="apm-field">
              <label className="apm-label">Category</label>
              <select className="apm-input apm-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Qty + Threshold + Price */}
            <div className="apm-row apm-row--3">
              <div className="apm-field">
                <label className="apm-label">Quantity</label>
                <input className="apm-input" type="number" min="0" placeholder="e.g. 50" value={form.quantity} onChange={set('quantity')} required />
              </div>
              <div className="apm-field">
                <label className="apm-label">
                  Threshold
                  <span className="apm-hint">low-stock alert</span>
                </label>
                <input className="apm-input" type="number" min="1" placeholder="e.g. 20" value={form.threshold} onChange={set('threshold')} required />
              </div>
              <div className="apm-field">
                <label className="apm-label">Unit Price ($)</label>
                <input className="apm-input" type="number" min="0.01" step="0.01" placeholder="e.g. 49.99" value={form.unit_price} onChange={set('unit_price')} required />
              </div>
            </div>

            {error && (
              <motion.p className="apm-error" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                ⚠️ {error}
              </motion.p>
            )}

            <div className="apm-actions">
              <button type="button" className="apm-btn apm-btn--cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className={`apm-btn apm-btn--save ${saving ? 'apm-btn--loading' : ''}`} disabled={saving}>
                {saving ? <span className="rm-spinner"/> : <><Package size={14}/> Add Product</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
