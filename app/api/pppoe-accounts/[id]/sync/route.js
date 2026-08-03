import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req, { params }) => {
  const p = await params; const id = parseInt(p.id)
  const account = await prisma.pppoeAccount.findUnique({
    where: { id },

  })
  if (!account) return error('PPPoE account not found', 404)

  try {
    const syncService = new PppoeSyncService()
    await syncService.sync(account)
  } catch (e) {
    console.error('[Sync PPPoE]', e.message)
  }

  return success({ message: 'Sync ditambahkan ke antrian' })
})
