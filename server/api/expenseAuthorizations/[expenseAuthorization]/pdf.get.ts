import { z } from 'zod'
import { jsPDF } from 'jspdf'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		expenseAuthorization: idSchema,
	}).parseAsync(data))

	const result = await $fetch(`/api/expenseAuthorizations/${params.expenseAuthorization}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const doc = await pdfEncodeExpenseAuthorization(result)

	const blob = doc.output('blob')
	const filename = [
		'Einzelausgabe',
		result.budgetPlanItem.plan.budget.code,
		formatDate(result.budgetPlanItem.plan.startDate, 'iso'),
		result.title.replace(/[^a-z0-9]/gi, '-'),
	].join('_') + '.pdf'
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="${filename}"`,
	)
	return blob
})
