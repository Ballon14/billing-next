'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiPost, apiPut, apiDelete } from '@/lib/client-api.mjs'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'
import { showToast } from '../layout'

const PAGE_SIZE = 25

export default function UsersPage() {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [modal, setModal] = useState(null)
  const [resetModal, setResetModal] = useState(null)
  
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN', customer_id: '' })
  const [resetForm, setResetForm] = useState({ password: '' })
  
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p || page) })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      
      const res = await fetch(`/api/users?${params}`)
      const json = await res.json()
      
      if (!json.success) throw new Error(json.error || 'Gagal memuat data')
      
      setData(json.data.data)
      setTotal(json.data.total)
      setPage(json.data.currentPage)
    } catch (err) {
      setError(err.message)
    } finally { 
      setLoading(false) 
    }
  }, [page, search, roleFilter])

  useEffect(() => { load(1) }, [search, roleFilter])
  useEffect(() => { load(1) }, [])

  const lastPage = Math.ceil(total / PAGE_SIZE)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (modal?.id) {
        await apiPut(`/api/users/${modal.id}`, form)
        showToast('User berhasil diperbarui', 'success')
      } else {
        await apiPost('/api/users', form)
        showToast('User berhasil dibuat', 'success')
      }
      setModal(null)
      load()
    } catch (err) { 
      showToast(err.message, 'error') 
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    try {
      await apiPost(`/api/users/${resetModal.id}/reset-password`, resetForm)
      showToast('Password berhasil direset', 'success')
      setResetModal(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus user ini?')) return
    try {
      await apiDelete(`/api/users/${id}`)
      showToast('User berhasil dihapus', 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function openEdit(id) {
    try {
      const res = await fetch('/api/users?all=true')
      const json = await res.json()
      const u = json.data.find(x => x.id === id)
      
      if (u) {
        await loadCustomers()
        setForm({ 
          name: u.name, 
          email: u.email, 
          password: '', // Kosongkan password saat edit
          role: u.role, 
          customer_id: u.customerId ? String(u.customerId) : '' 
        })
        setModal({ id, title: 'Edit User' })
      }
    } catch (err) {
      showToast('Gagal memuat data user', 'error')
    }
  }

  async function openResetPassword(id, name) {
    setResetForm({ password: '' })
    setResetModal({ id, title: `Reset Password: ${name}` })
  }

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers?all=true')
      const json = await res.json()
      if (json.success) setCustomers(json.data || [])
    } catch {
      setCustomers([])
    }
  }

  async function openAdd() {
    await loadCustomers()
    setForm({ name: '', email: '', password: '', role: 'ADMIN', customer_id: '' })
    setModal({ id: null, title: 'Tambah User' })
  }

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'danger'
      case 'ADMIN': return 'info' // Blue-ish
      case 'TECHNICIAN': return 'warning'
      case 'CUSTOMER': return 'success'
      default: return 'primary'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-user-shield"></i> User Management</h3>
        <div className="card-header-actions">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cari nama atau email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Semua Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="CUSTOMER">Customer</option>
          </select>
          <button className="btn-action btn-add" onClick={() => openAdd()}>
            <i className="fas fa-plus"></i> Tambah User
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Pelanggan Terhubung</th>
                <th>Tanggal Dibuat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text" style={{ color: 'var(--danger)' }}>Error: {error}</div></div></td></tr>
              ) : loading ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">{search || roleFilter ? 'Tidak ada hasil pencarian' : 'Belum ada user'}</div></div></td></tr>
              ) : data.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`status-badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span></td>
                  <td>
                    {u.customer ? (
                      <Link href={`/customers/${u.customer.id}`} style={{color: 'var(--accent-cyan)', textDecoration: 'none'}}>
                        {u.customer.name}
                      </Link>
                    ) : '-'}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(u.id)} title="Edit User">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-edit" style={{ marginLeft: 4, backgroundColor: 'var(--accent-orange)' }} onClick={() => openResetPassword(u.id, u.name)} title="Reset Password">
                      <i className="fas fa-key"></i>
                    </button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(u.id)} title="Hapus User">
                      <i className="fas fa-trash"></i>
                    </button>
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

      {/* Modal CRUD User */}
      <CrudModal open={!!modal} title={modal?.title} wide onClose={() => setModal(null)} onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup label="Nama">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </FormGroup>
          <FormGroup label="Email">
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label={modal?.id ? "Password (kosongkan jika tidak diubah)" : "Password"}>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              required={!modal?.id}
              minLength={modal?.id ? 0 : 6}
            />
          </FormGroup>
          <FormGroup label="Role">
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </FormGroup>
        </FormRow>
        {form.role === 'CUSTOMER' && (
          <FormGroup label="Hubungkan ke Pelanggan">
            <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
              <option value="">— Pilih Pelanggan —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.pppoeUsername})</option>)}
            </select>
            <small style={{display: 'block', marginTop: 4, color: 'var(--text-muted)'}}>
              Pilih pelanggan yang akan dihubungkan dengan akun login ini.
            </small>
          </FormGroup>
        )}
      </CrudModal>

      {/* Modal Reset Password */}
      <CrudModal 
        open={!!resetModal} 
        title={resetModal?.title} 
        onClose={() => setResetModal(null)} 
        onSubmit={handleResetSubmit}
        submitLabel="Reset Password"
      >
        <FormGroup label="Password Baru">
          <input 
            type="password" 
            value={resetForm.password} 
            onChange={e => setResetForm({...resetForm, password: e.target.value})} 
            required 
            minLength={6}
          />
        </FormGroup>
      </CrudModal>
    </div>
  )
}
