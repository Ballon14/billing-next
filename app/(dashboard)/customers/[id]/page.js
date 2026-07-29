'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [packages, setPackages] = useState([])

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers/${id}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setCustomer(json.data)
      setForm({
        name: json.data.name,
        nik: json.data.nik || '',
        phone: json.data.phone || '',
        email: json.data.email || '',
        address: json.data.address || '',
        pppoe_username: json.data.pppoeUsername,
        pppoe_password: json.data.pppoePassword,
        package_id: json.data.packageId,
        status: json.data.status,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadPackages() {
    const res = await fetch('/api/packages?all=true')
    const json = await res.json()
    if (json.success) setPackages(json.data)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setEditing(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete() {
    if (!confirm(`Yakin hapus pelanggan ${customer.name}?`)) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/customers')
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-state-text">Loading...</div></div></div></div>
  if (error) return <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-state-text" style={{ color: 'var(--danger)' }}>Error: {error}</div></div></div></div>
  if (!customer) return null

  const statusColors = { active: 'var(--success)', inactive: 'var(--text-muted)', suspended: 'var(--warning)', terminated: 'var(--danger)', isolated: 'var(--danger)' }

  return (
    <div className="customer-detail">
      <div className="card">
        <div className="card-header">
          <h3><i className="fas fa-user"></i> {customer.name}</h3>
          <div className="card-header-actions">
            <button className="btn-action btn-edit" onClick={() => { loadPackages(); setEditing(true) }}><i className="fas fa-pen-to-square"></i> Edit</button>
            <button className="btn-action btn-delete" onClick={handleDelete}><i className="fas fa-trash"></i> Hapus</button>
          </div>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-field"><label>Status</label><span style={{ color: statusColors[customer.status] || 'inherit', fontWeight: 600, textTransform: 'uppercase' }}>{customer.status}</span></div>
            <div className="detail-field"><label>Package</label><span>{customer.package?.name || '-'} (Rp {Number(customer.package?.price || 0).toLocaleString('id-ID')})</span></div>
            <div className="detail-field"><label>PPPoE Username</label><span>{customer.pppoeUsername}</span></div>
            <div className="detail-field"><label>NIK</label><span>{customer.nik || '-'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{customer.phone || '-'}</span></div>
            <div className="detail-field"><label>Email</label><span>{customer.email || '-'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Address</label><span>{customer.address || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3><i className="fas fa-plug"></i> PPPoE Accounts</h3></div>
        <div className="card-body">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Username</th><th>Router</th><th>IP Address</th><th>Profile</th><th>Status</th></tr></thead>
              <tbody>
                {customer.pppoeAccounts?.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Tidak ada akun PPPoE</div></div></td></tr>
                : customer.pppoeAccounts.map(acc => (
                  <tr key={acc.id}>
                    <td>{acc.username}</td>
                    <td>{acc.router?.name || '-'}</td>
                    <td>{acc.ipAddress || '-'}</td>
                    <td>{acc.profile || '-'}</td>
                    <td><span className={`badge badge-${acc.disabled ? 'error' : 'success'}`}>{acc.disabled ? 'Disabled' : 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3><i className="fas fa-file-invoice"></i> Invoices</h3></div>
        <div className="card-body">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Period</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Payments</th></tr></thead>
              <tbody>
                {customer.invoices?.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Belum ada tagihan</div></div></td></tr>
                : customer.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.periodStart || '-'} s/d {inv.periodEnd || '-'}</td>
                    <td>Rp {Number(inv.amount).toLocaleString('id-ID')}</td>
                    <td><span className={`badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'unpaid' ? 'warning' : 'error'}`}>{inv.status}</span></td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                    <td>Rp {inv.payments?.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID') || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CrudModal open={editing} title={<><i className="fas fa-pen-to-square"></i> Edit Customer</>} onClose={() => setEditing(false)} onSubmit={handleSave}>
        <FormGroup label="Name">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </FormGroup>
        <FormRow>
          <FormGroup label="NIK">
            <input value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} />
          </FormGroup>
          <FormGroup label="Phone">
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Email">
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </FormGroup>
        <FormGroup label="Address">
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        </FormGroup>
        <FormRow>
          <FormGroup label="PPPoE Username">
            <input value={form.pppoe_username} onChange={e => setForm({...form, pppoe_username: e.target.value})} required />
          </FormGroup>
          <FormGroup label="PPPoE Password">
            <input value={form.pppoe_password} onChange={e => setForm({...form, pppoe_password: e.target.value})} required />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Package">
            <select value={form.package_id} onChange={e => setForm({...form, package_id: e.target.value})} required>
              <option value="">— Pilih —</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} - Rp {Number(p.price).toLocaleString('id-ID')}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Status">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </FormGroup>
        </FormRow>
      </CrudModal>

      <style jsx>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .detail-field label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-field span { font-size: 14px; color: var(--text-primary); }
        .customer-detail { display: flex; flex-direction: column; gap: 20px; }
        @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
