import { success, error, withAuth } from "@/lib/api-utils.mjs"
import { getPppProfiles, addPppProfile, updatePppProfile, deletePppProfile } from "@/lib/mikrotik-service.mjs"

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  try {
    const profiles = await getPppProfiles()
    return success(profiles)
  } catch (e) {
    return error('Failed to fetch profiles: ' + e.message, 500)
  }
})

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const result = await addPppProfile(body)
    return success(result)
  } catch (e) {
    return error('Failed to create profile: ' + e.message, 500)
  }
})

export const PUT = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return error('Profile ID required')
    await updatePppProfile(id, data)
    return success({ message: 'Profile updated' })
  } catch (e) {
    return error('Failed to update profile: ' + e.message, 500)
  }
})

export const DELETE = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return error('Profile ID required')
    await deletePppProfile(id)
    return success({ message: 'Profile deleted' })
  } catch (e) {
    return error('Failed to delete profile: ' + e.message, 500)
  }
})
