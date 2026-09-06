import { z } from 'zod'

export const idSchema = z.uuid()

export const signatureLinesSchema = z.array(z.strictObject({
	label: z.string().min(1).max(256),
	hint: z.string().max(256).nullable(),
})).min(1)
