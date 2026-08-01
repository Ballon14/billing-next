import { success, error, withAuth, getBody } from "@/lib/api-utils.mjs"
import { getFirewallNat, addFirewallNat, updateFirewallNat, deleteFirewallNat } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export async function GET() {
  return success(getFirewallNat())
}


export const POST = withAuth(async (req) => {
  const body = await getBody(req)
  await addFirewallNat(body)
  return success({ message: 'NAT rule created' })
})
