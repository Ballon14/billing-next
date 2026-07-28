'use client'

import { useState, useEffect } from 'react'

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/customer/me')
        const json = await res.json()
        if (json.success) setInvoices(json.data.invoices || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}><i className="fas fa-file-invoice"></i> Tagihan Saya</h2>
      <div className="card">
        <div className="card-body">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Periode</th><th>Jumlah</th><th>Status</th><th>Jatuh Tempo</th><th>Dibayar</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
                : invoices.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Belum ada tagihan</div></div></td></tr>
                : invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.periodStart || '-'} s/d {inv.periodEnd || '-'}</td>
                    <td>Rp {Number(inv.amount).toLocaleString('id-ID')}</td>
                    <td><span className={`badge badge-${inv.status === 'paid' ? 'success' : 'warning'}`}>{inv.status}</span></td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                    <td>Rp {inv.payments?.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID') || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
