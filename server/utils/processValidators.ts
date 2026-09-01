import type z from 'zod'

interface MutationContext {
	initiatorType: 'person' | 'organizationItem'
	initiatorOrganizationItem: string | null
	meta: unknown
}

export const processValidators = {
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
} as const
