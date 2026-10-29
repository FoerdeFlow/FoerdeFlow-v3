export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await bankAccountSchema.parseAsync(data))

	await checkPermission('bankAccounts.create', { organizationItem: body.organizationItem })

	const database = useDatabase()

	const [ result = null ] = await database
		.insert(bankAccounts)
		.values(body)
		.returning({ id: bankAccounts.id })

	if(result === null) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Bankkonto konnte nicht erstellt werden',
		})
	}

	return result
})
