import type z from 'zod'

import { eq } from 'drizzle-orm'

interface MutationContext {
	initiatorType: 'person' | 'organizationItem'
	initiatorPerson: string | null
	initiatorOrganizationItem: string | null
	meta: unknown
}

/**
 * Returns the person a mutation about own data applies to.
 *
 * Own data may only ever be changed by the person themselves, so the person is
 * taken from the initiator instead of from the input. A process that was
 * started for an organization item can therefore not carry such a mutation.
 *
 * @param context - The context of the mutation
 * @returns The id of the person whose data is changed
 */
function requireInitiatorPerson(context: MutationContext) {
	if(context.initiatorType !== 'person' || !context.initiatorPerson) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die eigenen Daten können nur von der Person selbst geändert werden',
		})
	}

	return context.initiatorPerson
}

/**
 * Reads the budget of the plan a process applies for, so that a reference to
 * one of its titles can be checked against the origin of the applicant.
 *
 * A plan is either applied for as a whole or changed through a supplement, and
 * both carry their titles in the data of a single mutation. A title the
 * supplement merely changes exists already and is referenced directly, so only
 * the titles it adds can be referred to as applied for.
 *
 * @param tx - The transaction to read in
 * @param processId - The process the plan is applied for in
 * @param ord - The ordinal of the referenced title within that plan
 * @returns The id of the budget the plan belongs to
 * @throws When the process applies for no such title
 */
async function referencedPendingBudget(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
	ord: number,
) {
	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, processId),
		with: {
			mutation: true,
		},
		columns: {
			data: true,
		},
	})
	const applications = mutations.filter((item) =>
		(item.mutation.table === 'budgetPlans' && item.mutation.action === 'create') ||
		(item.mutation.table === 'budgetPlanItems' && item.mutation.action === 'update'))

	const [ application ] = applications
	if(applications.length !== 1 || !application) {
		throw createError({
			statusCode: 400,
			message: 'Der referenzierte Prozess beantragt oder ändert nicht genau einen ' +
				'Haushaltsplan',
		})
	}

	const missing = createError({
		statusCode: 400,
		message: 'Der referenzierte Haushaltstitel kommt im beantragten Haushaltsplan nicht vor',
	})

	if(application.mutation.table === 'budgetPlans') {
		const parsed = processSchemas.budgetPlans.create.safeParse(application.data)
		if(!parsed.success || !parsed.data.items.some((item) => item.ord === ord)) throw missing
		return parsed.data.budget
	}

	const parsed = storedBudgetPlanItemsUpdate.safeParse(application.data)
	if(!parsed.success) throw missing

	const item = parsed.data.items.find((entry) => entry.ord === ord)
	if(!item) throw missing
	if(item.id) {
		throw createError({
			statusCode: 400,
			message: 'Der referenzierte Haushaltstitel besteht bereits und ist unmittelbar ' +
				'auszuwählen',
		})
	}

	const plan = await tx.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, parsed.data.plan),
		columns: {
			budget: true,
		},
	})
	if(!plan) {
		throw createError({
			statusCode: 400,
			message: 'Der Haushaltsplan, der durch den referenzierten Prozess geändert wird, ' +
				'wurde nicht gefunden',
		})
	}

	return plan.budget
}

export const processValidators = {
	budgetPlans: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.budgetPlans.create>,
		context: MutationContext,
	) => {
		await checkBudgetOrigin(tx, data, context)
		return data
	},
	budgetPlanItems: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.budgetPlanItems.update>,
		context: MutationContext,
	) => {
		const plan = await tx.query.budgetPlans.findFirst({
			where: eq(budgetPlans.id, data.plan),
			with: {
				items: {
					columns: {
						plan: false,
					},
					orderBy: (items, { asc }) => [ asc(items.ord) ],
				},
			},
		})
		if(!plan) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Der zu ändernde Haushaltsplan wurde nicht gefunden',
				data: { budgetPlanId: data.plan },
			})
		}

		// The plan stands in for its budget, so that a workflow which ties the
		// mutation to the initiator keeps doing so.
		await checkBudgetOrigin(tx, { budget: plan.budget }, context)

		const known = new Set(plan.items.map((item) => item.id))
		const foreign = data.items.find((item) => item.id && !known.has(item.id))
		if(foreign) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Ein geänderter Haushaltstitel gehört nicht zu diesem Haushaltsplan',
				data: { budgetPlanItemId: foreign.id },
			})
		}

		// Reported here as well as when the change is applied, so that the
		// regular case is caught while the application is still being written.
		await checkBudgetPlanItemsDroppable(tx, plan.items, data.items)

		return {
			...data,
			budget: plan.budget,
			// The titles as they stand now travel with the application, so that
			// the motion text keeps showing what was changed even after the
			// change was applied and a dropped title no longer exists.
			previous: {
				startDate: plan.startDate,
				endDate: plan.endDate,
				items: plan.items,
			},
		}
	},
	expenseAuthorizations: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.expenseAuthorizations.create>,
		context: MutationContext,
	) => {
		await checkBudgetOrigin(tx, data, context)

		const reference = data.pendingBudgetPlanItem
		if(!reference) return data

		// Probing foreign process ids must not be possible, so the reference is
		// only accepted if the applicant may see the process it points at.
		await checkProcessPermissionTx(tx, reference.process)

		const referenced = await tx.query.workflowProcesses.findFirst({
			where: eq(workflowProcesses.id, reference.process),
			columns: {
				status: true,
			},
		})
		if(referenced?.status === 'failed') {
			throw createError({
				statusCode: 400,
				message: 'Der Antrag auf Genehmigung des referenzierten Haushaltsplans ' +
					'wurde abgelehnt',
			})
		}

		// The title is not in the database yet, so the budget of the plan it is
		// applied for stands in for the title the authorization will later
		// point at.
		const budget = await referencedPendingBudget(tx, reference.process, reference.ord)
		await checkBudgetOrigin(tx, { budget }, context)

		return data
	},
	paymentOrders: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.paymentOrders.create>,
		context: MutationContext,
	) => {
		await checkBudgetOrigin(tx, data, context)
		await checkPaymentOrderOrigin(tx, data)
		return data
	},
	longtermContracts: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.longtermContracts.create>,
		context: MutationContext,
	) => {
		await checkBudgetOrigin(tx, data, context)
		return data
	},
	representationAllowances: (
		_tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.representationAllowances.create>,
		context: MutationContext,
	) => {
		if(context.initiatorType !== 'organizationItem' || !context.initiatorOrganizationItem) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Eine Aufwandsentschädigung kann nur von einer ' +
					'Organisationseinheit beantragt werden',
			})
		}

		const monthly = data.periodUnit === 'month'
		const maximumPerPerson = metaAmount(context.meta, monthly
			? 'maximumMonthlyAmountPerPerson'
			: 'maximumSingleAmountPerPerson')
		const maximumTotal = metaAmount(context.meta, monthly
			? 'maximumMonthlyAmountTotal'
			: 'maximumSingleAmountTotal')

		if(maximumPerPerson !== null) {
			const exceeding = data.recipients.find((recipient) => recipient.amount > maximumPerPerson)
			if(exceeding) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Der Höchstbetrag je Person wird überschritten',
					data: { maximumPerPerson, amount: exceeding.amount },
				})
			}
		}

		if(maximumTotal !== null) {
			const requested = data.recipients.reduce((sum, recipient) => sum + recipient.amount, 0)
			if(requested > maximumTotal) {
				throw createError({
					statusCode: 403,
					statusMessage: monthly
						? 'Der monatliche Höchstbetrag der Organisationseinheit wird ' +
							'überschritten'
						: 'Der einmalige Höchstbetrag der Organisationseinheit wird ' +
							'überschritten',
					data: { maximumTotal, amount: requested },
				})
			}
		}

		return { ...data, organizationItem: context.initiatorOrganizationItem }
	},
	persons: (
		_tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.persons.update>,
		context: MutationContext,
	) => ({ ...data, person: requireInitiatorPerson(context) }),
	personIbans: (
		_tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.personIbans.update>,
		context: MutationContext,
	) => ({ ...data, person: requireInitiatorPerson(context) }),
	personPhotos: (
		_tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.personPhotos.update>,
		context: MutationContext,
	) => ({ ...data, person: requireInitiatorPerson(context) }),
} as const
