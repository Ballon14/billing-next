import { success, error, withAuth, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { encrypt } from "@/lib/encryption.mjs"
import { validate, routerSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  if (all) {
    const data = await prisma.router.findMany({
      orderBy: { id: 'desc' },
      select: { id: true, name: true, host: true, port: true, username: true, apiPort: true, isActive: true, createdAt: true, updatedAt: true },
    })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.router.findMany({
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      select: { id: true, name: true, host: true, port: true, username: true, apiPort: true, isActive: true, createdAt: true, updatedAt: true },
    }),
    prisma.router.count(),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withRole('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')(validate(routerSchema)(async (req) => {
  const { name, host, port, username, password, api_port, is_active } = req.validated

  const router = await prisma.router.create({
    data: {
      name,
      host,
      port: port || 8728,
      username,
      password: encrypt(password || ''),
      apiPort: api_port || null,
      isActive: is_active !== undefined ? Boolean(is_active) : true,
    },
  })

  await createAuditLog({
    action: 'router_created',
    entityType: 'router',
    entityId: router.id,
    description: `Router ${router.name} ditambahkan`,
    newValues: { ...router, password: undefined },
    userId: req.userId,
  })

  return success(router)
}))
