'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPost, apiPut, apiDelete } from '@/lib/client-api.mjs'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

const PAGE_SIZE = 25
const periodLabels = { weekly: 'Mingguan', monthly: 'Bulanan', quarterly: 'Triwulan', yearly: 'Tahunan' }

export default function PackagesPage() {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', speed: '', profile_name: '', description: '', billing_period: 'monthly' })
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState([])

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/packages?page=${p || page}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data.data)
        setTotal(json.data.total)
        setPage(json.data.currentPage)
      }
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { load(1) }, [])

  useEffect(() => {
    apiFetch('/api/ppp-profiles')
      .then(p => setProfiles(p || []))
      .catch(() => setProfiles([]))
  }, [])

  const lastPage = Math.ceil(total / PAGE_SIZE)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (modal?.id) {
        await apiPut(`/api/packages/${modal.id}`, form)
      } else {
        await apiPost('/api/packages', form)
      }
      setModal(null)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus paket ini?')) return
    await apiDelete(`/api/packages/${id}`)
    load()
  }

  function openEdit(pkg) {
    setForm({ name: pkg.name, price: String(pkg.price), speed: pkg.speed || '', profile_name: pkg.profileName || '', description: pkg.description || '', billing_period: pkg.billingPeriod || 'monthly' })
    setModal({ id: pkg.id, title: 'Edit Paket' })
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-credit-card"></i> Packages</h3>
        <button className="btn-action btn-add" onClick={() => { setForm({ name: '', price: '', speed: '', profile_name: '', description: '', billing_period: 'monthly' }); setModal({ id: null, title: 'Tambah Paket' }) }}>
          <i className="fas fa-plus"></i> Tambah Paket
        </button>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Speed</th>
                <th>Profile</th>
                <th>Period</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Belum ada paket</div></div></td></tr>
              ) : data.map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.id}</td>
                  <td><strong>{pkg.name}</strong></td>
                  <td>Rp {Number(pkg.price).toLocaleString('id-ID')}</td>
                  <td>{pkg.speed || '-'}</td>
                  <td>{pkg.profileName || '-'}</td>
                  <td>{periodLabels[pkg.billingPeriod] || pkg.billingPeriod || '-'}</td>
                  <td>{pkg.description || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(pkg)}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(pkg.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && (
          <div className="pagination-bar">
            <span className="pagination-info">{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE, total)} dari {total}</span>
            <div className="pagination-actions">
              <button className="page-btn" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
              <span style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{page} / {lastPage}</span>
              <button className="page-btn" disabled={page >= lastPage} onClick={() => load(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <CrudModal open={!!modal} title={modal?.title} onClose={() => setModal(null)} onSubmit={handleSubmit}>
        <FormGroup label="Nama Paket">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </FormGroup>
        <FormRow>
          <FormGroup label="Harga">
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          </FormGroup>
          <FormGroup label="Speed">
            <input type="text" value={form.speed} onChange={e => setForm({...form, speed: e.target.value})} placeholder="50Mbps" />
          </FormGroup>
        </FormRow>
        <FormGroup label="PPP Profile (MikroTik)">
          <select value={form.profile_name} onChange={e => setForm({...form, profile_name: e.target.value})}>
            <option value="">— Pilih Profile —</option>
            {profiles.map(p => (
              <option key={p.name} value={p.name}>{p.name} {p['rate-limit'] ? `(${p['rate-limit']})` : ''}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Billing Period">
          <select value={form.billing_period} onChange={e => setForm({...form, billing_period: e.target.value})}>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Triwulan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </FormGroup>
        <FormGroup label="Deskripsi">
          <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </FormGroup>
      </CrudModal>
    </div>
  )
}
