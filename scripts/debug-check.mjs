import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

try {
  const customers = await prisma.customer.findMany()
  console.log('Customers:', customers.length)
  
  const accounts = await prisma.pppoeAccount.findMany()
  console.log('PPPoE Accounts:', accounts.length)
  
  // Check for duplicate usernames
  const usernames = customers.map(c => c.pppoeUsername)
  const dupes = usernames.filter((u, i) => usernames.indexOf(u) !== i)
  if (dupes.length) console.log('Duplicate PPPoE usernames in customers:', dupes)

  const accountUsernames = accounts.map(a => a.username)
  console.log('Account usernames:', accountUsernames)
} catch (e) {
  console.error('Error:', e.message)
} finally {
  await prisma.$disconnect()
}
