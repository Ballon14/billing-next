'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { apiPost, apiPut, apiDelete } from '@/lib/client-api.mjs'

const PAGE_SIZE = 25

export default function CustomersPage() {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', nik: '', phone: '', email: '', address: '', pppoe_username: '', pppoe_password: '', package_id: '', status: 'inactive' })
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)
  const searchTimeout = useRef(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p || page) })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Gagal memuat data')
      setData(json.data.data)
      setTotal(json.data.total)
      setPage(json.data.currentPage)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { load(1) }, [search, statusFilter])

  useEffect(() => { load(1) }, [])

  const lastPage = Math.ceil(total / PAGE_SIZE)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (modal?.id) {
        await apiPut(`/api/customers/${modal.id}`, form)
      } else {
        await apiPost('/api/customers', form)
      }
      setModal(null)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus pelanggan ini?')) return
    await apiDelete(`/api/customers/${id}`)
    load()
  }

  async function openEdit(id) {
    const res = await fetch('/api/customers?all=true')
    const json = await res.json()
    const c = json.data.find(x => x.id === id)
    if (c) {
      await loadPackages()
      setForm({ name: c.name, nik: c.nik || '', phone: c.phone || '', email: c.email || '', address: c.address || '', pppoe_username: c.pppoeUsername, pppoe_password: c.pppoePassword, package_id: String(c.packageId), status: c.status })
      setModal({ id, title: 'Edit Pelanggan' })
    }
  }

  async function loadPackages() {
    const res = await fetch('/api/packages?all=true')
    const json = await res.json()
    if (json.success) setPackages(json.data)
  }

  function openAdd() {
    loadPackages()
    setForm({ name: '', nik: '', phone: '', email: '', address: '', pppoe_username: '', pppoe_password: '', package_id: '', status: 'inactive' })
    setModal({ id: null, title: 'Tambah Pelanggan' })
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>👥 Customers</h3>
        <div className="card-header-actions">
          <input type="text" className="search-input" placeholder="Cari nama, PPPoE, phone..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
            <option value="isolated">Isolated</option>
          </select>
          <button className="btn-action btn-add" onClick={() => openAdd()}>➕ Tambah Pelanggan</button>
        </div>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>PPPoE</th><th>Paket</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text" style={{ color: 'var(--danger)' }}>Error: {error}</div></div></td></tr>
              ) : loading ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{search || statusFilter ? 'Tidak ada hasil pencarian' : 'Belum ada pelanggan'}</div></div></td></tr>
              ) : data.map(c => (
                <tr key={c.id}>
                  <td><Link href={`/customers/${c.id}`} className="customer-link"><strong>{c.name}</strong></Link></td>
                  <td>{c.pppoeUsername}</td>
                  <td>{c.package?.name || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td><span className={`status-badge ${c.status === 'active' ? 'success' : c.status === 'isolated' ? 'danger' : 'warning'}`}>{c.status}</span></td>
                  <td>
                    <Link href={`/customers/${c.id}`} className="btn-edit" style={{ textDecoration: 'none', display: 'inline-block' }}>Detail</Link>
                    <button className="btn-edit" onClick={() => openEdit(c.id)}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(c.id)}>Hapus</button>
                  </td>
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

      {modal && (
        <div className="crud-modal show" onClick={e => e.target.classList.contains('crud-modal') && setModal(null)}>
          <div className="crud-modal-content crud-modal-wide">
            <div className="crud-modal-header">
              <h3>{modal.title}</h3>
              <button className="crud-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form className="crud-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nama</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>NIK</label>
                  <input type="text" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>PPPoE Username</label>
                  <input type="text" value={form.pppoe_username} onChange={e => setForm({...form, pppoe_username: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>PPPoE Password</label>
                  <input type="text" value={form.pppoe_password} onChange={e => setForm({...form, pppoe_password: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Paket</label>
                  <select value={form.package_id} onChange={e => setForm({...form, package_id: e.target.value})} required>
                    <option value="">— Pilih Paket —</option>
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name} (Rp {Number(p.price).toLocaleString('id-ID')})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="isolated">Isolated</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-submit">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
