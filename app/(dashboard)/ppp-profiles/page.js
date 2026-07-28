'use client'

import { useState, useEffect } from 'react'

export default function PppProfilesPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editProfile, setEditProfile] = useState(null)
  const [form, setForm] = useState({ name: '', localAddress: '', remoteAddress: '', rateLimit: '', dns: '', comment: '' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ppp-profiles')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setProfiles(json.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditProfile(null)
    setForm({ name: '', localAddress: '', remoteAddress: '', rateLimit: '', dns: '', comment: '' })
    setShowModal(true)
  }

  function openEdit(p) {
    setEditProfile(p)
    setForm({
      name: p.name || '',
      localAddress: p['local-address'] || '',
      remoteAddress: p['remote-address'] || '',
      rateLimit: p['rate-limit'] || '',
      dns: p['dns-server'] || '',
      comment: p.comment || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const url = '/api/ppp-profiles'
      const method = editProfile ? 'PUT' : 'POST'
      const body = editProfile ? { id: editProfile['.id'], ...form } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus profile ini?')) return
    try {
      const res = await fetch(`/api/ppp-profiles?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      load()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-clipboard-list"></i> PPPoE Profiles</h3>
        <button className="btn-action btn-add" onClick={openAdd}><i className="fas fa-plus"></i> Tambah Profile</button>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Local Address</th><th>Remote Address</th><th>Rate Limit</th><th>DNS</th><th>Comment</th><th>Actions</th></tr></thead>
            <tbody>
              {error ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text" style={{ color: 'var(--danger)' }}>Error: {error}</div></div></td></tr>
              : loading ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              : profiles.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Belum ada profile</div></div></td></tr>
              : profiles.map(p => (
                <tr key={p['.id']}>
                  <td><strong>{p.name || '-'}</strong></td>
                  <td>{p['local-address'] || '-'}</td>
                  <td>{p['remote-address'] || '-'}</td>
                  <td>{p['rate-limit'] || '-'}</td>
                  <td>{p['dns-server'] || '-'}</td>
                  <td>{p.comment || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(p['.id'])}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="crud-modal show" onClick={e => e.target.classList.contains('crud-modal') && setShowModal(false)}>
          <div className="crud-modal-content">
            <div className="crud-modal-header"><h3>{editProfile ? 'Edit Profile' : 'Tambah Profile'}</h3><button className="crud-modal-close" onClick={() => setShowModal(false)}><i className="fas fa-xmark"></i></button></div>
            <form className="crud-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Local Address</label><input value={form.localAddress} onChange={e => setForm({...form, localAddress: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Remote Address</label><input value={form.remoteAddress} onChange={e => setForm({...form, remoteAddress: e.target.value})} /></div>
                <div className="form-group"><label>Rate Limit</label><input value={form.rateLimit} onChange={e => setForm({...form, rateLimit: e.target.value})} placeholder="1M/2M" /></div>
              </div>
              <div className="form-group"><label>DNS Server</label><input value={form.dns} onChange={e => setForm({...form, dns: e.target.value})} /></div>
              <div className="form-group"><label>Comment</label><input value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} /></div>
              <div className="form-actions"><button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-submit">{editProfile ? 'Update' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
