import { z } from 'zod'

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

/**
 * Schema de validación para registro
 */
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
})

/**
 * Schema de validación para invoice
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  qty: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
})

export const invoiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional(),
  client: z.string().min(1, 'El cliente es requerido'),
  clientEmail: z.string().email('Email inválido').nullable().optional(),
  title: z.string().min(1, 'El título es requerido'),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  currency: z.enum(['EUR', 'USD']),
  tax: z.number().min(0).max(100),
  items: z.array(invoiceItemSchema).min(1, 'Debe haber al menos un item'),
  notes: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
})

/**
 * Schema de validación para quote
 */
export const quoteItemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  qty: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
})

export const quoteSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional(),
  client: z.string().min(1, 'El cliente es requerido'),
  clientEmail: z.string().email('Email inválido').nullable().optional(),
  title: z.string().min(1, 'El título es requerido'),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  currency: z.enum(['EUR', 'USD']),
  tax: z.number().min(0).max(100),
  items: z.array(quoteItemSchema).min(1, 'Debe haber al menos un item'),
  notes: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
})


