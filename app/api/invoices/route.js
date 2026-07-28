import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { createAuditLog } from "@/lib/audit.mjs"
import { validate, invoiceSchema } from "@/lib/validate.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  if (all) {
    const data = await prisma.invoice.findMany({
      orderBy: { id: 'desc' },
      include: { customer: true, payments: true },
    })
    return success(data)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
      include: { customer: true, payments: true },
    }),
    prisma.invoice.count(),
  ])

  return success({
    data,
    currentPage: page,
    lastPage: Math.ceil(total / pageSize),
    total,
  })
})

export const POST = withAuth(validate(invoiceSchema)(async (req) => {
  const { customer_id, amount, status, due_date, period_start, period_end } = req.validated

  const invoiceCount = await prisma.invoice.count()
  const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`

  const data = {
    customerId: customer_id,
    invoiceNumber,
    amount,
    status: status || 'unpaid',
    dueDate: due_date,
    periodStart: period_start || null,
    periodEnd: period_end || null,
    paidAt: status === 'paid' ? new Date() : null,
  }

  const invoice = await prisma.invoice.create({ data })

  await createAuditLog({
    action: 'invoice_created',
    entityType: 'invoice',
    entityId: invoice.id,
    description: `Tagihan ${invoice.invoiceNumber} dibuat`,
    newValues: invoice,
    userId: req.userId,
  })

  return success(invoice)
}))
