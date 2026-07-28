import { success, withAuth, camelCaseKeys } from "@/lib/api-utils.mjs"
import { getSystemResource, getSystemIdentity } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  const resource = camelCaseKeys(getSystemResource())
  const identity = camelCaseKeys(getSystemIdentity())
  return success({ ...resource, ...identity })
})
