import fs from 'node:fs'
import path from 'node:path'

const CACHE_FILE = path.join(process.cwd(), 'data', 'cache.json')

let _cache = null
let _cacheTs = 0
const CACHE_TTL_MS = 2000 // Re-read file every 2 seconds

export function readCache() {
  const now = Date.now()
  if (_cache && (now - _cacheTs) < CACHE_TTL_MS) return _cache
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
    _cache = JSON.parse(raw)
    _cacheTs = now
    return _cache
  } catch {
    return {}
  }
}

export function refreshCache() {
  _cache = null
  _cacheTs = 0
  return readCache()
}

export function clearCacheMemory() {
  _cache = null
  _cacheTs = 0
}
