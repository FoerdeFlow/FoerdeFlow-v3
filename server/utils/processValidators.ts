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

export const processValidators = {
	expenseAuthorizations: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.expenseAuthorizations.create>,
		_context: MutationContext,
	) => {
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

		const mutations = await tx.query.workflowProcessMutations.findMany({
			where: eq(workflowProcessMutations.process, reference.process),
			with: {
				mutation: true,
			},
			columns: {
				data: true,
			},
		})
		const plans = mutations.filter((item) =>
			item.mutation.table === 'budgetPlans' && item.mutation.action === 'create')

		const [ plan ] = plans
		if(plans.length !== 1 || !plan) {
			throw createError({
				statusCode: 400,
				message: 'Der referenzierte Prozess beantragt nicht genau einen Haushaltsplan',
			})
		}

		const parsed = processSchemas.budgetPlans.create.safeParse(plan.data)
		if(!parsed.success || !parsed.data.items.some((item) => item.ord === reference.ord)) {
			throw createError({
				statusCode: 400,
				message: 'Der referenzierte Haushaltstitel kommt im beantragten Haushaltsplan ' +
					'nicht vor',
			})
		}

		return data
	},
	paymentOrders: async (
		tx: ReturnType<typeof useDatabase>,
		data: z.infer<typeof processSchemas.paymentOrders.create>,
		_context: MutationContext,
	) => {
		await checkPaymentOrderOrigin(tx, data)
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
