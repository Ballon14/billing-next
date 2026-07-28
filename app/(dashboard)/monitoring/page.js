'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/client-api.mjs'

export default function OverviewPage() {
  const [data, setData] = useState(null)
  const [charts, setCharts] = useState({ uplink: [], bridge: [] })
  const uplinkCanvas = useRef(null)
  const bridgeCanvas = useRef(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [routerData, identity, interfaces, uplinkTraffic, bridgeTraffic] = await Promise.all([
          apiFetch('/api/router').catch(() => null),
          apiFetch('/api/identity').catch(() => null),
          apiFetch('/api/interfaces').catch(() => []),
          apiFetch('/api/traffic/ether1-WAN').catch(() => []),
          apiFetch('/api/traffic/bridge-internet').catch(() => []),
        ])
        if (!active) return
        setData({ resource: routerData, identity, interfaces })
        setCharts({ uplink: uplinkTraffic, bridge: bridgeTraffic })
      } catch (e) {
        console.error(e)
      }
    }

    load()
    const interval = setInterval(load, 3000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  useEffect(() => {
    if (charts.uplink.length >= 2) drawChart(uplinkCanvas.current, charts.uplink)
    if (charts.bridge.length >= 2) drawChart(bridgeCanvas.current, charts.bridge)
  }, [charts])

  if (!data) {
    return <div className="stats-grid">
      {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 100 }}></div>)}
    </div>
  }

  const r = data.resource || {}
  const cpuLoad = Number(r.cpuLoad) || 0
  const totalMem = Number(r.totalMemory) || 0
  const freeMem = Number(r.freeMemory) || 0
  const usedMem = totalMem - freeMem
  const ramPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0
  const totalHdd = Number(r.totalHddSpace) || 0
  const freeHdd = Number(r.freeHddSpace) || 0
  const usedHdd = totalHdd - freeHdd
  const hddPercent = totalHdd > 0 ? Math.round((usedHdd / totalHdd) * 100) : 0

  function fmtBytes(b, d = 1) {
    if (!b || b === 0) return '0 B'
    const k = 1024
    const sizes = ['B','KiB','MiB','GiB','TiB']
    const i = Math.floor(Math.log(b) / Math.log(k))
    return parseFloat((b / Math.pow(k, i)).toFixed(d)) + ' ' + sizes[i]
  }

  return (
    <>
      <div className="stats-grid">
        {[
          { label: 'CPU Load', value: cpuLoad + '%', pct: cpuLoad, color: cpuLoad > 80 ? 'red' : cpuLoad > 50 ? 'cyan' : 'green', icon: 'fa-microchip' },
          { label: 'RAM Usage', value: ramPercent + '%', sub: `${fmtBytes(usedMem)} / ${fmtBytes(totalMem)}`, pct: ramPercent, color: ramPercent > 80 ? 'red' : ramPercent > 50 ? 'cyan' : 'green', icon: 'fa-brain' },
          { label: 'Storage', value: hddPercent + '%', sub: `${fmtBytes(usedHdd)} / ${fmtBytes(totalHdd)}`, pct: hddPercent, color: hddPercent > 90 ? 'red' : hddPercent > 70 ? 'cyan' : 'green', icon: 'fa-hard-drive' },
          { label: 'Uptime', value: (r.uptime || '-').replace(/w/g,'w ').replace(/d/g,'d ').replace(/h/g,'h ').replace(/m/g,'m '), icon: 'fa-clock' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color || 'blue'}`}>
            <div className="stat-card-top">
              <span className="stat-label">{s.label}</span>
              <i className={`fas ${s.icon}`}></i>
            </div>
            <div className="stat-value">{s.value}</div>
            {s.sub && <div className="stat-sub">{s.sub}</div>}
            {s.pct !== undefined && (
              <div className="progress-bar">
                <div className={`progress-fill ${s.color}`} style={{ width: Math.min(100, s.pct) + '%' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fas fa-circle-info"></i> System Information</h3>
        </div>
        <div className="card-body">
          <div className="info-grid">
            {[
              ['Board Name', r.boardName || '-'],
              ['Architecture', r.architectureName || '-'],
              ['RouterOS Version', r.version || '-'],
              ['CPU Model', r.cpu || '-'],
              ['CPU Count', r.cpuCount || '-'],
              ['CPU Frequency', r.cpuFrequency ? r.cpuFrequency + ' MHz' : '-'],
            ].map(([l, v]) => (
              <div key={l} className="info-item">
                <div className="info-item-label">{l}</div>
                <div className="info-item-value">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {[
          { label: 'Uplink (WAN)', icon: 'fa-globe', data: charts.uplink, canvasRef: uplinkCanvas, id: 'uplink' },
          { label: 'Bridge (LAN)', icon: 'fa-network-wired', data: charts.bridge, canvasRef: bridgeCanvas, id: 'bridge' },
        ].map(chart => {
          const last = chart.data.length > 0 ? chart.data[chart.data.length - 1] : null
          const rxBps = last ? (last.rxRate || 0) * 8 : 0
          const txBps = last ? (last.txRate || 0) * 8 : 0
          const peakRx = chart.data.reduce((m, d) => Math.max(m, (d.rxRate || 0) * 8), 0)
          const peakTx = chart.data.reduce((m, d) => Math.max(m, (d.txRate || 0) * 8), 0)

          return (
            <div key={chart.id} className="chart-card">
              <div className="chart-header">
                <h3><i className={`fas ${chart.icon}`}></i> {chart.label}</h3>
              </div>
              <div className="chart-body">
                <div className="chart-canvas-wrap">
                  {chart.data.length < 2 ? (
                    <div className="chart-waiting">
                      <span>Menunggu data traffic...</span>
                    </div>
                  ) : <canvas ref={chart.canvasRef} style={{ width: '100%', height: '100%' }}></canvas>}
                </div>
              </div>
              <div className="chart-legend">
                <div className="chart-legend-item">
                  <span className="chart-legend-dot rx"></span>
                  <span>
                    RX: <span className="chart-legend-value" style={{ color: '#22d3ee' }}>{formatSpeed(rxBps)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 6 }}>peak {formatSpeed(peakRx)}</span>
                  </span>
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot tx"></span>
                  <span>
                    TX: <span className="chart-legend-value" style={{ color: '#a78bfa' }}>{formatSpeed(txBps)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 6 }}>peak {formatSpeed(peakTx)}</span>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function drawChart(canvas, data) {
  if (!canvas) return
  const rect = canvas.parentElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const W = rect.width, H = rect.height
  const P = { top: 12, right: 12, bottom: 28, left: 60 }
  const cw = W - P.left - P.right, ch = H - P.top - P.bottom
  ctx.clearRect(0, 0, W, H)

  data = data.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0))

  // Find max value in bits per second
  let maxBps = 0
  data.forEach(d => {
    maxBps = Math.max(maxBps, (d.rxRate || 0) * 8, (d.txRate || 0) * 8)
  })
  maxBps = Math.max(maxBps, 1000) // minimum 1 Kbps scale

  // Calculate nice round scale
  const niceMax = getNiceMax(maxBps)
  const gridLines = 5

  // Draw grid lines and Y-axis labels
  ctx.font = "10px 'JetBrains Mono', monospace"
  ctx.textAlign = 'right'
  for (let i = 0; i <= gridLines; i++) {
    const y = P.top + (ch / gridLines) * i
    const val = niceMax - (niceMax / gridLines) * i

    // Dashed grid lines
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(P.left, y)
    ctx.lineTo(W - P.right, y)
    ctx.stroke()
    ctx.setLineDash([])

    // Y-axis label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.fillText(formatSpeed(val), P.left - 8, y + 4)
  }

  // Draw area + line for each series
  const rxColor = '#22d3ee'
  const txColor = '#a78bfa'

  function drawSeries(points, key, lineColor, fillTop, fillBottom) {
    if (points.length < 2) return
    const step = cw / (points.length - 1)

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, P.top, 0, P.top + ch)
    gradient.addColorStop(0, fillTop)
    gradient.addColorStop(1, fillBottom)

    // Draw filled area
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = P.left + i * step
      const val = (p[key] || 0) * 8
      const y = P.top + ch - (val / niceMax) * ch
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(P.left + (points.length - 1) * step, P.top + ch)
    ctx.lineTo(P.left, P.top + ch)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = P.left + i * step
      const val = (p[key] || 0) * 8
      const y = P.top + ch - (val / niceMax) * ch
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Draw TX first (behind), then RX on top
  drawSeries(data, 'txRate', txColor, 'rgba(167, 139, 250, 0.15)', 'rgba(167, 139, 250, 0.01)')
  drawSeries(data, 'rxRate', rxColor, 'rgba(34, 211, 238, 0.2)', 'rgba(34, 211, 238, 0.01)')

  // X-axis time labels
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.textAlign = 'center'
  ctx.font = "9px 'JetBrains Mono', monospace"
  if (data.length >= 2) {
    const labelCount = Math.min(5, data.length)
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round(i * (data.length - 1) / (labelCount - 1))
      const x = P.left + (idx / (data.length - 1)) * cw
      const t = new Date(data[idx].ts)
      ctx.fillText(t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), x, H - 6)
    }
  }
}

// Calculate a nice round maximum for the chart scale
function getNiceMax(maxVal) {
  if (maxVal <= 0) return 1000
  // Predefined nice steps in bps
  const steps = [
    1000, 2000, 5000, 10000,                               // Kbps range
    20000, 50000, 100000, 200000, 500000,                   // hundreds Kbps
    1000000, 2000000, 5000000, 10000000,                    // Mbps range
    20000000, 50000000, 100000000, 200000000, 500000000,    // hundreds Mbps
    1000000000, 2000000000, 5000000000, 10000000000,        // Gbps range
  ]
  for (const step of steps) {
    if (step >= maxVal * 1.1) return step
  }
  return maxVal * 1.2
}

function formatSpeed(bps) {
  if (!bps || bps <= 0) return '0 bps'
  const n = Number(bps)
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + ' Gbps'
  if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 1 : 2) + ' Mbps'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + ' Kbps'
  return Math.round(n) + ' bps'
}

