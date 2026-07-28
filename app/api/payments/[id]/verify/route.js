import { success, error, withRole } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

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
    }
  }
}

export const POST = withRole('SUPER_ADMIN', 'ADMIN')(async (req, { params }) => {
  const p = await params; const id = parseInt(p.id)
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: true },
  })
  if (!payment) return error('Payment not found', 404)
  if (payment.status !== 'pending') return error('Payment is already ' + payment.status, 400)

  await prisma.payment.update({
    where: { id },
    data: {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedById: req.userId,
    },
  })

  await markInvoicePaid(payment.invoiceId)

  await createAuditLog({
    action: 'payment_verified',
    entityType: 'payment',
    entityId: id,
    description: `Pembayaran Rp ${payment.amount} untuk invoice ${payment.invoice?.invoiceNumber || payment.invoiceId} diverifikasi`,
    userId: req.userId,
  })

  return success({ message: 'Payment verified' })
})

export const PUT = withRole('SUPER_ADMIN', 'ADMIN')(async (req, { params }) => {
  const p = await params; const id = parseInt(p.id)
  const body = await req.json().catch(() => ({}))
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: true },
  })
  if (!payment) return error('Payment not found', 404)
  if (payment.status !== 'pending') return error('Payment is already ' + payment.status, 400)

  await prisma.payment.update({
    where: { id },
    data: {
      status: 'rejected',
      notes: body.reason || 'Rejected by admin',
    },
  })

  await createAuditLog({
    action: 'payment_rejected',
    entityType: 'payment',
    entityId: id,
    description: `Pembayaran Rp ${payment.amount} untuk invoice ${payment.invoice?.invoiceNumber || payment.invoiceId} ditolak: ${body.reason || ''}`,
    userId: req.userId,
  })

  return success({ message: 'Payment rejected' })
})
