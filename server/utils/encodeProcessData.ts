import type z from 'zod'

import { eq, type InferSelectModel } from 'drizzle-orm'

/**
 * Expands a reference to an item of a budget plan that is still being applied
 * for into the same shape an approved budget plan item is expanded to, so that
 * every consumer can render it without a special case.
 *
 * The title is either part of a plan that is applied for as a whole, and then
 * its plan is applied for along with it, or a supplement adds it to a plan that
 * exists already, and then only the title itself is still being applied for.
 *
 * @param tx - The transaction to read in
 * @param reference - The referenced process and the ordinal within its plan
 * @returns The referenced item or `null` if it cannot be resolved any more
 */
async function encodePendingBudgetPlanItem(
	tx: ReturnType<typeof useDatabase>,
	reference: { process: string, ord: number },
) {
	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, reference.process),
		with: {
			mutation: true,
		},
		columns: {
			data: true,
		},
	})
	const application = mutations.find((item) =>
		(item.mutation.table === 'budgetPlans' && item.mutation.action === 'create') ||
		(item.mutation.table === 'budgetPlanItems' && item.mutation.action === 'update'))
	if(!application) return null

	if(application.mutation.table === 'budgetPlanItems') {
		return await encodePendingBudgetPlanSupplementItem(tx, reference, application.data)
	}

	const parsed = processSchemas.budgetPlans.create.safeParse(application.data)
	if(!parsed.success) return null

	const item = parsed.data.items.find((entry) => entry.ord === reference.ord)
	if(!item) return null

	const budget = await tx.query.budgets.findFirst({
		where: eq(budgets.id, parsed.data.budget),
	})
	if(!budget) return null

	return {
		id: `pending:${reference.process}:${item.ord}`,
		pending: true as const,
		process: reference.process,
		ord: item.ord,
		title: item.title,
		description: item.description,
		revenues: item.revenues ?? null,
		expenses: item.expenses ?? null,
		plan: {
			id: `pending:${reference.process}`,
			pending: true as const,
			process: reference.process,
			startDate: parsed.data.startDate.toISOString().slice(0, 10),
			endDate: parsed.data.endDate.toISOString().slice(0, 10),
			budget,
		},
	}
}

/**
 * Expands a reference to a title that a supplement adds to a budget plan that
 * exists already.
 *
 * Only the title is still being applied for, the plan around it is the one that
 * is in force, so it is reported as it stands.
 *
 * @param tx - The transaction to read in
 * @param reference - The referenced process and the ordinal within the plan
 * @param data - The data of the mutation that applies for the change
 * @returns The referenced item or `null` if it cannot be resolved any more
 */
async function encodePendingBudgetPlanSupplementItem(
	tx: ReturnType<typeof useDatabase>,
	reference: { process: string, ord: number },
	data: unknown,
) {
	const parsed = storedBudgetPlanItemsUpdate.safeParse(data)
	if(!parsed.success) return null

	const item = parsed.data.items.find((entry) => entry.ord === reference.ord)
	// A title the supplement merely changes exists already and is referenced
	// through its own row, so it never stands in for a pending one.
	if(!item || item.id) return null

	const plan = await tx.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, parsed.data.plan),
		with: {
			budget: true,
		},
		columns: {
			budget: false,
		},
	})
	if(!plan) return null

	return {
		id: `pending:${reference.process}:${item.ord}`,
		pending: true as const,
		process: reference.process,
		ord: item.ord,
		title: item.title,
		description: item.description,
		revenues: item.revenues ?? null,
		expenses: item.expenses ?? null,
		plan,
	}
}

/**
 * Expands the person a mutation about own data applies to, so that a reader of
 * the process sees whose data is changed instead of a bare id.
 *
 * @param tx - The transaction to read in
 * @param person - The id of the person
 * @returns The person or `null` if they do not exist any more
 */
async function encodeAffectedPerson(tx: ReturnType<typeof useDatabase>, person: string) {
	return withDisplayName(await tx.query.persons.findFirst({
		where: eq(persons.id, person),
		columns: {
			id: true,
			firstName: true,
			lastName: true,
			callName: true,
			pronouns: true,
		},
	}))
}

const encoders = {
	candidates: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.candidates.create>,
	) => ({
		...model,
		electionCommittee: await tx.query.electionCommittees.findFirst({
			where: eq(electionCommittees.id, model.electionCommittee),
			with: {
				election: true,
				committee: true,
			},
			columns: {
				election: false,
				committee: false,
			},
		}) ?? null,
		candidate: withDisplayName(await tx.query.persons.findFirst({
			where: eq(persons.id, model.candidate),
			columns: {
				course: false,
				pronouns: false,
				matriculationNumber: false,
				postalAddress: false,
				callName: false,
			},
		})),
		course: await tx.query.courses.findFirst({
			where: eq(courses.id, model.course),
			with: {
				type: true,
				council: true,
			},
			columns: {
				type: false,
				council: false,
				department: false,
			},
		}) ?? null,
	}),
	budgetPlans: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.budgetPlans.create>,
	) => ({
		...model,
		budget: await tx.query.budgets.findFirst({
			where: eq(budgets.id, model.budget),
			columns: {
				code: true,
				name: true,
			},
		}) ?? null,
	}),
	budgetPlanItems: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.budgetPlanItems.update> & {
			budget: string
			previous: {
				startDate: string
				endDate: string
				items: Omit<InferSelectModel<typeof budgetPlanItems>, 'plan'>[]
			}
		},
	) => {
		const budget = await tx.query.budgets.findFirst({
			where: eq(budgets.id, model.budget),
			columns: {
				code: true,
				name: true,
			},
		}) ?? null

		return {
			...model,
			budget,
			// The period never changes, and the plan itself may already be gone
			// by the time this is read, so both come from the snapshot.
			plan: {
				id: model.plan,
				startDate: model.previous.startDate,
				endDate: model.previous.endDate,
				budget,
			},
			// Named `title` like every other mutation that carries one, so that
			// the heading of the process and the document a job creates find one.
			title: `Nachtrag zum Haushaltsplan ${formatBudgetPlan(model.previous)}`,
		}
	},
	longtermContracts: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.longtermContracts.create>,
	) => ({
		...model,
		budget: await tx.query.budgets.findFirst({
			where: eq(budgets.id, model.budget),
			columns: {
				code: true,
				name: true,
			},
		}) ?? null,
	}),
	representationAllowances: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.representationAllowances.create> & {
			organizationItem: string
		},
	) => ({
		...model,
		organizationItem: await tx.query.organizationItems.findFirst({
			where: eq(organizationItems.id, model.organizationItem),
			columns: {
				code: true,
				name: true,
			},
		}) ?? null,
		recipients: await Promise.all(model.recipients.map(async (recipient) => ({
			...recipient,
			person: withDisplayName(await tx.query.persons.findFirst({
				where: eq(persons.id, recipient.person),
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					pronouns: true,
				},
			})),
		}))),
	}),
	expenseAuthorizations: async (
		tx: ReturnType<typeof useDatabase>,
		model: InferSelectModel<typeof expenseAuthorizations> & {
			pendingBudgetPlanItem?: { process: string, ord: number } | null
			items: InferSelectModel<typeof expenseAuthorizationItems>[]
		},
	) => ({
		...model,
		budgetPlanItem: model.budgetPlanItem
			? await tx.query.budgetPlanItems.findFirst({
				where: eq(budgetPlanItems.id, model.budgetPlanItem),
				with: {
					plan: {
						with: {
							budget: true,
						},
						columns: {
							budget: false,
						},
					},
				},
				columns: {
					plan: false,
				},
			}) ?? null
			: model.pendingBudgetPlanItem
				? await encodePendingBudgetPlanItem(tx, model.pendingBudgetPlanItem)
				: null,
		budget: model.budget
			? await tx.query.budgets.findFirst({
				where: eq(budgets.id, model.budget),
			}) ?? null
			: null,
	}),
	paymentOrders: async (
		tx: ReturnType<typeof useDatabase>,
		model: InferSelectModel<typeof paymentOrders>,
	) => ({
		...model,
		budgetPlanItem: model.budgetPlanItem
			? await tx.query.budgetPlanItems.findFirst({
				where: eq(budgetPlanItems.id, model.budgetPlanItem),
				with: {
					plan: {
						with: {
							budget: true,
						},
						columns: {
							budget: false,
						},
					},
				},
				columns: {
					plan: false,
				},
			}) ?? null
			: null,
		budget: model.budget
			? await tx.query.budgets.findFirst({
				where: eq(budgets.id, model.budget),
			}) ?? null
			: null,
		expenseAuthorization: model.expenseAuthorization
			? await tx.query.expenseAuthorizations.findFirst({
				where: eq(expenseAuthorizations.id, model.expenseAuthorization),
				columns: {
					id: true,
					type: true,
					title: true,
					amount: true,
				},
			}) ?? null
			: null,
		// The bank details of a member stay out of the process data: everyone
		// who takes part in the process may read it.
		recipientPerson: model.recipientPerson
			? await encodeAffectedPerson(tx, model.recipientPerson)
			: null,
	}),
	persons: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.persons.update> & { person: string },
	) => ({
		...model,
		person: await encodeAffectedPerson(tx, model.person),
		course: model.course
			? await tx.query.courses.findFirst({
				where: eq(courses.id, model.course),
				with: {
					type: true,
					council: true,
				},
				columns: {
					type: false,
					council: false,
					department: false,
				},
			}) ?? null
			: null,
	}),
	personIbans: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.personIbans.update> & { person: string },
	) => ({
		...model,
		person: await encodeAffectedPerson(tx, model.person),
	}),
	personPhotos: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.personPhotos.update> & { person: string },
	) => ({
		...model,
		person: await encodeAffectedPerson(tx, model.person),
	}),
} as const

export async function encodeProcessData<
	T extends keyof typeof encoders,
>(
	tx: ReturnType<typeof useDatabase>,
	table: T,
	model: Parameters<typeof encoders[T]>[1],
): Promise<Awaited<ReturnType<typeof encoders[T]>>> {
	// @ts-expect-error - We ensure the type safety through the function signature
	return await encoders[table](tx, model)
}
