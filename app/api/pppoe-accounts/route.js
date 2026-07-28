import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"
import { validate, pppoeAccountSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  if (all) {
    const data = await prisma.pppoeAccount.findMany({
      orderBy: { id: 'desc' },
      include: { customer: true, router: true },
    })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.pppoeAccount.findMany({
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      include: { customer: true, router: true },
    }),
    prisma.pppoeAccount.count(),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withAuth(validate(pppoeAccountSchema)(async (req) => {
  const { customer_id, router_id, username, password, profile, ip_address, service, disabled } = req.validated

  const account = await prisma.pppoeAccount.create({
    data: {
      customerId: customer_id,
      routerId: router_id,
      username,
      password,
      profile: profile || null,
      ipAddress: ip_address || null,
      service: service || 'pppoe',
      disabled,
    },
    include: { customer: true, router: true },
  })

  if (!account.disabled) {
    try {
      const syncService = new PppoeSyncService()
      await syncService.sync(account)
    } catch (e) {
      console.error('[Sync PPPoE]', e.message)
    }
  }

  await createAuditLog({
    action: 'pppoe_account_created',
    entityType: 'pppoe_account',
    entityId: account.id,
    description: `Akun PPPoE ${account.username} dibuat`,
    newValues: account,
    userId: req.userId,
  })

  return success(account)
}))
