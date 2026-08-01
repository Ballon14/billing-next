import { z } from 'zod'
import { error } from './api-utils.mjs'

export function validate(schema) {
  return function (handler) {
    return async (req, ...args) => {
      try {
        const body = await req.json()
        const parsed = schema.parse(body)
        req.validated = parsed
        return await handler(req, ...args)
      } catch (e) {
        if (e instanceof z.ZodError) {
          const messages = e.errors.map(err => `${err.path.join('.')}: ${err.message}`)
          return error(messages.join('; '), 422)
        }
        return error('Invalid request body', 400)
      }
    }
  }
}

export function validatePartial(schema) {
  return function (handler) {
    return async (req, ...args) => {
      try {
        const body = await req.json()
        const parsed = schema.partial().parse(body)
        req.validated = parsed
        return await handler(req, ...args)
      } catch (e) {
        if (e instanceof z.ZodError) {
          const messages = e.errors.map(err => `${err.path.join('.')}: ${err.message}`)
          return error(messages.join('; '), 422)
        }
        return error('Invalid request body', 400)
      }
    }
  }
}

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nik: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  pppoe_username: z.string().min(3, 'PPPoE username min 3 characters').max(64),
  pppoe_password: z.string().min(1, 'PPPoE password is required').max(64),
  package_id: z.union([z.number(), z.string()]).transform(v => Number(v)),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated', 'isolated']).optional().default('inactive'),
})

export const packageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.union([z.number(), z.string()]).transform(v => Number(v)),
  speed: z.string().optional().nullable(),
  profile_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  billing_period: z.enum(['monthly', 'weekly', 'quarterly', 'yearly']).optional().default('monthly'),
})
export const invoiceSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).transform(v => Number(v)),
  amount: z.union([z.number(), z.string()]).transform(v => Number(v)),
  due_date: z.string().min(1, 'Due date is required'),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  status: z.enum(['unpaid', 'paid', 'overdue', 'cancelled']).optional().default('unpaid'),
})

export const paymentSchema = z.object({
  invoice_id: z.union([z.number(), z.string()]).transform(v => Number(v)),
  amount: z.union([z.number(), z.string()]).transform(v => Number(v)),
  payment_method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const pppoeAccountSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).transform(v => Number(v)),
  username: z.string().min(3, 'Username min 3 characters').max(64),
  password: z.string().min(1, 'Password is required').max(64),
  profile: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  service: z.enum(['pppoe', 'pptp', 'l2tp', 'ovpn']).optional().default('pppoe'),
  disabled: z.boolean().optional().default(false),
})
