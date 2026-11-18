import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { writeFile } from 'node:fs/promises'

const maxSize = 10 * 1024 * 1024

const zipLimits = {
	maxEntrySize: maxSize,
	maxTotalSize: 100 * 1024 * 1024,
	maxEntries: 500,
}

interface UploadedFile {
	// Empty for a single XML file
	name: string | null
	content: Buffer
}

// Files an archiving tool adds next to the actual content, for example the
// resource forks of macOS.
function isAuxiliary(name: string) {
	return name.startsWith('__MACOSX/') || name.split('/').at(-1)?.startsWith('.')
}

function unpack(body: Buffer): UploadedFile[] {
	if(!isZip(body)) {
		return [ { name: null, content: body } ]
	}

	const files = readZip(body, zipLimits)
		.filter((entry) => !isAuxiliary(entry.name) && entry.name.toLowerCase().endsWith('.xml'))

	if(files.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die ZIP-Datei enthält keine XML-Dateien',
		})
	}

	return files
}

// Names the file in the message of an error, so that the faulty one within a
// ZIP archive can be found.
async function withFileName<T>(file: UploadedFile, action: () => Promise<T> | T): Promise<T> {
	try {
		return await action()
	} catch(error) {
		if(file.name && isError(error)) {
			throw createError({
				statusCode: error.statusCode,
				statusMessage: `${file.name}: ${error.statusMessage}`,
				data: error.data,
			})
		}
		throw error
	}
}

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

	const files = unpack(body)

	const parsed = await Promise.all(files.map((file) => withFileName(file, () => {
		let xml
		try {
			xml = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(file.content)
		} catch(_error) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Die Datei ist nicht UTF-8-kodiert',
			})
		}

		return parseCamt053(xml).map((statement) => ({ file, statement }))
	})))

	const database = useDatabase()
	const context = event.context as EventContext

	const imports = await Promise.all(parsed.flat().map(({ file, statement }) => withFileName(file, async () => {
		const account = await database.query.bankAccounts.findFirst({
			where: eq(bankAccounts.iban, statement.iban),
			columns: {
				id: true,
				name: true,
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

		return { file, statement, account }
	})))

	return await database.transaction(async (tx) => {
		const statements = []

		for(const { file, statement, account } of imports) {
			const { transactions, pendingCount, iban: _iban, ...values } = statement

			const result = {
				file: file.name,
				bankAccount: account.id,
				bankAccountName: account.name,
				statementId: statement.statementId,
			}

			// Exports of overlapping periods contain the same statement again,
			// as do archives uploaded a second time.
			const [ inserted ] = await tx
				.insert(bankStatements)
				.values({
					...values,
					bankAccount: account.id,
					uploadedBy: context.user?.person?.id ?? null,
				})
				.onConflictDoNothing({
					target: [ bankStatements.bankAccount, bankStatements.statementId ],
				})
				.returning({ id: bankStatements.id })

			if(!inserted) {
				statements.push({
					...result,
					id: null,
					skipped: true,
					imported: 0,
					duplicates: 0,
					pending: 0,
				})
				continue
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
			await writeFile(`./data/bankStatement_${inserted.id}.xml`, file.content)

			statements.push({
				...result,
				id: inserted.id,
				skipped: false,
				imported: imported.length,
				duplicates: transactions.length - imported.length,
				pending: pendingCount,
			})
		}

		return { statements }
	})
})
