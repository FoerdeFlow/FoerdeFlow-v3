import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		longtermContract: idSchema,
	}).parseAsync(data))

	const result = await $fetch(`/api/longtermContracts/${params.longtermContract}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const doc = await pdfEncodeLongtermContract(result)

	const blob = doc.output('blob')
	const filename = [
		'Langzeitvertrag',
		result.budget.code,
		result.title.replace(/[^a-z0-9]/gi, '-'),
	].filter(Boolean).join('_') + '.pdf'
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="${filename}"`,
	)
	return blob
})
