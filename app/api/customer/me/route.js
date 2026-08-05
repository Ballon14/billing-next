import { success, error, withAuth } from "@/lib/api-utils.mjs"
import prisma from "@/lib/prisma.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req) => {
  // Jika user login via akun User yang terhubung, gunakan customerId. 
  // Jika via PPPoE, req.userId adalah ID customer (meskipun string, parseInt akan menanganinya)
  let customerId = req.user.customerId ? parseInt(req.user.customerId) : parseInt(req.userId)

  // Untuk amannya, kita asumsikan ini endpoint khusus role CUSTOMER.
  if (req.user.role !== 'CUSTOMER') {
    return error('Unauthorized for this role', 403)
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
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
