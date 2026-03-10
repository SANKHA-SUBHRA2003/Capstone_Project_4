import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { updateProduct } from '../../services/api';
import './RestockModal.css';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Garden',
  'Toys', 'Sports', 'Books', 'Other',
];

/**
 * RestockModal
 * Opens when user clicks Resolve on an alert.
 * Lets user update stock quantity, name, category, and price.
 * If new quantity > threshold → alert is auto-resolved after save.
 *
 * Props:
 *   alert      – the alert object (has product_id, product_name, product_sku, severity)
 *   product    – the full product object fetched from /inventory/{id}
 *   onSave(newQty, threshold) – called with updated qty and threshold after successful save
 *   onClose()  – close without saving
 */
export default function RestockModal({ alert, product, onSave, onClose }) {
  const [form, setForm]       = useState({
    name:       product?.name       ?? '',
    category:   product?.category   ?? CATEGORIES[0],
    quantity:   '',                           // new stock level — intentionally blank
    unit_price: product?.unit_price ?? '',
  });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const overlayRef = useRef(null);

  // Close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const threshold = product?.threshold ?? 0;
  const newQty    = parseInt(form.quantity, 10);
  const willResolve = !isNaN(newQty) && newQty > threshold;

  const set = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.quantity || isNaN(newQty) || newQty < 0) {
      setError('Please enter a valid quantity (0 or more).');
      return;
    }
    if (!form.unit_price || isNaN(+form.unit_price) || +form.unit_price <= 0) {
      setError('Please enter a valid unit price.');
      return;
    }

    setSaving(true);
    try {
      await updateProduct(product.id, {
        name:       form.name.trim(),
        category:   form.category,
        quantity:   newQty,
        unit_price: parseFloat((+form.unit_price).toFixed(2)),
      });
      onSave(newQty, threshold);   // let parent decide whether to resolve alert
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="rm-overlay"
        ref={overlayRef}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="rm-modal glass"
          initial={{ opacity: 0, scale: 0.93, y: -16 }}
          animate={{ opacity: 1, scale: 1,    y: 0    }}
          exit={{    opacity: 0, scale: 0.93, y: -16  }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="rm-header">
            <div className="rm-header-left">
              <div className="rm-header-icon">
                <Package size={20} />
              </div>
              <div>
                <h2 className="rm-title">Restock Product</h2>
                <p className="rm-sku">{alert.product_sku ?? `Product #${alert.product_id}`}</p>
              </div>
            </div>
            <button className="rm-close" onClick={onClose}><X size={15} /></button>
          </div>

          {/* Alert severity badge */}
          <div className="rm-alert-badge">
            <AlertTriangle size={14} />
            Alert: <span>{alert.message}</span>
          </div>

          {/* Will-resolve notice */}
          <AnimatePresence>
            {willResolve && (
              <motion.div
                className="rm-resolve-notice"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle size={14} />
                New quantity ({newQty}) exceeds threshold ({threshold}) — alert will be <strong>auto-resolved</strong>!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form className="rm-form" onSubmit={handleSubmit}>
            {/* Product Name */}
            <div className="rm-field">
              <label className="rm-label">Product Name</label>
              <input
                className="rm-input"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Product name"
                required
              />
            </div>

            {/* Category */}
            <div className="rm-field">
              <label className="rm-label">Category</label>
              <select className="rm-input rm-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Quantity + Price side by side */}
            <div className="rm-row">
              <div className="rm-field">
                <label className="rm-label">
                  New Quantity
                  <span className="rm-threshold-hint">(threshold: {threshold})</span>
                </label>
                <input
                  className="rm-input"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={set('quantity')}
                  placeholder="e.g. 50"
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">Unit Price ($)</label>
                <input
                  className="rm-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.unit_price}
                  onChange={set('unit_price')}
                  placeholder="e.g. 49.99"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p className="rm-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ⚠️ {error}
              </motion.p>
            )}

            {/* Actions */}
            <div className="rm-actions">
              <button type="button" className="rm-btn rm-btn--cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={`rm-btn rm-btn--save ${saving ? 'rm-btn--loading' : ''} ${willResolve ? 'rm-btn--resolve' : ''}`}
                disabled={saving}
              >
                {saving ? (
                  <span className="rm-spinner" />
                ) : willResolve ? (
                  <><CheckCircle size={14} /> Save & Resolve Alert</>
                ) : (
                  'Save Stock Update'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
