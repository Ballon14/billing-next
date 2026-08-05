'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// Toast
let toastTimeout
function showToast(message, type = 'error') {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.className = `toast ${type} show`
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000)
}

export { showToast }

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [routerName, setRouterName] = useState('MikroTik')
  const [connected, setConnected] = useState(false)
  const [activeCounts, setActiveCounts] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState('-')
  const [daemonHealthy, setDaemonHealthy] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const userRole = session?.user?.role || ''

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    async function init() {
      try {
        const [identityRes, daemonRes, billingRes] = await Promise.all([
          fetch('/api/identity').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/daemon-status').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/billing/dashboard').then(r => r.json()).catch(() => ({ success: false })),
        ])

        if (identityRes.success && identityRes.data?.name) {
          setRouterName(identityRes.data.name)
          setConnected(true)
        }

        if (daemonRes.success) {
          setDaemonHealthy(daemonRes.data.healthy)
        }

        if (billingRes.success) {
          setActiveCounts(billingRes.data.activeCustomers ?? '-')
          setMonthlyRevenue('Rp' + Number(billingRes.data.monthlyRevenue || 0).toLocaleString('id-ID'))
        }
      } catch (e) {
        console.error('[Init]', e)
      }
    }
    init()
  }, [status])

  const isActive = useCallback((path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }, [pathname])

  if (status === 'loading') return null
  
  if (userRole === 'CUSTOMER') {
    router.push('/portal')
    return null
  }

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isTech = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'TECHNICIAN'

  const navItems = [
    { section: 'Billing System', items: [
      ...(isAdmin ? [{ href: '/', label: 'Billing Dashboard', icon: 'fa-chart-bar' }] : []),
      ...(isAdmin ? [{ href: '/packages', label: 'Packages', icon: 'fa-credit-card' }] : []),
      ...(isAdmin ? [{ href: '/customers', label: 'Customers', icon: 'fa-users' }] : []),
      ...(isAdmin ? [{ href: '/invoices', label: 'Invoices', icon: 'fa-file-invoice' }] : []),
      ...(isAdmin ? [{ href: '/payments', label: 'Payments', icon: 'fa-wallet' }] : []),
      ...(isTech ? [{ href: '/queues', label: 'Bandwidth Queues', icon: 'fa-wifi' }] : []),
      ...(isTech ? [{ href: '/ppp-profiles', label: 'PPPoE Profiles', icon: 'fa-clipboard-list' }] : []),
      ...(isTech ? [{ href: '/pppoe-accounts', label: 'PPPoE Accounts', icon: 'fa-plug' }] : []),
      ...(isSuperAdmin ? [{ href: '/users', label: 'User Management', icon: 'fa-user-shield' }] : []),
      ...(isSuperAdmin ? [{ href: '/audit-logs', label: 'Audit Logs', icon: 'fa-clipboard-list' }] : []),
    ].filter(Boolean)},
    { section: 'Monitoring', items: isTech ? [
      { href: '/monitoring', label: 'System Overview', icon: 'fa-chart-line' },
      { href: '/interfaces', label: 'Interfaces', icon: 'fa-link' },
      { href: '/arp', label: 'ARP Table', icon: 'fa-satellite' },
    ] : []},
    { section: 'Network', items: isTech ? [
      { href: '/ip-addresses', label: 'IP Addresses', icon: 'fa-globe' },
      { href: '/routes', label: 'Routing Table', icon: 'fa-map' },
      { href: '/firewall', label: 'Firewall Rules', icon: 'fa-shield-halved' },
      { href: '/ip-isolation', label: 'IP Isolation', icon: 'fa-lock' },
    ] : []},
    { section: 'Services', items: isTech ? [
      { href: '/logs', label: 'System Logs', icon: 'fa-file-lines' },
    ] : []},
  ]

  return (
    <div className="app-layout">
      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        id="mobileToggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <i className="fas fa-xmark"></i> : <i className="fas fa-bars"></i>}
      </button>
      <div
        className="mobile-overlay"
        style={{
          display: sidebarOpen ? 'block' : 'none',
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 99,
        }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><i className="fas fa-satellite"></i></div>
            <div className="sidebar-logo-text">
              <h1>MikroTik</h1>
              <span>Billing & Monitor</span>
            </div>
          </div>
        </div>

        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <div className="status-info">
            <span className="label">Router</span>
            <span className="value">{connected ? routerName : 'Disconnected'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(group => (
            <div key={group.section}>
              <div className="nav-section-title">{group.section}</div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`nav-item-icon fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="user-name">{session?.user?.name || 'User'}</span>
            <span className="user-role">{userRole}</span>
          </div>
          <div className="sidebar-footer-row">
            <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <div className="refresh-indicator">
              <div className="refresh-spinner" id="refreshSpinner"></div>
              <span>Auto-refresh</span>
            </div>
            <span>v1.2</span>
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <i className="fas fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="page-header">
          <h2 id="pageTitle">{getPageTitle(pathname)}</h2>
          <div className="header-actions">
            <a href="/" className="header-billing-shortcut" style={{ display: activeCounts !== null ? 'flex' : 'none' }}>
              <i className="fas fa-users"></i>
              <span className="shortcut-label">Aktif:</span>
              <span className="shortcut-value">{activeCounts}</span>
              <i className="fas fa-wallet" style={{ marginLeft: 8 }}></i>
              <span className="shortcut-label">Bulan Ini:</span>
              <span className="shortcut-value">{monthlyRevenue}</span>
            </a>
            <span className="header-badge">RouterOS -</span>
          </div>
        </div>

        <div className="page-content">
          {!daemonHealthy && (
            <div className="daemon-banner daemon-banner-warning" id="daemonWarningBanner">
              <i className="fas fa-triangle-exclamation"></i>
              <span>Daemon tidak terhubung ke router. Data monitoring tidak tersedia.</span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Toast */}
      <div className="toast" id="toast"></div>

      {/* Confirm Modal */}
      <div className="confirm-modal" id="confirmModal">
        <div className="confirm-modal-content">
          <h3 id="confirmModalTitle">Konfirmasi</h3>
          <p id="confirmMessage">Apakah Anda yakin?</p>
          <div className="confirm-actions">
            <button className="btn-cancel" id="confirmCancel">Batal</button>
            <button className="btn-delete" id="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPageTitle(path) {
  const titles = {
    '/': 'Billing Dashboard',
    '/monitoring': 'System Overview',
    '/interfaces': 'Network Interfaces',
    '/routes': 'Routing Table',
    '/firewall': 'Firewall Rules',
    '/arp': 'ARP Table',
    '/logs': 'System Logs',

    '/ip-addresses': 'IP Addresses',
    '/ip-isolation': 'IP Isolation',
    '/packages': 'Packages',
    '/customers': 'Customers',
    '/invoices': 'Invoices',
    '/payments': 'Payments',
    '/queues': 'Bandwidth Queues',
    '/ppp-profiles': 'PPPoE Profiles',
    '/pppoe-accounts': 'PPPoE Accounts',
    '/users': 'User Management',
    '/audit-logs': 'Audit Logs',
  }
  return titles[path] || 'MikroTik Dashboard'
}
