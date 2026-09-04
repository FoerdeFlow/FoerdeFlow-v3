import type { RepresentationAllowanceFormModel } from '~/types'

/**
 * Checks the amounts of an aufwandsentschädigung against the limits its
 * mutation defines.
 *
 * @param model - The model of the form
 * @param meta - The meta data of the mutation, holding the limits
 * @returns The limits, the requested total and the exceedings
 */
export function representationAllowanceLimits(
	model: RepresentationAllowanceFormModel,
	meta: unknown,
) {
	const limits = model.periodUnit === 'once'
		? {
			perPerson: metaAmount(meta, 'maximumSingleAmountPerPerson'),
			total: metaAmount(meta, 'maximumSingleAmountTotal'),
		}
		: {
			perPerson: metaAmount(meta, 'maximumMonthlyAmountPerPerson'),
			total: metaAmount(meta, 'maximumMonthlyAmountTotal'),
		}

	const total = model.recipients
		.reduce((sum, recipient) => sum + (recipient.amount || 0), 0)

	const perPersonLimit = limits.perPerson
	const recipientsAboveLimit = perPersonLimit === null
		? []
		: model.recipients.filter((recipient) => recipient.amount > perPersonLimit)

	const totalAboveLimit = limits.total !== null && total > limits.total

	return {
		limits,
		total,
		recipientsAboveLimit,
		totalAboveLimit,
		violated: recipientsAboveLimit.length > 0 || totalAboveLimit,
	}
}
