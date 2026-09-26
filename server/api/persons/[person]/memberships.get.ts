import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, params.person),
		columns: {
			id: true,
		},
	})

	if(!person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}

	const membershipsList = await database.query.memberships.findMany({
		where: eq(memberships.memberPerson, params.person),
		with: {
			organizationItem: {
				with: {
					organizationType: true,
				},
				columns: {
					organizationType: false,
					description: false,
					parent: false,
				},
			},
			membershipType: true,
			endReason: true,
		},
		columns: {
			organizationItem: false,
			membershipType: false,
			endReason: false,
			memberType: false,
			memberPerson: false,
			memberOrganizationItem: false,
		},
		orderBy: (memberships, { desc }) => [
			desc(memberships.startDate),
		],
	})

	// Every membership stays behind the permission of the organization item it
	// belongs to, so that this page hands out no more than that item's own member
	// list would. Missing it leaves the membership out instead of refusing the
	// whole list.
	return membershipsList.filter((membership) => hasPermission(
		'memberships.read',
		{ organizationItem: membership.organizationItem.id },
	))
})
