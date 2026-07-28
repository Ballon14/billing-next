'use client'

import { useState, useEffect } from 'react'

export default function QueuesPage() {
  const [queues, setQueues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editQueue, setEditQueue] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', download: '', upload: '', priority: '', queue: '', comment: '', disabled: 'no' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/queues')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setQueues(json.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditQueue(null)
    setForm({ name: '', target: '', download: '', upload: '', priority: '', queue: '', comment: '', disabled: 'no' })
    setShowModal(true)
  }

  function openEdit(q) {
    setEditQueue(q)
    const ml = q['max-limit'] || ''
    const parts = ml.split('/')
    setForm({
      name: q.name || '',
      target: q.target || '',
      download: parts[0] || '',
      upload: parts[1] || '',
      priority: q.priority || '',
      queue: q.queue || '',
      comment: q.comment || '',
      disabled: q.disabled === 'true' || q.disabled === 'yes' ? 'yes' : 'no',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editQueue) {
        await fetch('/api/queues', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editQueue['.id'], ...form }),
        })
      } else {
        await fetch('/api/queues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus queue ini?')) return
    try {
      await fetch(`/api/queues?id=${id}`, { method: 'DELETE' })
      load()
    } catch (err) { alert(err.message) }
  }

  function formatSpeed(val) {
    if (!val) return '-'
    const num = parseFloat(val)
    if (num >= 1000000) return (num / 1000000).toFixed(0) + ' Mbps'
    if (num >= 1000) return (num / 1000).toFixed(0) + ' Kbps'
    return val
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>📶 Bandwidth Queues</h3>
        <button className="btn-action btn-add" onClick={openAdd}>➕ Tambah Queue</button>
      </div>
      <div className="card-body">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Target</th><th>Max Limit (DL/UL)</th><th>Priority</th><th>Comment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {error ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text" style={{ color: 'var(--danger)' }}>Error: {error}</div></div></td></tr>
              : loading ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Loading...</div></div></td></tr>
              : queues.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Belum ada queue</div></div></td></tr>
              : queues.map(q => (
                <tr key={q['.id']}>
                  <td><strong>{q.name || '-'}</strong></td>
                  <td>{q.target || '-'}</td>
                  <td>{formatSpeed(q['max-limit']?.split('/')[0])} / {formatSpeed(q['max-limit']?.split('/')[1])}</td>
                  <td>{q.priority || '-'}</td>
                  <td>{q.comment || '-'}</td>
                  <td><span className={`badge badge-${q.disabled === 'true' || q.disabled === 'yes' ? 'error' : 'success'}`}>{q.disabled === 'true' || q.disabled === 'yes' ? 'Disabled' : 'Active'}</span></td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(q)}>Edit</button>
                    <button className="btn-delete" style={{ marginLeft: 4 }} onClick={() => handleDelete(q['.id'])}>Hapus</button>
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
            <div className="crud-modal-header"><h3>{editQueue ? 'Edit Queue' : 'Tambah Queue'}</h3><button className="crud-modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form className="crud-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Target (IP)</label><input value={form.target} onChange={e => setForm({...form, target: e.target.value})} placeholder="10.10.10.0/24" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Download (bps)</label><input value={form.download} onChange={e => setForm({...form, download: e.target.value})} placeholder="10M" /></div>
                <div className="form-group"><label>Upload (bps)</label><input value={form.upload} onChange={e => setForm({...form, upload: e.target.value})} placeholder="10M" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Priority</label><input value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} placeholder="1-8" /></div>
                <div className="form-group"><label>Queue Type</label><input value={form.queue} onChange={e => setForm({...form, queue: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Comment</label><input value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} /></div>
              <div className="form-group"><label><input type="checkbox" checked={form.disabled === 'yes'} onChange={e => setForm({...form, disabled: e.target.checked ? 'yes' : 'no'})} /> Disabled</label></div>
              <div className="form-actions"><button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-submit">{editQueue ? 'Update' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
