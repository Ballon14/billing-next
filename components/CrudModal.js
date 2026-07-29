'use client'

import { createPortal } from 'react-dom'

/**
 * CrudModal — Reusable modal wrapper for CRUD forms.
 * Uses React Portal to render directly into document.body,
 * ensuring the modal is not clipped by any parent container.
 *
 * Props:
 *   open       - boolean, show/hide modal
 *   title      - string, modal title
 *   wide       - boolean, use wider modal (optional)
 *   onClose    - function, called when modal should close
 *   onSubmit   - function(e), called on form submit
 *   submitLabel - string, submit button label (default: "Simpan")
 *   children   - form field content (FormGroup / FormRow elements)
 */
export default function CrudModal({ open, title, wide, onClose, onSubmit, submitLabel = 'Simpan', children }) {
  if (!open) return null

  function handleBackdropClick(e) {
    if (e.target.classList.contains('crud-modal')) {
      onClose()
    }
  }

  const modal = (
    <div className="crud-modal show" onClick={handleBackdropClick}>
      <div className={`crud-modal-content${wide ? ' crud-modal-wide' : ''}`}>
        <div className="crud-modal-header">
          <h3>{title}</h3>
          <button className="crud-modal-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <form className="crud-form" onSubmit={onSubmit}>
          {children}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )

  // Render via portal to document.body so modal is never clipped by parent containers
  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body)
  }

  return modal
}
