'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function PortalSettingsPage() {
  const { data: session } = useSession()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  
  // Is user logged in via PPPoE credentials directly?
  const isPppoeLogin = session?.user?.isUserTable === false

  useEffect(() => {
    if (session?.user?.email) {
      setForm(f => ({ ...f, username: session.user.email }))
    }
  }, [session])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (form.password && form.password !== form.confirmPassword) {
      return setError('Konfirmasi password tidak cocok')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password
        })
      })
      
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      
      setMessage(json.data.message || 'Pengaturan berhasil diperbarui')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--gradient-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--glow-cyan)' }}>
          <i className="fas fa-cog" style={{ fontSize: 20 }}></i>
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>Pengaturan Akun</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Perbarui kredensial masuk portal Anda.</div>
        </div>
      </div>

      <div className="glass-card delay-100 animate-fade-in" style={{ maxWidth: 600 }}>
        {isPppoeLogin && (
          <div style={{ padding: '16px 24px', background: 'rgba(251, 191, 36, 0.1)', borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', gap: 16 }}>
            <i className="fas fa-triangle-exclamation" style={{ color: 'var(--accent-yellow)', marginTop: 4 }}></i>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent-yellow)', fontSize: 14 }}>Perhatian</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                Anda login menggunakan akun koneksi PPPoE. Mengubah kredensial di bawah ini <strong>juga akan mengubah konfigurasi PPPoE di router rumah Anda</strong>. Anda mungkin perlu melakukan pengaturan ulang (re-dial) pada router/modem Anda jika password diubah.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{ padding: 12, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: 8, color: 'var(--accent-red)', fontSize: 14 }}>
              {error}
            </div>
          )}
          
          {message && (
            <div style={{ padding: 12, background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 8, color: 'var(--accent-green)', fontSize: 14 }}>
              {message}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Username / Email
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})} 
                required 
                minLength={3}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 44px', 
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontSize: 14, transition: 'var(--transition-fast)', outline: 'none'
                }} 
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password Baru (Kosongkan jika tidak ingin mengubah)
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                minLength={6}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 44px', 
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontSize: 14, transition: 'var(--transition-fast)', outline: 'none'
                }} 
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Konfirmasi Password Baru
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-check-circle" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="password" 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                required={!!form.password}
                minLength={6}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 44px', 
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontSize: 14, transition: 'var(--transition-fast)', outline: 'none'
                }} 
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--gradient-cyan)', color: '#fff', border: 'none', 
                padding: '14px 24px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--glow-cyan)',
                opacity: loading ? 0.7 : 1,
                transition: 'var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
