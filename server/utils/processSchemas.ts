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
			// A budget plan that is still being applied for has no rows in the
			// database yet, so its item is referenced by the process it is
			// applied for in and its ordinal within that plan.
			pendingBudgetPlanItem: z.strictObject({
				process: z.uuid(),
				ord: z.number().int().positive(),
			}).nullable().optional(),
			items: z.array(z.strictObject({
				ord: z.number().int().positive(),
				title: z.string().min(1),
				amount: z.number().multipleOf(0.01),
				description: z.string().min(1).nullable(),
			})).min(1),
		}).refine((o) => [
			o.budgetPlanItem,
			o.budget,
			o.pendingBudgetPlanItem,
		].filter(Boolean).length === 1),
		update: null,
		delete: null,
	},
	paymentOrders: {
		create: z.strictObject({
			type: z.enum([ 'planned', 'reserve' ]),
			budgetPlanItem: z.uuid().nullable().optional(),
			budget: z.uuid().nullable().optional(),
			// The expense authorization the payment is made on, if there is one.
			expenseAuthorization: z.uuid().nullable().optional(),
			recipientType: z.enum([ 'reimbursement', 'invoice' ]),
			recipientPerson: z.uuid().nullable().optional(),
			recipientName: z.string().min(1).nullable().optional(),
			recipientIban: paymentOrderIbanSchema.nullable().optional(),
			purpose: z.string().min(1).nullable().optional(),
			title: z.string().min(1),
			description: z.string().min(1).nullable(),
			amount: z.number().multipleOf(0.01).positive(),
		}).refine(paymentOrderVariantsValid),
		update: null,
		delete: null,
	},
	longtermContracts: {
		create: z.strictObject({
			budget: z.uuid(),
			title: z.string().min(1),
			description: z.string().min(1).nullable(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().nullable(),
			items: z.array(z.strictObject({
				ord: z.number().int().positive().nullable(),
				type: z.enum([ 'time', 'usage', 'fixed' ]),
				title: z.string().min(1),
				description: z.string().min(1).nullable(),
				amount: z.number().multipleOf(0.01).positive(),
				timeUnit: z.enum([ 'month', 'quarter', 'semester', 'year' ]).nullable(),
				usageUnit: z.string().min(1).nullable(),
				expectedUsage: z.number().multipleOf(0.01).positive().nullable(),
			}).refine((item) => {
				if(item.type === 'time') {
					return item.timeUnit !== null &&
						item.usageUnit === null &&
						item.expectedUsage === null
				}
				if(item.type === 'usage') {
					return item.timeUnit !== null &&
						item.usageUnit !== null &&
						item.expectedUsage !== null
				}
				return item.timeUnit === null &&
					item.usageUnit === null &&
					item.expectedUsage === null
			})).min(1),
		}).refine((o) => o.endDate === null || o.endDate > o.startDate),
		update: null,
		delete: null,
	},
	representationAllowances: {
		create: z.strictObject({
			title: z.string().min(1),
			description: z.string().min(1).nullable(),
			periodUnit: z.enum([ 'month', 'once' ]),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().nullable(),
			recipients: z.array(z.strictObject({
				ord: z.number().int().nonnegative().nullable(),
				person: z.uuid(),
				amount: z.number().multipleOf(0.01).positive(),
			})).min(1),
		})
			.refine((o) => o.periodUnit !== 'once' || o.endDate === null)
			.refine((o) => o.endDate === null || o.endDate > o.startDate)
			.refine((o) => new Set(o.recipients.map((r) => r.person)).size === o.recipients.length),
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
	persons: {
		create: null,
		// Only the data a person may adjust about themselves. Whose data is
		// changed is not part of the input, it follows from the initiator.
		update: z.strictObject({
			callName: z.string().min(1).nullable(),
			pronouns: z.string().min(1).nullable(),
			gender: z.enum([ 'male', 'female', 'non_binary', 'diverse' ]).nullable(),
			matriculationNumber: z.number().int().min(100000).max(9999999).nullable(),
			course: z.uuid().nullable(),
			postalAddress: z.string().min(1).nullable(),
		}),
		delete: null,
	},
	personIbans: {
		create: null,
		// Kept apart from the other data, so that a workflow can have the bank
		// details approved separately. Whose IBAN it is follows from the
		// initiator, just like it does for the other data of a person.
		update: z.strictObject({
			iban: z.string()
				.transform((value) => normalizeIban(value))
				.refine((value) => isValidIban(value), 'Die IBAN ist ungültig')
				.nullable(),
		}),
		delete: null,
	},
	personPhotos: {
		create: null,
		// The photo travels as an attachment, so this mutation carries no data
		// of its own. It is kept apart from the other data of a person, so that
		// a workflow can have the two approved separately.
		update: z.strictObject({}),
		delete: null,
		attachments: [
			'photo',
		],
	},
} as const
