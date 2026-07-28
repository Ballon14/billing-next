import { success, withRole } from "@/lib/api-utils.mjs"
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"
import prisma from "@/lib/prisma.mjs"

const LATE_FEE_PERCENT = 0.02
const GRACE_PERIOD_DAYS = 3

export const dynamic = 'force-dynamic'

export const POST = withRole('SUPER_ADMIN')(async () => {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: 'unpaid',
      dueDate: { lt: cutoffDate },
    },
    include: { customer: true },
  })

  let suspended = 0
  for (const invoice of overdueInvoices) {
    if (invoice.customer && invoice.customer.status === 'active') {
      await prisma.customer.update({
        where: { id: invoice.customer.id },
        data: { status: 'suspended' },
      })

      const accounts = await prisma.pppoeAccount.findMany({
        where: { customerId: invoice.customer.id },
      })

      for (const acc of accounts) {
        try {
          const syncService = new PppoeSyncService()
          await syncService.disableOnRouter(acc.username)
        } catch (e) {
          console.error('[Disable PPPoE]', e.message)
        }
      }

      suspended++
    }

    const lateFee = Math.round(invoice.amount * LATE_FEE_PERCENT)
    if (lateFee > 0) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { amount: invoice.amount + lateFee },
      })
    }
  }

  return success({ message: `${suspended} customer(s) suspended, fees applied to ${overdueInvoices.length} invoice(s)`, count: suspended })
})
