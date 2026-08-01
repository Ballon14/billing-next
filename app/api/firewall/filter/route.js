import { success, error, withAuth, getBody } from "@/lib/api-utils.mjs"
import { getFirewallFilter, addFirewallFilter, updateFirewallFilter, deleteFirewallFilter } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export async function GET() {
  return success(getFirewallFilter())
}


export const POST = withAuth(async (req) => {
  const body = await getBody(req)
  await addFirewallFilter(body)
  return success({ message: 'Filter rule created' })
})
