import { success, withAuth, camelCaseKeys } from "@/lib/api-utils.mjs"
import { getSystemResource } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  return success(camelCaseKeys(getSystemResource() || {}))
})
