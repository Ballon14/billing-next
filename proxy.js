import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"

const roleAccess = {
  '/': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/monitoring': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/interfaces': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/dhcp': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/routes': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/firewall': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/arp': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/logs': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/hotspot': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/ip-addresses': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/ip-isolation': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/packages': ['SUPER_ADMIN', 'ADMIN'],
  '/customers': ['SUPER_ADMIN', 'ADMIN'],
  '/invoices': ['SUPER_ADMIN', 'ADMIN'],
  '/payments': ['SUPER_ADMIN', 'ADMIN'],
  '/routers': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/queues': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/ppp-profiles': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/pppoe-accounts': ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  '/audit-logs': ['SUPER_ADMIN'],
}

export async function proxy(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && pathname.startsWith("/login")) {
    const redirectTo = token.role === 'CUSTOMER' ? '/portal' : '/'
    return NextResponse.redirect(new URL(redirectTo, req.url))
  }

  if (token && token.role === 'CUSTOMER' && !pathname.startsWith('/portal') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/portal', req.url))
  }

  const basePath = '/' + pathname.split('/').filter(Boolean)[0]
  const allowedRoles = roleAccess[basePath]
  if (allowedRoles && token && !allowedRoles.includes(token.role)) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
}
