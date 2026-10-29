import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { writeFile } from 'node:fs/promises'

const maxSize = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
	const body = await readRawBody(event, false)
	if(!body || body.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Datei ist leer',
		})
	}

	if(body.length > maxSize) {
		throw createError({
			statusCode: 413,
			statusMessage: 'Die Datei ist größer als 10 MB',
		})
	}

	let xml
	try {
		xml = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(body)
	} catch(_error) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Datei ist nicht UTF-8-kodiert',
		})
	}

	const parsed = parseCamt053(xml)

	const database = useDatabase()
	const context = event.context as EventContext

	const imports = await Promise.all(parsed.map(async (statement) => {
		const account = await database.query.bankAccounts.findFirst({
			where: eq(bankAccounts.iban, statement.iban),
			columns: {
				id: true,
				organizationItem: true,
			},
		})

		if(!account) {
			throw createError({
				statusCode: 422,
				statusMessage: `Für die IBAN ${formatIban(statement.iban)} ist kein Bankkonto angelegt`,
				data: {
					iban: statement.iban,
				},
			})
		}

		await checkPermission('bankTransactions.create', { organizationItem: account.organizationItem })

		return { statement, account }
	}))

	return await database.transaction(async (tx) => {
		const statements = []

		for(const { statement, account } of imports) {
			const { transactions, pendingCount, iban: _iban, ...values } = statement

			const [ inserted ] = await tx
				.insert(bankStatements)
				.values({
					...values,
					bankAccount: account.id,
					uploadedBy: context.user?.person?.id ?? null,
				})
				.returning({ id: bankStatements.id })

			if(!inserted) {
				throw createError({
					statusCode: 500,
					statusMessage: 'Kontoauszug konnte nicht gespeichert werden',
				})
			}

			const imported = transactions.length === 0
				? []
				: await tx
					.insert(bankTransactions)
					.values(transactions.map((transaction) => ({
						...transaction,
						bankAccount: account.id,
						statement: inserted.id,
					})))
					.onConflictDoNothing({
						target: [ bankTransactions.bankAccount, bankTransactions.importKey ],
					})
					.returning({ id: bankTransactions.id })

			// Kept as evidence of what the bank reported. Written within the
			// transaction, so that a failure leaves no statement without its file.
			await writeFile(`./data/bankStatement_${inserted.id}.xml`, body)

			statements.push({
				id: inserted.id,
				bankAccount: account.id,
				statementId: statement.statementId,
				imported: imported.length,
				duplicates: transactions.length - imported.length,
				pending: pendingCount,
			})
		}

		return { statements }
	})
})
