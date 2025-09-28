import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rolePermissions.read')

	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		role: z.uuid(),
	}).parseAsync(data))

	const rolePermissions = await database.query.rolePermissions.findMany({
		where: (rolePermissions, { eq }) => eq(rolePermissions.role, query.role),
	})

	return rolePermissions
})
