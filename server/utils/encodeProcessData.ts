import type z from 'zod'

import { eq, type InferSelectModel } from 'drizzle-orm'

/**
 * Expands a reference to an item of a budget plan that is still being applied
 * for into the same shape an approved budget plan item is expanded to, so that
 * every consumer can render it without a special case.
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
	const plan = mutations.find((item) =>
		item.mutation.table === 'budgetPlans' && item.mutation.action === 'create')
	if(!plan) return null

	const parsed = processSchemas.budgetPlans.create.safeParse(plan.data)
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
 * Expands the person a mutation about own data applies to, so that a reader of
 * the process sees whose data is changed instead of a bare id.
 *
 * @param tx - The transaction to read in
 * @param person - The id of the person
 * @returns The person or `null` if they do not exist any more
 */
async function encodeAffectedPerson(tx: ReturnType<typeof useDatabase>, person: string) {
	return await tx.query.persons.findFirst({
		where: eq(persons.id, person),
		columns: {
			id: true,
			firstName: true,
			lastName: true,
			callName: true,
			pronouns: true,
		},
	}) ?? null
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
		candidate: await tx.query.persons.findFirst({
			where: eq(persons.id, model.candidate),
			columns: {
				course: false,
				pronouns: false,
				matriculationNumber: false,
				postalAddress: false,
				callName: false,
			},
		}) ?? null,
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
			person: await tx.query.persons.findFirst({
				where: eq(persons.id, recipient.person),
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					pronouns: true,
				},
			}) ?? null,
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
