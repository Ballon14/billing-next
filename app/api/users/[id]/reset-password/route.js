import { success, error, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import prisma from "@/lib/prisma.mjs"
import bcrypt from "bcryptjs"
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password min 6 characters').max(100)
})

export const POST = withRole('SUPER_ADMIN')(async (req, { params }) => {
  const { id } = await params
  
  let body
  try {
    body = await req.json()
    resetPasswordSchema.parse(body)
  } catch (e) {
    return error('Invalid request body: ' + (e.errors?.[0]?.message || e.message), 400)
  }

  const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } })
  if (!existing) return error('User not found', 404)

  const hashedPassword = await bcrypt.hash(body.password, 10)

  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword },
  })

  await createAuditLog({
    action: 'user_password_reset',
    entityType: 'user',
    entityId: existing.id,
    description: `Password untuk user ${existing.name} direset`,
    userId: req.userId,
  })

  return success({ message: 'Password berhasil direset' })
})
