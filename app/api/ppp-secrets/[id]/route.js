import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { updatePppSecret, deletePppSecret } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const PUT = withAuth(async (req, { params }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const result = await updatePppSecret(id, body)
    return success(result)
  } catch (e) {
    return error(e.message, 500)
  }
})

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params
    await deletePppSecret(id)
    return success({ deleted: true })
  } catch (e) {
    return error(e.message, 500)
  }
})
