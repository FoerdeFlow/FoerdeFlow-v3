import { existsSync } from 'node:fs'
import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		electionProposal: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const candidates = await database.query.candidates.findMany({
		where: (candidates, { eq }) => eq(candidates.electionProposal, query.electionProposal),
		with: {
			candidate: {
				with: {
					course: {
						with: {
							type: true,
							council: true,
						},
						columns: {
							type: false,
							council: false,
						},
					},
				},
				columns: {
					course: false,
				},
			},
		},
		columns: {
			electionProposal: false,
			candidate: false,
		},
	})

	return candidates.map((candidate) => ({
		...candidate,
		candidate: {
			...candidate.candidate,
			hasPhoto: existsSync(`./data/${candidate.candidate.id}`),
		},
	}))
})
