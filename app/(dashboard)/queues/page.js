'use client'

import { useState, useEffect } from 'react'
import CrudModal from '@/components/CrudModal'
import FormGroup from '@/components/FormGroup'
import FormRow from '@/components/FormRow'

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
        <h3><i className="fas fa-wifi"></i> Bandwidth Queues</h3>
        <button className="btn-action btn-add" onClick={openAdd}><i className="fas fa-plus"></i> Tambah Queue</button>
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

      <CrudModal open={showModal} title={editQueue ? 'Edit Queue' : 'Tambah Queue'} onClose={() => setShowModal(false)} onSubmit={handleSubmit} submitLabel={editQueue ? 'Update' : 'Simpan'}>
        <FormRow>
          <FormGroup label="Name">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </FormGroup>
          <FormGroup label="Target (IP)">
            <input value={form.target} onChange={e => setForm({...form, target: e.target.value})} placeholder="10.10.10.0/24" required />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Download (bps)">
            <input value={form.download} onChange={e => setForm({...form, download: e.target.value})} placeholder="10M" />
          </FormGroup>
          <FormGroup label="Upload (bps)">
            <input value={form.upload} onChange={e => setForm({...form, upload: e.target.value})} placeholder="10M" />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Priority">
            <input value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} placeholder="1-8" />
          </FormGroup>
          <FormGroup label="Queue Type">
            <input value={form.queue} onChange={e => setForm({...form, queue: e.target.value})} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Comment">
          <input value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
        </FormGroup>
        <FormGroup label="">
          <label><input type="checkbox" checked={form.disabled === 'yes'} onChange={e => setForm({...form, disabled: e.target.checked ? 'yes' : 'no'})} /> Disabled</label>
        </FormGroup>
      </CrudModal>
    </div>
  )
}
