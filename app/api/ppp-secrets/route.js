import { success, error, withAuth, camelCaseKeys } from "@/lib/api-utils.mjs"
import { getPppSecrets, addPppSecret } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  try {
    const secrets = await getPppSecrets()
    return success(camelCaseKeys(secrets))
  } catch (e) {
    return error(e.message, 500)
  }
})

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const result = await addPppSecret(body)
    return success(result)
  } catch (e) {
    return error(e.message, 500)
  }
})
