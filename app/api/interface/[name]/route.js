import { success } from "@/lib/api-utils.mjs"
import { getInterface } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const { name } = await params
  return success(getInterface(name))
}
