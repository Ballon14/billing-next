import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { PppoeSyncService } from "@/lib/pppoe-sync.mjs"
import { validate, paymentSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  if (all) {
    const data = await prisma.payment.findMany({
      orderBy: { id: 'desc' },
      include: { invoice: { include: { customer: true } } },
    })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      include: { invoice: { include: { customer: true } } },
    }),
    prisma.payment.count(),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

async function markInvoicePaid(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  })
  if (!invoice) return

  const verifiedTotal = invoice.payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0)

  if (verifiedTotal >= invoice.amount && invoice.status !== 'paid') {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'paid', paidAt: new Date() },
    })

    const customer = await prisma.customer.findUnique({ where: { id: invoice.customerId } })
    if (customer && customer.status !== 'active') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { status: 'active' },
      })
      const accounts = await prisma.pppoeAccount.findMany({ where: { customerId: customer.id } })
      for (const acc of accounts) {
        try {
          const syncService = new PppoeSyncService()
          await syncService.enableOnRouter(acc.username)
        } catch (e) {
          console.error('[Activate]', e.message)
        }
      }
    }
  }
}

export const POST = withAuth(validate(paymentSchema)(async (req) => {
  const { invoice_id, amount, payment_method, reference, notes } = req.validated

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice_id,
      amount,
      paymentMethod: payment_method || null,
      reference: reference || null,
      notes: notes || null,
      status: 'verified',
      verifiedAt: new Date(),
      verifiedById: req.userId,
      paidAt: new Date(),
    },
    include: { invoice: { include: { customer: true } } },
  })

  await markInvoicePaid(invoice_id)

  await createAuditLog({
    action: 'payment_recorded',
    entityType: 'payment',
    entityId: payment.id,
    description: `Pembayaran Rp ${amount} untuk invoice ${payment.invoice?.invoiceNumber || invoice_id} (verified)`,
    newValues: payment,
    userId: req.userId,
  })

  return success(payment)
}))
