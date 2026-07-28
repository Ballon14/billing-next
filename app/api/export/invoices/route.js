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
  if (from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) }
  if (to) where.createdAt = { ...(where.createdAt || {}), lte: new Date(to + 'T23:59:59.999Z') }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })

  const header = 'Invoice Number,Customer,Amount,Status,Due Date,Period Start,Period End,Created At'
  const rows = invoices.map(i =>
    `"${i.invoiceNumber}","${i.customer?.name || '-'}",${i.amount},"${i.status}","${i.dueDate || ''}","${i.periodStart || ''}","${i.periodEnd || ''}","${i.createdAt.toISOString()}"`
  ).join('\n')

  return new Response(header + '\n' + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="invoices.csv"',
    },
  })
})
