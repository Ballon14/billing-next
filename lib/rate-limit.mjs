const hits = new Map()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 100

function getKey(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return ip
}

export function rateLimit({ windowMs = WINDOW_MS, max = MAX_REQUESTS } = {}) {
  return function (handler) {
    return async (req, ...args) => {
      const key = getKey(req)
      const now = Date.now()
      const entry = hits.get(key)

      if (!entry) {
        hits.set(key, { count: 1, start: now })
      } else {
        if (now - entry.start > windowMs) {
          hits.set(key, { count: 1, start: now })
        } else {
          entry.count++
          if (entry.count > max) {
            return Response.json(
              { success: false, error: 'Too many requests. Please try again later.' },
              { status: 429, headers: { 'Retry-After': String(Math.ceil((windowMs - (now - entry.start)) / 1000)) } }
            )
          }
        }
      }

      return handler(req, ...args)
    }
  }
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits.entries()) {
      if (now - entry.start > WINDOW_MS) hits.delete(key)
    }
  }, 5 * 60 * 1000)
}
