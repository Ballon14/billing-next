import { success, error, withAuth, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { validate, userSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export const GET = withRole('SUPER_ADMIN')(async (req) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const roleFilter = searchParams.get('role') || ''
  const all = searchParams.get('all')

  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (roleFilter) {
    where.role = roleFilter
  }

  if (all) {
    const data = await prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { customer: true },
    })
    
    // Remove password from response
    const safeData = data.map(user => {
      const { password, ...safeUser } = user
      return safeUser
    })
    
    return success(safeData)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      include: { customer: true },
    }),
    prisma.user.count({ where }),
  ])

  // Remove password from response
  const safeData = data.map(user => {
    const { password, ...safeUser } = user
    return safeUser
  })

  return success({
    data: safeData,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withRole('SUPER_ADMIN')(validate(userSchema)(async (req) => {
  const { name, email, password, role, customer_id } = req.validated

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) {
    return error('Email sudah digunakan', 400)
  }

  // Check if customer_id already linked to another user
  if (customer_id) {
    const existingCustomerUser = await prisma.user.findUnique({ where: { customerId: customer_id } })
    if (existingCustomerUser) {
      return error('Pelanggan ini sudah terhubung dengan user lain', 400)
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'ADMIN',
      customerId: customer_id || null,
    },
    include: { customer: true }
  })

  await createAuditLog({
    action: 'user_created',
    entityType: 'user',
    entityId: user.id,
    description: `User ${user.name} dibuat`,
    newValues: { id: user.id, name: user.name, email: user.email, role: user.role, customerId: user.customerId },
    userId: req.userId,
  })

  const { password: _, ...safeUser } = user
  return success(safeUser)
}))
