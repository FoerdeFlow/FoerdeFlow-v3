import { eq } from 'drizzle-orm'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankStatement: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const statement = await database.query.bankStatements.findFirst({
		where: eq(bankStatements.id, params.bankStatement),
		columns: {
			bankAccount: true,
			statementId: true,
		},
	})

	if(!statement) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kontoauszug nicht gefunden',
			data: {
				bankStatementId: params.bankStatement,
			},
		})
	}

	await checkPermission('bankTransactions.read', {
		organizationItem: await getBankAccountScope(database, statement.bankAccount),
	})

	try {
		const content = await readFile(`./data/bankStatement_${params.bankStatement}.xml`)
		setResponseHeader(event, 'Content-Type', 'application/xml')
		setResponseHeader(
			event,
			'Content-Disposition',
			`attachment; filename="Kontoauszug_${statement.statementId.replaceAll(/[^\w.-]/g, '_')}.xml"`,
		)
		return content
	} catch(_error) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Datei des Kontoauszugs nicht gefunden',
		})
	}
})
