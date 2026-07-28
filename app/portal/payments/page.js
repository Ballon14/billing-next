'use client'

import { useState, useEffect } from 'react'

export default function PortalPaymentsPage() {
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [payForm, setPayForm] = useState({ invoice_id: '', amount: '', payment_method: 'transfer', reference: '', notes: '' })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/customer/me')
        const json = await res.json()
        if (json.success) {
          setInvoices(json.data.invoices?.filter(i => i.status === 'unpaid') || [])
          setPayments(json.data.invoices?.flatMap(i => i.payments || []) || [])
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handlePay(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      alert('Pembayaran berhasil dicatat! Menunggu verifikasi admin.')
      setShowPay(false)
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>👛 Pembayaran</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Riwayat Pembayaran</h3>
          <button className="btn-action btn-add" onClick={() => setShowPay(true)} disabled={invoices.length === 0}>➕ Bayar Tagihan</button>
        </div>
        <div className="card-body">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Jumlah</th><th>Metode</th><th>Status</th><th>Tanggal</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
                : payments.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Belum ada pembayaran</div></div></td></tr>
                : payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.invoice?.invoiceNumber || '-'}</td>
                    <td>Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                    <td>{p.paymentMethod || '-'}</td>
                    <td><span className={`badge badge-${p.status === 'verified' ? 'success' : p.status === 'rejected' ? 'error' : 'warning'}`}>{p.status}</span></td>
                    <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPay && (
        <div className="crud-modal show" onClick={e => e.target.classList.contains('crud-modal') && setShowPay(false)}>
          <div className="crud-modal-content">
            <div className="crud-modal-header"><h3>Bayar Tagihan</h3><button className="crud-modal-close" onClick={() => setShowPay(false)}>✕</button></div>
            <form className="crud-form" onSubmit={handlePay}>
              <div className="form-group">
                <label>Pilih Tagihan</label>
                <select value={payForm.invoice_id} onChange={e => { const inv = invoices.find(i => i.id === parseInt(e.target.value)); setPayForm({...payForm, invoice_id: e.target.value, amount: inv ? inv.amount : ''}) }} required>
                  <option value="">— Pilih —</option>
                  {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - Rp {Number(i.amount).toLocaleString('id-ID')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Jumlah</label><input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required /></div>
              <div className="form-group"><label>Metode Pembayaran</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})}>
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="e-wallet">E-Wallet</option>
                </select>
              </div>
              <div className="form-group"><label>Referensi/Nomor</label><input value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} placeholder="No. referensi transfer" /></div>
              <div className="form-group"><label>Catatan</label><input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} /></div>
              <div className="form-actions"><button type="button" className="btn-cancel" onClick={() => setShowPay(false)}>Batal</button><button type="submit" className="btn-submit">Kirim</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
