'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/client-api.mjs'

export default function PppoeAccountsPage() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', password: '', service: 'pppoe', profile: 'default', 'remote-address': '', comment: '', disabled: 'no' })
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const secrets = await apiFetch('/api/ppp-secrets')
      setData(secrets || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function loadProfiles() {
    try {
      const res = await apiFetch('/api/ppp-profiles')
      setProfiles(res || [])
    } catch { setProfiles([]) }
  }

  const filtered = data.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (s.name || '').toLowerCase().includes(q) ||
            (s.profile || '').toLowerCase().includes(q) ||
            (s.remoteAddress || '').toLowerCase().includes(q) ||
            (s.comment || '').toLowerCase().includes(q)
  })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (modal?.mikrotikId) {
        await fetch(`/api/ppp-secrets/${encodeURIComponent(modal.mikrotikId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.error) })
      } else {
        await fetch('/api/ppp-secrets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.error) })
      }
      setModal(null)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(secret) {
    if (!confirm(`Hapus PPP secret "${secret.name}"?`)) return
    try {
      const id = secret['.id'] || secret.id
      await fetch(`/api/ppp-secrets/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .then(r => r.json()).then(j => { if (!j.success) throw new Error(j.error) })
      load()
    } catch (err) { alert(err.message) }
  }

  const totalOnline = data.filter(s => s.Online).length

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fas fa-plug"></i> PPPoE Accounts <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({data.length} total, {totalOnline} online)</span></h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Cari username, profile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid rgba(56,189,248,0.15)', background: 'rgba(15,23,42,0.6)', color: 'var(--text-primary)', width: 200 }}
          />
          <button className="btn-action btn-add" onClick={async () => {
            await loadProfiles()
            setForm({ name: '', password: '', service: 'pppoe', profile: 'default', 'remote-address': '', comment: '', disabled: 'no' })
            setModal({ mikrotikId: null, title: 'Tambah PPP Secret' })
          }}><i className="fas fa-plus"></i> Tambah</button>
        </div>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Password</th>
                <th>Service</th>
                <th>Profile</th>
                <th>Remote Address</th>
                <th>Status</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Loading dari MikroTik...</div></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{search ? 'Tidak ditemukan' : 'Belum ada PPP Secret'}</div></div></td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s['.id'] || s.id || i}>
                  <td><strong>{s.name}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.password || '••••'}</td>
                  <td>{s.service || 'pppoe'}</td>
                  <td>{s.profile || '-'}</td>
                  <td>{s.remoteAddress || '-'}</td>
                  <td>
                    {s.Online ? (
                      <span className="status-badge success">Online</span>
                    ) : s.disabled === 'yes' || s.disabled === true ? (
                      <span className="status-badge danger">Disabled</span>
                    ) : (
                      <span className="status-badge warning">Offline</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.comment || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={async () => {
                      await loadProfiles()
                      setForm({
                        name: s.name || '',
                        password: '',
                        service: s.service || 'pppoe',
                        profile: s.profile || 'default',
                        'remote-address': s.remoteAddress || s['remote-address'] || '',
                        comment: s.comment || '',
                        disabled: (s.disabled === 'yes' || s.disabled === true) ? 'yes' : 'no',
                      })
                      setModal({ mikrotikId: s['.id'] || s.id, title: 'Edit PPP Secret' })
                    }}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(s)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="crud-modal show" onClick={e => e.target.classList.contains('crud-modal') && setModal(null)}>
          <div className="crud-modal-content crud-modal-wide">
            <div className="crud-modal-header"><h3>{modal.title}</h3><button className="crud-modal-close" onClick={() => setModal(null)}><i className="fas fa-xmark"></i></button></div>
            <form className="crud-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Name (Username)</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Password</label><input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={modal.mikrotikId ? '(kosongkan jika tidak diubah)' : ''} required={!modal.mikrotikId} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Service</label>
                  <select value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                    <option value="pppoe">PPPoE</option><option value="pptp">PPTP</option><option value="l2tp">L2TP</option><option value="ovpn">OpenVPN</option><option value="any">Any</option>
                  </select>
                </div>
                <div className="form-group"><label>Profile</label>
                  <select value={form.profile} onChange={e => setForm({...form, profile: e.target.value})}>
                    <option value="default">default</option>
                    {profiles.filter(p => p.name !== 'default').map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Remote Address</label><input type="text" value={form['remote-address']} onChange={e => setForm({...form, 'remote-address': e.target.value})} placeholder="Kosongkan untuk auto" /></div>
                <div className="form-group"><label>Status</label>
                  <select value={form.disabled} onChange={e => setForm({...form, disabled: e.target.value})}>
                    <option value="no">Enabled</option><option value="yes">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Comment</label><input type="text" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} /></div>
              <div className="form-actions"><button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="btn-submit">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
