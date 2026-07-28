#!/usr/bin/env node
import 'dotenv/config'
import prisma from '../lib/prisma.mjs'
import { PppoeSyncService } from '../lib/pppoe-sync.mjs'

const LATE_FEE_PERCENT = 0.02
const GRACE_PERIOD_DAYS = 3

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
  console.log(`[${ts}] [BILLING] ${msg}`)
}

async function generateInvoices() {
  log('=== Generate Invoices: Start ===')
  const customers = await prisma.customer.findMany({
    where: { status: 'active' },
    include: { package: true },
  })

  let created = 0
  for (const customer of customers) {
    if (!customer.package) {
      log(`SKIP Customer #${customer.id} ${customer.name}: no package`)
      continue
    }

    const lastInvoice = await prisma.invoice.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    })
    if (lastInvoice && lastInvoice.status === 'unpaid') {
      log(`SKIP Customer #${customer.id} ${customer.name}: has unpaid invoice ${lastInvoice.invoiceNumber}`)
      continue
    }

    const now = new Date()
    let periodStart, periodEnd
    const bp = customer.package.billingPeriod || 'monthly'

    if (bp === 'weekly') {
      periodStart = new Date(now)
      periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (bp === 'quarterly') {
      periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0)
    } else if (bp === 'yearly') {
      periodStart = new Date(now.getFullYear(), 0, 1)
      periodEnd = new Date(now.getFullYear(), 11, 31)
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const dueDate = new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000)

    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`

    await prisma.invoice.create({
      data: {
        customerId: customer.id,
        invoiceNumber,
        amount: customer.package.price,
        status: 'unpaid',
        dueDate: dueDate.toISOString().split('T')[0],
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      },
    })

    created++
    log(`CREATE Invoice ${invoiceNumber}: ${customer.name} - Rp ${customer.package.price}`)
  }

  log(`=== Generate Invoices: Done (${created} created) ===`)
  return created
}

async function checkOverdue() {
  log('=== Check Overdue: Start ===')
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
    const customer = invoice.customer
    if (!customer) continue

    log(`OVERDUE Invoice ${invoice.invoiceNumber}: ${customer.name} (due: ${invoice.dueDate})`)

    if (customer.status === 'active') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { status: 'suspended' },
      })
      log(`SUSPEND Customer #${customer.id} ${customer.name}`)

      const accounts = await prisma.pppoeAccount.findMany({
        where: { customerId: customer.id },
      })
      for (const acc of accounts) {
        try {
          const syncService = new PppoeSyncService()
          await syncService.disableOnRouter(acc.username)
          log(`DISABLE PPPoE ${acc.username} on router`)
        } catch (e) {
          log(`FAIL disable PPPoE ${acc.username}: ${e.message}`)
        }
      }
      suspended++
    }

    const amount = invoice.amount
    const lateFee = Math.round(amount * LATE_FEE_PERCENT)
    if (lateFee > 0) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { amount: amount + lateFee },
      })
      log(`LATE FEE Invoice ${invoice.invoiceNumber}: +Rp ${lateFee}`)
    }
  }

  log(`=== Check Overdue: Done (${suspended} suspended, fees applied to ${overdueInvoices.length}) ===`)
  return { suspended, total: overdueInvoices.length }
}

async function run() {
  log('Starting billing cron job...')
  try {
    await generateInvoices()
    await checkOverdue()
  } catch (e) {
    console.error('[BILLING CRON ERROR]', e)
  }
  await prisma.$disconnect()
  log('Billing cron job completed.')
}

run()
