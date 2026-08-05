'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PortalLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved !== 'light'
    setDarkMode(isDark)
    document.documentElement.classList.toggle('light-theme', !isDark)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('light-theme', !darkMode)
  }, [darkMode])

  if (status === 'loading') return null
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }
  
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
    router.push('/')
    return null
  }

  const navItems = [
    { href: '/portal', label: 'Dashboard', icon: 'fa-home' },
    { href: '/portal/invoices', label: 'Tagihan Saya', icon: 'fa-file-invoice' },
    { href: '/portal/payments', label: 'Pembayaran', icon: 'fa-wallet' },
    { href: '/portal/settings', label: 'Pengaturan Akun', icon: 'fa-cog' },
  ]

  return (
    <div className="portal-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <header className="glass-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 32px',
        margin: '16px 24px 0',
        borderRadius: '100px',
        position: 'sticky',
        top: '16px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, height: 40, 
            borderRadius: '50%', 
            background: 'var(--gradient-cyan)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <i className="fas fa-satellite-dish" style={{ fontSize: 20, color: '#fff' }}></i>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--gradient-cyan)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Customer Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)} style={{
            background: 'var(--bg-input)', border: '1px solid var(--border-color)', 
            width: 36, height: 36, borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition-fast)'
          }}>
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid var(--border-color)', paddingLeft: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{session?.user?.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{session?.user?.email}</span>
            </div>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%', 
              background: 'var(--bg-input)', border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <i className="fas fa-user"></i>
            </div>
            <button onClick={() => signOut()} style={{
              background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer',
              marginLeft: 8, padding: 8, borderRadius: '50%', transition: 'var(--transition-fast)'
            }} title="Logout">
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, padding: '24px', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <aside style={{ width: 260, flexShrink: 0 }}>
          <nav className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'sticky', top: 96 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 12, fontWeight: 600 }}>Menu Utama</div>
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 'var(--radius-md)', 
                  color: active ? '#fff' : 'var(--text-secondary)',
                  textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 500,
                  background: active ? 'var(--gradient-cyan)' : 'transparent',
                  boxShadow: active ? 'var(--glow-cyan)' : 'none',
                  transition: 'var(--transition-normal)',
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background = 'var(--bg-input)' }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: 20, textAlign: 'center', color: active ? '#fff' : 'var(--accent-cyan)' }}></i>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
