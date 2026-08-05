import { success, error, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { validate, userUpdateSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export const GET = withRole('SUPER_ADMIN')(async (req, { params }) => {
  const { id } = await params
  
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: { customer: true }
  })

  if (!user) return error('User not found', 404)

  const { password, ...safeUser } = user
  return success(safeUser)
})

export const PUT = withRole('SUPER_ADMIN')(validate(userUpdateSchema)(async (req, { params }) => {
  const { id } = await params
  const { name, email, password, role, customer_id } = req.validated

  const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } })
  if (!existing) return error('User not found', 404)

  // Check if email changed and is unique
  if (email !== existing.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) return error('Email sudah digunakan', 400)
  }

  // Check if customer_id changed and is unique
  if (customer_id && customer_id !== existing.customerId) {
    const existingCustomerUser = await prisma.user.findUnique({ where: { customerId: customer_id } })
    if (existingCustomerUser) {
      return error('Pelanggan ini sudah terhubung dengan user lain', 400)
    }
  }

  const dataToUpdate = {
    name,
    email,
    role,
    customerId: customer_id || null,
  }

  // Update password if provided
  if (password && password.trim() !== '') {
    dataToUpdate.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: dataToUpdate,
    include: { customer: true }
  })

  const oldValues = { id: existing.id, name: existing.name, email: existing.email, role: existing.role, customerId: existing.customerId }
  const newValues = { id: user.id, name: user.name, email: user.email, role: user.role, customerId: user.customerId }

  await createAuditLog({
    action: 'user_updated',
    entityType: 'user',
    entityId: user.id,
    description: `User ${user.name} diperbarui`,
    oldValues,
    newValues,
    userId: req.userId,
  })

  const { password: _, ...safeUser } = user
  return success(safeUser)
}))

export const DELETE = withRole('SUPER_ADMIN')(async (req, { params }) => {
  const { id } = await params
  
  // Prevent deleting oneself
  if (parseInt(id) === req.userId) {
    return error('Anda tidak dapat menghapus akun Anda sendiri', 400)
  }

  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
  if (!user) return error('User not found', 404)

  await prisma.user.delete({ where: { id: parseInt(id) } })

  await createAuditLog({
    action: 'user_deleted',
    entityType: 'user',
    entityId: user.id,
    description: `User ${user.name} dihapus`,
    oldValues: { id: user.id, name: user.name, email: user.email, role: user.role },
    userId: req.userId,
  })

  return success({ message: 'User deleted' })
})
