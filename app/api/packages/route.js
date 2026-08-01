import { success, error, withAuth, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { validate, packageSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  if (all) {
    const data = await prisma.package.findMany({ orderBy: { id: 'desc' } })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.package.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
    prisma.package.count(),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withRole('SUPER_ADMIN', 'ADMIN')(validate(packageSchema)(async (req) => {
  const { name, price, speed, profile_name, description, billing_period } = req.validated

  const pkg = await prisma.package.create({
    data: {
      name,
      price,
      speed: speed || null,
      profileName: profile_name || null,
      description: description || null,
      billingPeriod: billing_period || 'monthly',
    },
  })

  await createAuditLog({
    action: 'package_created',
    entityType: 'package',
    entityId: pkg.id,
    description: `Paket ${pkg.name} dibuat`,
    newValues: pkg,
    userId: req.userId,
  })

  return success(pkg)
}))
