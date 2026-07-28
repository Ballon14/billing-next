import { success, error, withAuth } from "@/lib/api-utils.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  const userEmail = req.user.email

  const customer = await prisma.customer.findFirst({
    where: { email: userEmail },
    include: {
      package: true,
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: { payments: true },
      },
      pppoeAccounts: true,
    },
  })

  if (!customer) {
    return error('Customer not found. Please contact admin to link your account.', 404)
  }

  return success(customer)
})
