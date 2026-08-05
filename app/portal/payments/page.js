'use client'

import { useState, useEffect } from 'react'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

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
      // reload location to see changes immediately
      window.location.reload()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--gradient-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--glow-cyan)' }}>
            <i className="fas fa-wallet" style={{ fontSize: 20 }}></i>
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>Pembayaran</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Riwayat pembayaran dan konfirmasi transfer.</div>
          </div>
        </div>
        <button 
          onClick={() => setShowPay(true)} 
          disabled={invoices.length === 0}
          style={{
            background: 'var(--gradient-cyan)', color: '#fff', border: 'none', 
            padding: '12px 24px', borderRadius: '100px', fontSize: 14, fontWeight: 600,
            cursor: invoices.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: invoices.length === 0 ? 'none' : 'var(--glow-cyan)',
            opacity: invoices.length === 0 ? 0.5 : 1,
            transition: 'var(--transition-fast)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <i className="fas fa-plus"></i> Konfirmasi Pembayaran
        </button>
      </div>

      <div className="glass-card delay-100 animate-fade-in">
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Invoice</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Jumlah</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Metode</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Tanggal</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 0', textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent-cyan)' }}></i>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 0', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Belum ada riwayat pembayaran</div>
                  </td>
                </tr>
              ) : payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.invoice?.invoiceNumber || '-'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Rp {Number(p.amount).toLocaleString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
                    <div style={{ display: 'inline-block', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>{p.paymentMethod || '-'}</div>
                    {p.reference && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ref: {p.reference}</div>}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
                      padding: '4px 12px', borderRadius: 20,
                      background: p.status === 'verified' ? 'rgba(52, 211, 153, 0.1)' : p.status === 'rejected' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      color: p.status === 'verified' ? 'var(--accent-green)' : p.status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-yellow)'
                    }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CrudModal open={showPay} title="Konfirmasi Pembayaran" onClose={() => setShowPay(false)} onSubmit={handlePay} submitLabel="Kirim Konfirmasi">
        <FormGroup label="Pilih Tagihan">
          <select value={payForm.invoice_id} onChange={e => { const inv = invoices.find(i => i.id === parseInt(e.target.value)); setPayForm({...payForm, invoice_id: e.target.value, amount: inv ? inv.amount : ''}) }} required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="">— Pilih Tagihan —</option>
            {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - Rp {Number(i.amount).toLocaleString('id-ID')}</option>)}
          </select>
        </FormGroup>
        <FormRow>
          <FormGroup label="Jumlah Transfer (Rp)">
            <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </FormGroup>
          <FormGroup label="Metode Pembayaran">
            <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="transfer">Transfer Bank</option>
              <option value="cash">Tunai</option>
              <option value="e-wallet">E-Wallet</option>
            </select>
          </FormGroup>
        </FormRow>
        <FormGroup label="No. Referensi / Pengirim">
          <input value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} placeholder="Misal: Budi / Ref: 12345" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
        </FormGroup>
        <FormGroup label="Catatan Tambahan">
          <input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} placeholder="Opsional" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
        </FormGroup>
      </CrudModal>
    </div>
  )
}
