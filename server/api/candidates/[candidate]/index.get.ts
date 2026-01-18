import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		candidate: idSchema,
	}).parseAsync(data))

	const candidate = await database.query.candidates.findFirst({
		where: eq(candidates.id, params.candidate),
		with: {
			candidate: {
				with: {
					course: {
						with: {
							type: true,
						},
						columns: {
							type: false,
						},
					},
				},
				columns: {
					course: false,
				},
			},
		},
		columns: {
			id: false,
			electionProposal: false,
			candidate: false,
		},
	})

	if(!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kandidat*in nicht gefunden',
			data: {
				candidateId: params.candidate,
			},
		})
	}

	return {
		...candidate,
		candidate: {
			...candidate.candidate,
			hasPhoto: existsSync(`./data/${candidate.candidate.id}`),
		},
	}
})
