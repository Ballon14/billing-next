'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function PortalDashboardPage() {
  const { data: session } = useSession()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/customer/me')
        const json = await res.json()
        if (json.success) {
          setCustomer(json.data)
          setStats({
            totalInvoices: json.data.invoices?.length || 0,
            unpaid: json.data.invoices?.filter(i => i.status === 'unpaid').length || 0,
            paid: json.data.invoices?.filter(i => i.status === 'paid').length || 0,
            totalDue: json.data.invoices?.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0) || 0,
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent-cyan)' }}></i>
    </div>
  )

  const isIsolated = customer?.status === 'isolated'
  const isSuspended = customer?.status === 'suspended'
  const statusColors = { active: 'var(--accent-green)', inactive: 'var(--text-muted)', suspended: 'var(--accent-yellow)', terminated: 'var(--accent-red)', isolated: 'var(--accent-red)' }
  const statusGlows = { active: 'var(--glow-cyan)', isolated: '0 0 20px rgba(248, 113, 113, 0.2)' }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Selamat Datang, <span style={{ color: 'var(--accent-cyan)' }}>{session?.user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Berikut adalah ringkasan layanan internet Anda.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Status Card */}
        <div className="glass-card delay-100 animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 100, color: statusColors[customer?.status] }}>
            <i className={`fas ${isIsolated || isSuspended ? 'fa-ban' : 'fa-wifi'}`}></i>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColors[customer?.status] }}>
              <i className={`fas ${isIsolated || isSuspended ? 'fa-triangle-exclamation' : 'fa-signal'}`}></i>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Status Koneksi</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: statusColors[customer?.status], textTransform: 'uppercase', textShadow: statusGlows[customer?.status] || 'none' }}>
            {customer?.status || '-'}
          </div>
          {isIsolated && <div style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 8, fontWeight: 500 }}>Koneksi terisolir karena tagihan.</div>}
        </div>

        {/* Package Card */}
        <div className="glass-card delay-200 animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
              <i className="fas fa-box-open"></i>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Paket Internet</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {customer?.package?.name || '-'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 4, fontWeight: 600 }}>
            Rp {Number(customer?.package?.price || 0).toLocaleString('id-ID')}<span style={{color: 'var(--text-muted)', fontWeight: 400}}>/bln</span>
          </div>
        </div>

        {/* Unpaid Invoice Card */}
        <div className="glass-card delay-300 animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', border: stats.unpaid > 0 ? '1px solid rgba(248, 113, 113, 0.3)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: stats.unpaid > 0 ? 'rgba(248, 113, 113, 0.1)' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stats.unpaid > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Tagihan Belum Dibayar</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: stats.unpaid > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {stats.unpaid} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Tagihan</span>
          </div>
          <div style={{ fontSize: 13, color: stats.unpaid > 0 ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Total: Rp {Number(stats.totalDue).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Account Info */}
        <div className="glass-card delay-400 animate-fade-in">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fas fa-user-circle" style={{ color: 'var(--accent-cyan)' }}></i>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Informasi Akun</h3>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nama Lengkap</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer?.name}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>PPPoE Username</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>{customer?.pppoeUsername}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nomor Telepon</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer?.phone || '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer?.email || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="glass-card delay-400 animate-fade-in">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="fas fa-receipt" style={{ color: 'var(--accent-cyan)' }}></i>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Tagihan Terbaru</h3>
            </div>
            <Link href="/portal/invoices" style={{ fontSize: 12, color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Lihat Semua <i className="fas fa-arrow-right" style={{marginLeft:4}}></i></Link>
          </div>
          <div style={{ padding: '12px 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {(customer?.invoices || []).slice(0, 4).map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Jatuh tempo: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Rp {Number(inv.amount).toLocaleString('id-ID')}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ 
                          fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 12,
                          background: inv.status === 'paid' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                          color: inv.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)'
                        }}>{inv.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!customer?.invoices || customer.invoices.length === 0) && (
                  <tr><td colSpan={2} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada tagihan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
