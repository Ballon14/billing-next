'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiPost, apiPut } from '@/lib/client-api.mjs'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

const PAGE_SIZE = 25

export default function PaymentsPage() {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ invoice_id: '', amount: '', payment_method: '', reference: '', notes: '' })
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  async function verifyPayment(id) {
    if (!confirm('Verifikasi pembayaran ini?')) return
    try {
      const res = await fetch(`/api/payments/${id}/verify`, { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      load()
    } catch (err) { alert(err.message) }
  }

  async function rejectPayment(id) {
    const reason = prompt('Alasan penolakan:')
    if (reason === null) return
    try {
      const res = await fetch(`/api/payments/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Rejected by admin' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      load()
    } catch (err) { alert(err.message) }
  }

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payments?page=${p || page}`)
      const json = await res.json()
      if (json.success) { setData(json.data.data); setTotal(json.data.total); setPage(json.data.currentPage) }
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { load(1) }, [])

  const lastPage = Math.ceil(total / PAGE_SIZE)

  async function loadInvoices() {
    const res = await fetch('/api/invoices?all=true')
    const json = await res.json()
    if (json.success) setInvoices(json.data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await apiPost('/api/payments', form)
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-wallet"></i> Payments</h3>
        <div className="card-header-actions">
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}>
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-action btn-edit" onClick={() => window.open('/api/export/payments', '_blank')}><i className="fas fa-download"></i> Export CSV</button>
          <button className="btn-action btn-add" onClick={async () => { await loadInvoices(); setForm({ invoice_id: '', amount: '', payment_method: '', reference: '', notes: '' }); setShowModal(true) }}><i className="fas fa-plus"></i> Catat Pembayaran</button>
        </div>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Invoice</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              : data.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Belum ada pembayaran</div></div></td></tr>
              : data.filter(p => !filterStatus || p.status === filterStatus).map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.invoice?.invoiceNumber || '-'}</td>
                  <td>{p.invoice?.customer?.name || '-'}</td>
                  <td>Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                  <td>{p.paymentMethod || '-'}</td>
                  <td><span className={`badge badge-${p.status === 'verified' ? 'success' : p.status === 'rejected' ? 'error' : 'warning'}`}>{p.status}</span></td>
                  <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID') : '-'}</td>
                  <td>{p.status === 'pending' ? <div className="table-actions"><button className="btn-sm btn-success" onClick={() => verifyPayment(p.id)}><i className="fas fa-check"></i></button><button className="btn-sm btn-danger" onClick={() => rejectPayment(p.id)}><i className="fas fa-xmark"></i></button></div> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && (
          <div className="pagination-bar">
            <span>{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE, total)} dari {total}</span>
            <div className="pagination-actions">
              <button className="page-btn" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
              <span style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{page} / {lastPage}</span>
              <button className="page-btn" disabled={page >= lastPage} onClick={() => load(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <CrudModal open={showModal} title="Catat Pembayaran" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
        <FormGroup label="Invoice">
          <select value={form.invoice_id} onChange={e => setForm({...form, invoice_id: e.target.value})} required>
            <option value="">— Pilih Invoice —</option>
            {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - {i.customer?.name} (Rp {Number(i.amount).toLocaleString('id-ID')})</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Amount">
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
        </FormGroup>
        <FormRow>
          <FormGroup label="Payment Method">
            <input type="text" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} />
          </FormGroup>
          <FormGroup label="Reference">
            <input type="text" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Notes">
          <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </FormGroup>
      </CrudModal>
    </div>
  )
}
