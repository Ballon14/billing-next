'use client'

import { useSession } from 'next-auth/react'
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
  if (status === 'unauthenticated') { router.push('/login'); return null }

  const navItems = [
    { href: '/portal', label: 'Dashboard', icon: 'fa-home' },
    { href: '/portal/invoices', label: 'Tagihan Saya', icon: 'fa-file-invoice' },
    { href: '/portal/payments', label: 'Pembayaran', icon: 'fa-wallet' },
  ]

  return (
    <div className="portal-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-satellite" style={{ fontSize: 24 }}></i>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Customer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}><i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i></button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session?.user?.name}</span>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{ width: 200, padding: 16, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="portal-nav-item" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderRadius: 'var(--radius-sm)', color: pathname === item.href ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              textDecoration: 'none', fontSize: 13,
              background: pathname === item.href ? 'rgba(56,189,248,0.1)' : 'transparent',
            }}>
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}
