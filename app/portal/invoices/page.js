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
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--gradient-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--glow-cyan)' }}>
          <i className="fas fa-file-invoice" style={{ fontSize: 20 }}></i>
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>Tagihan Saya</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Daftar seluruh tagihan layanan internet Anda.</div>
        </div>
      </div>

      <div className="glass-card delay-100 animate-fade-in">
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Invoice</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Periode</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Jumlah</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, fontWeight: 600 }}>Jatuh Tempo</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 0', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Belum ada tagihan</div>
                  </td>
                </tr>
              ) : invoices.map((inv, idx) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.invoiceNumber}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {inv.periodStart || '-'} s/d {inv.periodEnd || '-'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Rp {Number(inv.amount).toLocaleString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
                      padding: '4px 12px', borderRadius: 20,
                      background: inv.status === 'paid' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                      color: inv.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)'
                    }}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
