import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		paymentOrder: idSchema,
	}).parseAsync(data))

	const result = await $fetch(`/api/paymentOrders/${params.paymentOrder}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const doc = await pdfEncodePaymentOrder(result)

	const blob = doc.output('blob')
	let filename = 'Zahlungsanweisung.pdf'
	if(result.budgetPlanItem) {
		filename = [
			'Zahlungsanweisung',
			result.budgetPlanItem.plan.budget.code,
			formatDate(result.budgetPlanItem.plan.startDate, 'iso'),
			result.title.replace(/[^a-z0-9]/gi, '-'),
		].join('_') + '.pdf'
	} else if(result.budget) {
		filename = [
			'Zahlungsanweisung',
			result.budget.code,
			result.title.replace(/[^a-z0-9]/gi, '-'),
		].join('_') + '.pdf'
	}
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="${filename}"`,
	)
	return blob
})
