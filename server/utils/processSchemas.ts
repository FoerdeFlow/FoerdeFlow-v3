import z from 'zod'

export const processSchemas = {
	expenseAuthorizations: {
		create: z.strictObject({
			title: z.string().min(1),
			amount: z.number().multipleOf(0.01).positive(),
			description: z.string().min(1).nullable(),
			budgetPlanItem: z.uuid(),
			items: z.array(z.strictObject({
				ord: z.number().int().positive(),
				title: z.string().min(1),
				amount: z.number().multipleOf(0.01),
				description: z.string().min(1).nullable(),
			})).min(1),
		}),
		update: null,
		delete: null,
	},
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
		attachments: [
			'photo',
		],
	},
} as const