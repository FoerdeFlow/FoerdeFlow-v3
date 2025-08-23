import z from 'zod'

type InferT<T> = T extends (infer U)[] ? U : never

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.string().uuid(),
	}).parseAsync(data))

	const memberships = await database.query.memberships.findMany({
		where: (memberships, { eq }) => eq(memberships.organizationItem, query.organizationItem),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: true,
			memberOrganizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return memberships as (InferT<typeof memberships> & (
		{
			memberType: 'person'
			memberPerson: Exclude<(InferT<typeof memberships>)['memberPerson'], null>
			memberOrganizationItem: null
		} | {
			memberType: 'organization_item'
			memberPerson: null
			memberOrganizationItem: Exclude<(InferT<typeof memberships>)['memberOrganizationItem'], null>
		}
	))[]
})
