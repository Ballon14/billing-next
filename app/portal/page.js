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

  if (loading) return <div className="empty-state"><div className="empty-state-text">Memuat data...</div></div>

  const statusColors = { active: 'var(--success)', inactive: 'var(--text-muted)', suspended: 'var(--accent-yellow)', terminated: 'var(--danger)' }

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>Selamat Datang, {session?.user?.name}</h2>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Status Akun</div>
          <div className="stat-value" style={{ color: statusColors[customer?.status] || 'inherit', textTransform: 'uppercase', fontSize: 20 }}>{customer?.status || '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paket Internet</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{customer?.package?.name || '-'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rp {Number(customer?.package?.price || 0).toLocaleString('id-ID')}/bln</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tagihan Belum Dibayar</div>
          <div className="stat-value">{stats.unpaid}</div>
          <div style={{ fontSize: 12, color: 'var(--accent-red)' }}>Rp {Number(stats.totalDue).toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tagihan</div>
          <div className="stat-value">{stats.totalInvoices}</div>
          <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>{stats.paid} sudah dibayar</div>
        </div>
      </div>

      {customer && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Informasi Akun</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Nama</label><span style={{ color: 'var(--text-primary)' }}>{customer.name}</span></div>
              <div><label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>PPPoE Username</label><span style={{ color: 'var(--text-primary)' }}>{customer.pppoeUsername}</span></div>
              <div><label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Phone</label><span style={{ color: 'var(--text-primary)' }}>{customer.phone || '-'}</span></div>
              <div><label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Email</label><span style={{ color: 'var(--text-primary)' }}>{customer.email || '-'}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Tagihan Terbaru</h3>
          <Link href="/portal/invoices" className="btn-action btn-edit" style={{ textDecoration: 'none' }}>Lihat Semua</Link>
        </div>
        <div className="card-body">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Periode</th><th>Jumlah</th><th>Status</th><th>Jatuh Tempo</th></tr></thead>
              <tbody>
                {(customer?.invoices || []).slice(0, 5).map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.periodStart || '-'} s/d {inv.periodEnd || '-'}</td>
                    <td>Rp {Number(inv.amount).toLocaleString('id-ID')}</td>
                    <td><span className={`badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'unpaid' ? 'warning' : 'error'}`}>{inv.status}</span></td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))}
                {(!customer?.invoices || customer.invoices.length === 0) && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Belum ada tagihan</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
