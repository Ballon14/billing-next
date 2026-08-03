import { success, error, withAuth, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"
import { validate, customerSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')
  const search = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || ''

  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { pppoeUsername: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  if (all) {
    const data = await prisma.customer.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { package: true, pppoeAccounts: true },
    })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      include: { package: true, pppoeAccounts: true },
    }),
    prisma.customer.count({ where }),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withRole('SUPER_ADMIN', 'ADMIN')(validate(customerSchema)(async (req) => {
  const { name, nik, phone, email, address, pppoe_username, pppoe_password, package_id, status } = req.validated

  const customer = await prisma.customer.create({
    data: {
      name,
      nik: nik || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      pppoeUsername: pppoe_username,
      pppoePassword: pppoe_password,
      packageId: parseInt(package_id),
      status: status || 'inactive',
    },
  })

  // Get package profile for PPPoE
  const pkg = await prisma.package.findUnique({ where: { id: parseInt(package_id) } })

  const account = await prisma.pppoeAccount.create({
    data: {
      customerId: customer.id,
      username: pppoe_username,
      password: pppoe_password,
      profile: pkg?.profileName || null,
      service: 'pppoe',
      disabled: status !== 'active',
    },
  })

  // Always sync to MikroTik (will be created as disabled if not active)
  try {
    const syncService = new PppoeSyncService()
    await syncService.sync(account)
  } catch (e) {
    console.error('[Sync PPPoE]', e.message)
  }

  await createAuditLog({
    action: 'customer_created',
    entityType: 'customer',
    entityId: customer.id,
    description: `Pelanggan ${customer.name} dibuat`,
    newValues: customer,
    userId: req.userId,
  })

  return success(customer)
}))
