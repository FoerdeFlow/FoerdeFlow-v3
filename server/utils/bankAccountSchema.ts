import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const bankAccountSchema = createInsertSchema(bankAccounts, {
	name: (schema) => schema.trim().min(1),
	iban: () => z.string()
		.transform((value) => normalizeIban(value))
		.refine((value) => isValidIban(value), 'Die IBAN ist ungültig'),
}).omit({ id: true })
