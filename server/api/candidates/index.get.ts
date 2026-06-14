import { existsSync } from 'node:fs'
import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		electionProposal: z.uuid(),
		includePersonDetails: z.boolean().default(false),
	}).parseAsync(data))

	if(query.includePersonDetails) {
		await checkPermission('personDetails.read')
	}

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
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
					...(query.includePersonDetails
						? {
							matriculationNumber: true,
							postalAddress: true,
						}
						: {}),
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
			matriculationNumber: null as number | null,
			postalAddress: null as string | null,
			...candidate.candidate,
			hasPhoto: existsSync(`./data/${candidate.candidate.id}`),
		},
	}))
})
