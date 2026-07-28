import { readCache } from './cache.mjs'
import { RouterosAPI } from './routeros.mjs'

const config = {
  host: process.env.MIKROTIK_HOST || '10.10.10.1',
  user: process.env.MIKROTIK_USER || 'admin',
  password: process.env.MIKROTIK_PASSWORD || 'admin123',
}

function getCached(key) {
  const cache = readCache()
  return cache[key] || null
}

// --- Read Methods (from cache) ---

export function getSystemResource() {
  return getCached('resources')
}

export function getSystemIdentity() {
  return getCached('identity')
}

export function getInterfaces() {
  return getCached('interfaces')
}

export function getInterface(name) {
  const ifaces = getInterfaces()
  if (!ifaces) return null
  return ifaces.find(i => i.name === name) || null
}

export function getTraffic(name) {
  const traffic = getCached('traffic')
  return (traffic && traffic[name]) || []
}

export function getDhcpLeases() {
  return getCached('dhcpLeases')
}

export function getRoutes() {
  return getCached('routes')
}

export function getDns() {
  return getCached('dns')
}

export function getFirewallFilter() {
  return getCached('firewallFilter')
}

export function getFirewallNat() {
  return getCached('firewallNat')
}

export function getLogs() {
  return getCached('logs')
}

export function getArp() {
  return getCached('arp')
}

export function getHotspotActive() {
  return getCached('hotspotActive')
}

export function getIpAddresses() {
  return getCached('ipAddresses')
}

export function getIsolatedIpsFromCache() {
  return getCached('isolatedIps') || []
}

// --- Write Methods (live to router) ---

async function getConn() {
  const api = new RouterosAPI(3)
  const ok = await api.connect(config.host, config.user, config.password)
  if (!ok) throw new Error('Failed to connect to router')
  return api
}

export async function addDhcpLease(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.address) params.address = data.address
    if (data['mac-address'] || data.macAddress) params['mac-address'] = data['mac-address'] || data.macAddress
    if (data.server) params.server = data.server
    if (data.comment) params.comment = data.comment
    const result = await api.comm('/ip/dhcp-server/lease/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updateDhcpLease(id, data) {
  const api = await getConn()
  try {
    if (!id) throw new Error('Lease ID is required')
    const params = { '.id': id }
    if (data.address !== undefined) params.address = data.address
    if (data['mac-address'] !== undefined || data.macAddress !== undefined) params['mac-address'] = data['mac-address'] || data.macAddress
    if (data.server !== undefined) params.server = data.server
    if (data.comment !== undefined) params.comment = data.comment
    await api.comm('/ip/dhcp-server/lease/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deleteDhcpLease(id) {
  const api = await getConn()
  try {
    await api.comm('/ip/dhcp-server/lease/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function addFirewallFilter(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.chain) params.chain = data.chain
    if (data.action) params.action = data.action
    if (data['src-address'] || data.srcAddress) params['src-address'] = data['src-address'] || data.srcAddress
    if (data['dst-address'] || data.dstAddress) params['dst-address'] = data['dst-address'] || data.dstAddress
    if (data.protocol) params.protocol = data.protocol
    if (data['dst-port'] || data.dstPort) params['dst-port'] = data['dst-port'] || data.dstPort
    if (data.comment) params.comment = data.comment
    if (data.disabled) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    const result = await api.comm('/ip/firewall/filter/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updateFirewallFilter(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.chain !== undefined) params.chain = data.chain
    if (data.action !== undefined) params.action = data.action
    if (data['src-address'] !== undefined) params['src-address'] = data['src-address'] || data.srcAddress
    if (data['dst-address'] !== undefined) params['dst-address'] = data['dst-address'] || data.dstAddress
    if (data.protocol !== undefined) params.protocol = data.protocol
    if (data['dst-port'] !== undefined) params['dst-port'] = data['dst-port'] || data.dstPort
    if (data.comment !== undefined) params.comment = data.comment
    if (data.disabled !== undefined) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    await api.comm('/ip/firewall/filter/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deleteFirewallFilter(id) {
  const api = await getConn()
  try {
    await api.comm('/ip/firewall/filter/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function addFirewallNat(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.chain) params.chain = data.chain
    if (data.action) params.action = data.action
    if (data['src-address'] || data.srcAddress) params['src-address'] = data['src-address'] || data.srcAddress
    if (data['dst-address'] || data.dstAddress) params['dst-address'] = data['dst-address'] || data.dstAddress
    if (data.protocol) params.protocol = data.protocol
    if (data['dst-port'] || data.dstPort) params['dst-port'] = data['dst-port'] || data.dstPort
    if (data['to-addresses'] || data.toAddresses) params['to-addresses'] = data['to-addresses'] || data.toAddresses
    if (data['to-ports'] || data.toPorts) params['to-ports'] = data['to-ports'] || data.toPorts
    if (data.comment) params.comment = data.comment
    if (data.disabled) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    const result = await api.comm('/ip/firewall/nat/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updateFirewallNat(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.chain !== undefined) params.chain = data.chain
    if (data.action !== undefined) params.action = data.action
    if (data['src-address'] !== undefined) params['src-address'] = data['src-address'] || data.srcAddress
    if (data['dst-address'] !== undefined) params['dst-address'] = data['dst-address'] || data.dstAddress
    if (data.protocol !== undefined) params.protocol = data.protocol
    if (data['dst-port'] !== undefined) params['dst-port'] = data['dst-port'] || data.dstPort
    if (data['to-addresses'] !== undefined) params['to-addresses'] = data['to-addresses'] || data.toAddresses
    if (data['to-ports'] !== undefined) params['to-ports'] = data['to-ports'] || data.toPorts
    if (data.comment !== undefined) params.comment = data.comment
    if (data.disabled !== undefined) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    await api.comm('/ip/firewall/nat/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deleteFirewallNat(id) {
  const api = await getConn()
  try {
    await api.comm('/ip/firewall/nat/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function addIpAddress(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.address) params.address = data.address
    if (data.interface) params.interface = data.interface
    if (data.network) params.network = data.network
    if (data.comment) params.comment = data.comment
    if (data.disabled) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    const result = await api.comm('/ip/address/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updateIpAddress(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.address !== undefined) params.address = data.address
    if (data.interface !== undefined) params.interface = data.interface
    if (data.network !== undefined) params.network = data.network
    if (data.comment !== undefined) params.comment = data.comment
    if (data.disabled !== undefined) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    await api.comm('/ip/address/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deleteIpAddress(id) {
  const api = await getConn()
  try {
    await api.comm('/ip/address/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function isolateIp(ip) {
  const api = await getConn()
  try {
    await api.comm('/ip/firewall/filter/add', {
      chain: 'forward',
      'src-address': ip,
      action: 'drop',
      comment: `ISOLASI_IP::${ip}`,
      disabled: 'no',
    })
    await api.comm('/ip/firewall/filter/add', {
      chain: 'forward',
      'dst-address': ip,
      action: 'drop',
      comment: `ISOLASI_IP::${ip}`,
      disabled: 'no',
    })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function unisolateIp(ip) {
  const api = await getConn()
  try {
    const rules = await api.comm('/ip/firewall/filter/print', {
      '?comment': `ISOLASI_IP::${ip}`,
    })
    for (const rule of rules || []) {
      await api.comm('/ip/firewall/filter/remove', { '.id': rule['.id'] })
    }
    return { success: true, removed: (rules || []).length }
  } finally {
    api.disconnect()
  }
}

// Refresh cached isolation list from firewall rules
// --- Simple Queue ---

export async function getQueues() {
  const api = await getConn()
  try {
    const result = await api.comm('/queue/simple/print')
    return result || []
  } finally {
    api.disconnect()
  }
}

export async function addQueue(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.name) params.name = data.name
    if (data.target) params.target = data.target
    if (data.download) params['max-limit'] = data.download + '/' + (data.upload || data.download)
    if (data['max-limit']) params['max-limit'] = data['max-limit']
    if (data.parent) params.parent = data.parent
    if (data.priority) params.priority = data.priority
    if (data.queue) params.queue = data.queue
    if (data.comment) params.comment = data.comment
    if (data.disabled) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    const result = await api.comm('/queue/simple/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updateQueue(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.name !== undefined) params.name = data.name
    if (data.target !== undefined) params.target = data.target
    if (data.download || data.upload) {
      params['max-limit'] = (data.download || '1M') + '/' + (data.upload || data.download || '1M')
    }
    if (data['max-limit'] !== undefined) params['max-limit'] = data['max-limit']
    if (data.parent !== undefined) params.parent = data.parent
    if (data.priority !== undefined) params.priority = data.priority
    if (data.queue !== undefined) params.queue = data.queue
    if (data.comment !== undefined) params.comment = data.comment
    if (data.disabled !== undefined) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    await api.comm('/queue/simple/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deleteQueue(id) {
  const api = await getConn()
  try {
    await api.comm('/queue/simple/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

// --- PPPoE Profiles ---

export async function getPppProfiles() {
  const api = await getConn()
  try {
    const result = await api.comm('/ppp/profile/print')
    return result || []
  } finally {
    api.disconnect()
  }
}

export async function addPppProfile(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.name) params.name = data.name
    if (data['local-address'] || data.localAddress) params['local-address'] = data['local-address'] || data.localAddress
    if (data['remote-address'] || data.remoteAddress) params['remote-address'] = data['remote-address'] || data.remoteAddress
    if (data['rate-limit'] || data.rateLimit) params['rate-limit'] = data['rate-limit'] || data.rateLimit
    if (data.dns) params['dns-server'] = data.dns
    if (data.comment) params.comment = data.comment
    const result = await api.comm('/ppp/profile/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updatePppProfile(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.name !== undefined) params.name = data.name
    if (data['local-address'] !== undefined || data.localAddress !== undefined) params['local-address'] = data['local-address'] || data.localAddress
    if (data['remote-address'] !== undefined || data.remoteAddress !== undefined) params['remote-address'] = data['remote-address'] || data.remoteAddress
    if (data['rate-limit'] !== undefined || data.rateLimit !== undefined) params['rate-limit'] = data['rate-limit'] || data.rateLimit
    if (data.dns !== undefined) params['dns-server'] = data.dns
    if (data.comment !== undefined) params.comment = data.comment
    await api.comm('/ppp/profile/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deletePppProfile(id) {
  const api = await getConn()
  try {
    await api.comm('/ppp/profile/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function refreshIsolationCache() {
  const api = await getConn()
  try {
    const rules = await api.comm('/ip/firewall/filter/print')
    const isolated = []
    for (const rule of rules || []) {
      if (rule.comment && rule.comment.startsWith('ISOLASI_IP::')) {
        const ip = rule.comment.replace('ISOLASI_IP::', '')
        if (ip && !isolated.includes(ip)) {
          isolated.push(ip)
        }
      }
    }
    return isolated
  } finally {
    api.disconnect()
  }
}

// --- PPP Secrets (from /ppp/secret) ---

export async function getPppSecrets() {
  const api = await getConn()
  try {
    const secrets = await api.comm('/ppp/secret/print')
    const active = await api.comm('/ppp/active/print')
    const activeNames = new Set((active || []).map(a => a.name))
    return (secrets || []).map(s => ({
      ...s,
      Online: activeNames.has(s.name),
    }))
  } finally {
    api.disconnect()
  }
}

export async function addPppSecret(data) {
  const api = await getConn()
  try {
    const params = {}
    if (data.name) params.name = data.name
    if (data.password) params.password = data.password
    if (data.service) params.service = data.service
    if (data.profile) params.profile = data.profile
    if (data['remote-address'] || data.remoteAddress) params['remote-address'] = data['remote-address'] || data.remoteAddress
    if (data['local-address'] || data.localAddress) params['local-address'] = data['local-address'] || data.localAddress
    if (data.comment) params.comment = data.comment
    if (data.disabled) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    const result = await api.comm('/ppp/secret/add', params)
    return result
  } finally {
    api.disconnect()
  }
}

export async function updatePppSecret(id, data) {
  const api = await getConn()
  try {
    const params = { '.id': id }
    if (data.name !== undefined) params.name = data.name
    if (data.password !== undefined && data.password !== '') params.password = data.password
    if (data.service !== undefined) params.service = data.service
    if (data.profile !== undefined) params.profile = data.profile
    if (data['remote-address'] !== undefined || data.remoteAddress !== undefined) params['remote-address'] = data['remote-address'] || data.remoteAddress || ''
    if (data['local-address'] !== undefined || data.localAddress !== undefined) params['local-address'] = data['local-address'] || data.localAddress || ''
    if (data.comment !== undefined) params.comment = data.comment
    if (data.disabled !== undefined) params.disabled = data.disabled === 'yes' || data.disabled === true ? 'yes' : 'no'
    await api.comm('/ppp/secret/set', params)
    return { success: true }
  } finally {
    api.disconnect()
  }
}

export async function deletePppSecret(id) {
  const api = await getConn()
  try {
    await api.comm('/ppp/secret/remove', { '.id': id })
    return { success: true }
  } finally {
    api.disconnect()
  }
}

