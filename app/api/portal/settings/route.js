import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import prisma from "@/lib/prisma.mjs"
import bcrypt from "bcryptjs"
import { z } from 'zod'
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"

export const dynamic = 'force-dynamic'

const settingsSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal('')),
})

export const PUT = withAuth(async (req) => {
  if (req.user.role !== 'CUSTOMER') {
    return error('Unauthorized', 403)
  }

  let body
  try {
    body = await req.json()
    settingsSchema.parse(body)
  } catch (e) {
    return error('Validasi gagal: ' + (e.errors?.[0]?.message || e.message), 400)
  }

  const { username, password } = body

  // Logged in via User table
  if (req.user.isUserTable) {
    const existing = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } })
    if (!existing) return error('Akun tidak ditemukan', 404)

    // Check if new email is taken
    if (username !== existing.email) {
      const check = await prisma.user.findUnique({ where: { email: username } })
      if (check) return error('Username / Email sudah digunakan akun lain', 400)
    }

    const dataToUpdate = { email: username }
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: dataToUpdate
    })

    await createAuditLog({
      action: 'portal_settings_updated',
      entityType: 'user',
      entityId: existing.id,
      description: `Customer memperbarui kredensial portal (via User)`,
      userId: req.userId,
    })

    return success({ message: 'Pengaturan berhasil diperbarui' })
  } 
  
  // Logged in via Customer table (PPPoE credentials)
  else {
    const customerId = parseInt(req.userId)
    const existing = await prisma.customer.findUnique({ 
      where: { id: customerId },
      include: { pppoeAccounts: true }
    })
    
    if (!existing) return error('Pelanggan tidak ditemukan', 404)

    // Check if new pppoeUsername is taken
    if (username !== existing.pppoeUsername) {
      const check = await prisma.customer.findUnique({ where: { pppoeUsername: username } })
      if (check) return error('Username sudah digunakan pelanggan lain', 400)
    }

    const dataToUpdate = { pppoeUsername: username }
    if (password && password.trim() !== '') {
      dataToUpdate.pppoePassword = password // plain text for PPPoE
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: dataToUpdate
    })

    // Update PPPoE account records if any
    for (const acc of existing.pppoeAccounts) {
      const accUpdate = {}
      // Jika mereka menggunakan pppoeUsername yang sama dengan akun utama
      if (acc.username === existing.pppoeUsername) {
        accUpdate.username = username
      }
      if (password && password.trim() !== '' && acc.password === existing.pppoePassword) {
        accUpdate.password = password
      }

      if (Object.keys(accUpdate).length > 0) {
        const updatedAcc = await prisma.pppoeAccount.update({
          where: { id: acc.id },
          data: accUpdate
        })

        // Sync to Mikrotik
        try {
          const syncService = new PppoeSyncService()
          await syncService.sync(updatedAcc)
        } catch (e) {
          console.error('[Sync PPPoE error during settings update]', e.message)
        }
      }
    }

    await createAuditLog({
      action: 'portal_settings_updated',
      entityType: 'customer',
      entityId: customerId,
      description: `Customer memperbarui kredensial portal (via PPPoE)`,
      userId: customerId,
    })

    return success({ message: 'Pengaturan berhasil diperbarui. Jika Anda menggunakan router, koneksi mungkin perlu disambungkan ulang dengan password baru.' })
  }
})
