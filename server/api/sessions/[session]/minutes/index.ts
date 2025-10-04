import { z } from 'zod'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	if(![ 'HEAD', 'GET' ].includes(event.method)) {
		setResponseStatus(event, 405)
		return
	}

	const runtimeConfig = useRuntimeConfig()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const data = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	await checkPermission('minutes.read', { organizationItem: data?.organizationItem.id })

	if(!data) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}

	const url = runtimeConfig.minutes.url
		.replaceAll('__PERIOD__', formatSessionNumber(data.period, data.number).split('-')[0])
		.replaceAll('__ITEM__', data.organizationItem.code)
		.replaceAll('__QNUMBER__', formatSessionNumber(data.period, data.number))

	if(event.method === 'HEAD') {
		try {
			await $fetch(url, { method: 'HEAD' })
			setResponseStatus(event, 200)
		} catch(_e: unknown) {
			setResponseStatus(event, 404)
		}
		return
	}

	await sendRedirect(event, url, 307)
})
