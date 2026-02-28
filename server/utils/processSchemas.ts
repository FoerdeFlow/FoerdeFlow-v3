import z from 'zod'

export const processSchemas = {
	candidates: {
		create: z.strictObject({
			electionCommittee: z.uuid(),
			candidate: z.uuid(),
			matriculationNumber: z.number().int().min(100000).max(9999999),
			course: z.uuid(),
			postalAddress: z.string().min(1),
			callName: z.string().min(1).nullable(),
			pronouns: z.string().min(1).nullable(),
			applicationLetter: z.string().min(1).nullable(),
		}),
		update: null,
		delete: null,
	},
} as const