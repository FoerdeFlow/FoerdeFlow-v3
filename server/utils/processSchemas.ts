import z from 'zod'

export const processSchemas = {
	budgetPlans: {
		create: z.strictObject({
			budget: z.uuid(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
			items: z.array(z.strictObject({
				ord: z.number().int().positive(),
				title: z.string().min(1),
				revenues: z.number().multipleOf(0.01).nonnegative().optional(),
				expenses: z.number().multipleOf(0.01).nonnegative().optional(),
				description: z.string().min(1).nullable(),
			})).min(1),
		}),
		update: null,
		delete: null,
	},
	expenseAuthorizations: {
		create: z.strictObject({
			title: z.string().min(1),
			amount: z.number().multipleOf(0.01).positive(),
			description: z.string().min(1).nullable(),
			budgetPlanItem: z.uuid().nullable().optional(),
			budget: z.uuid().nullable().optional(),
			items: z.array(z.strictObject({
				ord: z.number().int().positive(),
				title: z.string().min(1),
				amount: z.number().multipleOf(0.01),
				description: z.string().min(1).nullable(),
			})).min(1),
		}).refine((o) => Boolean(o.budgetPlanItem) !== Boolean(o.budget)),
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
