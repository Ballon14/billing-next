import { withAuth } from "@/lib/api-utils.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const where = {}
  if (status) where.status = status
  if (from) where.paidAt = { ...(where.paidAt || {}), gte: new Date(from) }
  if (to) where.paidAt = { ...(where.paidAt || {}), lte: new Date(to + 'T23:59:59.999Z') }

  const payments = await prisma.payment.findMany({
    where,
    include: { invoice: { include: { customer: true } } },
    orderBy: { paidAt: 'desc' },
  })

  const header = 'ID,Invoice,Customer,Amount,Method,Status,Paid At,Reference,Notes'
  const rows = payments.map(p =>
    `${p.id},"${p.invoice?.invoiceNumber || '-'}","${p.invoice?.customer?.name || '-'}",${p.amount},"${p.paymentMethod || '-'}","${p.status || 'pending'}","${p.paidAt?.toISOString() || ''}","${p.reference || ''}","${(p.notes || '').replace(/"/g, '""')}"`
  ).join('\n')

  return new Response(header + '\n' + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payments.csv"',
    },
  })
})
