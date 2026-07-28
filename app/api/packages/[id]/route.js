import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { validatePartial, packageSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const PUT = withAuth(validatePartial(packageSchema)(async (req, { params }) => {
  const id = parseInt(params.id)
  const body = req.validated
  const original = await prisma.package.findUnique({ where: { id } })
  if (!original) return error('Package not found', 404)

  const updated = await prisma.package.update({
    where: { id },
    data: {
      name: body.name,
      price: body.price,
      speed: body.speed || null,
      description: body.description || null,
      billingPeriod: body.billing_period || original.billingPeriod,
    },
  })

  await createAuditLog({
    action: 'package_updated',
    entityType: 'package',
    entityId: id,
    description: `Paket ${updated.name} diupdate`,
    oldValues: original,
    newValues: updated,
    userId: req.userId,
  })

  return success({ message: 'Package updated' })
}))

export const DELETE = withAuth(async (req, { params }) => {
  const id = parseInt(params.id)
  const pkg = await prisma.package.findUnique({ where: { id } })
  if (!pkg) return error('Package not found', 404)

  await prisma.package.delete({ where: { id } })

  await createAuditLog({
    action: 'package_deleted',
    entityType: 'package',
    entityId: id,
    description: `Paket ${pkg.name} dihapus`,
    oldValues: pkg,
    userId: req.userId,
  })

  return success({ message: 'Package deleted' })
})
