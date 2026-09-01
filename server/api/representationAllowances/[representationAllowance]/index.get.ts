import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		representationAllowance: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const representationAllowance = await database.query.representationAllowances.findFirst({
		where: eq(representationAllowances.id, params.representationAllowance),
		with: {
			organizationItem: {
				columns: {
					id: true,
					code: true,
					name: true,
				},
			},
			recipients: {
				with: {
					person: {
						with: {
							course: true,
						},
						columns: {
							id: true,
							email: true,
							firstName: true,
							lastName: true,
							callName: true,
							gender: true,
							pronouns: true,
						},
					},
				},
				columns: {
					representationAllowance: false,
					person: false,
				},
				orderBy: (recipients, { asc }) => [ asc(recipients.ord) ],
			},
		},
	})

	await checkPermission(
		'representationAllowances.read',
		{ organizationItem: representationAllowance?.organizationItem.id },
	)

	if(!representationAllowance) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Aufwandsentschädigung nicht gefunden',
			data: {
				representationAllowanceId: params.representationAllowance,
			},
		})
	}

	return {
		...representationAllowance,
		recipients: representationAllowance.recipients.map((recipient) => ({
			...recipient,
			person: {
				...recipient.person,
				hasPhoto: existsSync(`./data/${recipient.person.id}`),
			},
		})),
	}
})
