import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { getQueues, addQueue, updateQueue, deleteQueue } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  try {
    const queues = await getQueues()
    return success(queues)
  } catch (e) {
    return error('Failed to fetch queues: ' + e.message, 500)
  }
})

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const result = await addQueue(body)
    return success(result)
  } catch (e) {
    return error('Failed to create queue: ' + e.message, 500)
  }
})

export const PUT = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return error('Queue ID required')
    await updateQueue(id, data)
    return success({ message: 'Queue updated' })
  } catch (e) {
    return error('Failed to update queue: ' + e.message, 500)
  }
})

export const DELETE = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return error('Queue ID required')
    await deleteQueue(id)
    return success({ message: 'Queue deleted' })
  } catch (e) {
    return error('Failed to delete queue: ' + e.message, 500)
  }
})
