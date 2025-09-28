import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('permissions.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		filter: z.enum([ 'all', 'assignable' ]).default('all'),
	}).parseAsync(data))

	const permissions = availablePermissions.map((permission) => ({
		permission,
		assignable: !permission.startsWith('role'),
	}))

	if(query.filter === 'assignable') {
		return permissions.filter((permission) => permission.assignable)
	}

	return permissions
})
