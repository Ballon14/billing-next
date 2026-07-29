'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiPost, apiPut, apiDelete } from '@/lib/client-api.mjs'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

const PAGE_SIZE = 25

export default function RoutersPage() {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', host: '', port: '8728', username: '', password: '', is_active: true })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/routers?page=${p || page}`)
      const json = await res.json()
      if (json.success) { setData(json.data.data); setTotal(json.data.total); setPage(json.data.currentPage) }
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { load(1) }, [])

  const lastPage = Math.ceil(total / PAGE_SIZE)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (modal?.id) await apiPut(`/api/routers/${modal.id}`, form)
      else await apiPost('/api/routers', form)
      setModal(null); load()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-globe"></i> Routers</h3>
        <button className="btn-action btn-add" onClick={() => { setForm({ name: '', host: '', port: '8728', username: '', password: '', is_active: true }); setModal({ id: null, title: 'Tambah Router' }) }}><i className="fas fa-plus"></i> Tambah Router</button>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Host</th><th>Port</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              : data.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">Belum ada router</div></div></td></tr>
              : data.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.host}</td>
                  <td>{r.port}</td>
                  <td><span className={`status-badge ${r.isActive ? 'success' : 'warning'}`}>{r.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <button className="btn-edit" onClick={() => { setForm({ name: r.name, host: r.host, port: String(r.port), username: r.username, password: '', is_active: r.isActive }); setModal({ id: r.id, title: 'Edit Router' }) }}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={async () => { if (confirm('Hapus router?')) { await apiDelete(`/api/routers/${r.id}`); load() } }}>Hapus</button>
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

      <CrudModal open={!!modal} title={modal?.title} onClose={() => setModal(null)} onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup label="Name">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </FormGroup>
          <FormGroup label="Host">
            <input type="text" value={form.host} onChange={e => setForm({...form, host: e.target.value})} required />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Port">
            <input type="number" value={form.port} onChange={e => setForm({...form, port: e.target.value})} />
          </FormGroup>
          <FormGroup label="Username">
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          </FormGroup>
        </FormRow>
        <FormGroup label="Password">
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={modal?.id ? '(kosongkan jika tidak diubah)' : ''} required={!modal?.id} />
        </FormGroup>
        <FormGroup label="">
          <label><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Active</label>
        </FormGroup>
      </CrudModal>
    </div>
  )
}
