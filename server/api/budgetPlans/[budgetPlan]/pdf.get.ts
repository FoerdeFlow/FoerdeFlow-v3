import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const result = await $fetch(`/api/budgetPlans/${params.budgetPlan}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const doc = await pdfEncodeBudgetPlan(result)

	const blob = doc.output('blob')
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="Haushaltsplan_${result.budget.code}_${formatDate(result.startDate, 'iso')}.pdf"`,
	)
	return blob
})
