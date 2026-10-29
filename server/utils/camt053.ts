import { XMLParser } from 'fast-xml-parser'
import { createHash } from 'node:crypto'
import { z } from 'zod'

export const camt053Namespace = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02'

export interface ParsedBankTransaction {
	importKey: string
	bookingDate: string
	valueDate: string | null
	direction: 'credit' | 'debit'
	amount: number
	reversal: boolean
	counterpartyName: string | null
	counterpartyIban: string | null
	purpose: string | null
	endToEndId: string | null
	accountServicerReference: string | null
	additionalInfo: string | null
}

export interface ParsedBankStatement {
	iban: string
	statementId: string
	sequenceNumber: string | null
	createdAt: Date
	fromDate: string | null
	toDate: string | null
	openingBalance: number | null
	closingBalance: number | null
	transactions: ParsedBankTransaction[]
	// Entries the bank has not booked yet. They are left out, because their
	// amount and date may still change.
	pendingCount: number
}

const repeatedElements = new Set([
	'Stmt',
	'Bal',
	'Ntry',
	'NtryDtls',
	'TxDtls',
	'Ustrd',
])

// Placeholders banks put into reference fields instead of leaving them out.
const missingReferences = new Set([
	'NONREF',
	'NOTPROVIDED',
])

const textSchema = z.string().trim()

const amountSchema = z.object({
	'#text': z.string().regex(/^\d+(\.\d{1,2})?$/, { error: 'Ungültiger Betrag' }),
	'@_Ccy': z.literal('EUR', { error: 'Es werden nur Beträge in Euro unterstützt' }),
})

const creditDebitSchema = z.enum([ 'CRDT', 'DBIT' ])

const dateSchema = z.object({
	Dt: z.iso.date().optional(),
	DtTm: z.string().optional(),
}).refine((value) => value.Dt ?? value.DtTm, { error: 'Datum fehlt' })

const accountSchema = z.object({
	Id: z.object({
		IBAN: textSchema.optional(),
	}).optional(),
}).optional()

const partySchema = z.object({
	Nm: textSchema.optional(),
}).optional()

const transactionDetailsSchema = z.object({
	Refs: z.object({
		AcctSvcrRef: textSchema.optional(),
		EndToEndId: textSchema.optional(),
	}).optional(),
	AmtDtls: z.object({
		TxAmt: z.object({
			Amt: amountSchema,
		}).optional(),
	}).optional(),
	RltdPties: z.object({
		Dbtr: partySchema,
		DbtrAcct: accountSchema,
		UltmtDbtr: partySchema,
		Cdtr: partySchema,
		CdtrAcct: accountSchema,
		UltmtCdtr: partySchema,
	}).optional(),
	RmtInf: z.object({
		Ustrd: z.array(textSchema).optional(),
	}).optional(),
	AddtlTxInf: textSchema.optional(),
})

const entrySchema = z.object({
	Amt: amountSchema,
	CdtDbtInd: creditDebitSchema,
	RvslInd: z.enum([ 'true', 'false' ]).optional(),
	Sts: z.string(),
	BookgDt: dateSchema.optional(),
	ValDt: dateSchema.optional(),
	AcctSvcrRef: textSchema.optional(),
	NtryDtls: z.array(z.object({
		TxDtls: z.array(transactionDetailsSchema).optional(),
	})).optional(),
	AddtlNtryInf: textSchema.optional(),
})

const balanceSchema = z.object({
	Tp: z.object({
		CdOrPrtry: z.object({
			Cd: z.string().optional(),
		}),
	}),
	Amt: amountSchema,
	CdtDbtInd: creditDebitSchema,
})

const statementSchema = z.object({
	Id: textSchema.min(1),
	ElctrncSeqNb: textSchema.optional(),
	CreDtTm: z.string(),
	FrToDt: z.object({
		FrDtTm: z.string(),
		ToDtTm: z.string(),
	}).optional(),
	Acct: z.object({
		Id: z.object({
			IBAN: textSchema.min(1, { error: 'Das Konto des Auszugs hat keine IBAN' }),
		}),
		Ccy: z.literal('EUR', { error: 'Es werden nur Konten in Euro unterstützt' }).optional(),
	}),
	Bal: z.array(balanceSchema).optional(),
	Ntry: z.array(entrySchema).optional(),
})

const documentSchema = z.object({
	Document: z.object({
		BkToCstmrStmt: z.object({
			Stmt: z.array(statementSchema).min(1),
		}),
	}),
})

type Entry = z.infer<typeof entrySchema>
type TransactionDetails = z.infer<typeof transactionDetailsSchema>

function fail(message: string): never {
	throw createError({
		statusCode: 400,
		statusMessage: message,
	})
}

function parseAmount(amount: { '#text': string }) {
	return Number(amount['#text'])
}

function toDate(value: { Dt?: string, DtTm?: string } | undefined) {
	return (value?.Dt ?? value?.DtTm)?.slice(0, 10) ?? null
}

function nonEmpty(value: string | undefined, maxLength: number) {
	return value && !missingReferences.has(value)
		? value.slice(0, maxLength)
		: null
}

function describeCounterparty(entry: Entry, details: TransactionDetails | undefined) {
	const parties = details?.RltdPties
	const [ party, ultimateParty, account ] = entry.CdtDbtInd === 'CRDT'
		? [ parties?.Dbtr, parties?.UltmtDbtr, parties?.DbtrAcct ]
		: [ parties?.Cdtr, parties?.UltmtCdtr, parties?.CdtrAcct ]

	const iban = account?.Id?.IBAN

	return {
		counterpartyName: nonEmpty(party?.Nm ?? ultimateParty?.Nm, 140),
		counterpartyIban: iban ? normalizeIban(iban) : null,
	}
}

function describePurpose(details: TransactionDetails[]) {
	const purpose = details
		.flatMap((item) => item.RmtInf?.Ustrd ?? [])
		.filter(Boolean)
		.join(' ')

	return nonEmpty(purpose, 1024)
}

function balanceOf(balances: z.infer<typeof balanceSchema>[] | undefined, codes: string[]) {
	for(const code of codes) {
		const balance = balances?.find((item) => item.Tp.CdOrPrtry.Cd === code)
		if(balance) {
			const amount = parseAmount(balance.Amt)
			return balance.CdtDbtInd === 'DBIT' ? -amount : amount
		}
	}

	return null
}

/**
 * Splits an entry into the transactions it is made of.
 *
 * A batch booking lists its single transactions in `TxDtls`. If every one of
 * them carries its own amount and they add up to the amount of the entry, each
 * one becomes a transaction of its own. Otherwise the entry stays a single
 * transaction.
 *
 * @param entry - The entry of the statement
 * @returns The transactions without their import key
 */
function splitEntry(entry: Entry): Omit<ParsedBankTransaction, 'importKey'>[] {
	const details = entry.NtryDtls?.flatMap((item) => item.TxDtls ?? []) ?? []
	const entryAmount = parseAmount(entry.Amt)

	const common = {
		bookingDate: toDate(entry.BookgDt) ??
			toDate(entry.ValDt) ??
			fail('Eine Buchung hat kein Buchungsdatum'),
		valueDate: toDate(entry.ValDt),
		direction: entry.CdtDbtInd === 'CRDT' ? 'credit' as const : 'debit' as const,
		reversal: entry.RvslInd === 'true',
	}

	const parts = details.flatMap((item) => {
		const amount = item.AmtDtls?.TxAmt?.Amt
		return amount ? [ { item, amount: parseAmount(amount) } ] : []
	})
	const splittable = details.length > 1 &&
		parts.length === details.length &&
		currencySum(...parts.map((part) => part.amount)) === entryAmount

	if(splittable) {
		return parts.map(({ item, amount }) => ({
			...common,
			amount,
			...describeCounterparty(entry, item),
			purpose: describePurpose([ item ]),
			endToEndId: nonEmpty(item.Refs?.EndToEndId, 35),
			accountServicerReference: nonEmpty(item.Refs?.AcctSvcrRef ?? entry.AcctSvcrRef, 35),
			additionalInfo: nonEmpty(item.AddtlTxInf ?? entry.AddtlNtryInf, 500),
		}))
	}

	const single = details.length === 1 ? details[0] : undefined

	return [ {
		...common,
		amount: entryAmount,
		...describeCounterparty(entry, single),
		purpose: describePurpose(details),
		endToEndId: nonEmpty(single?.Refs?.EndToEndId, 35),
		accountServicerReference: nonEmpty(single?.Refs?.AcctSvcrRef ?? entry.AcctSvcrRef, 35),
		additionalInfo: nonEmpty(single?.AddtlTxInf ?? entry.AddtlNtryInf, 500),
	} ]
}

/**
 * Derives a key that identifies a transaction within its account.
 *
 * Statements overlap, for example a daily and a monthly one, so the same
 * transaction is uploaded more than once. The reference the bank gives the
 * entry identifies it. Without one, the key is a hash of what describes the
 * transaction, numbered to keep identical transactions of one statement apart.
 *
 * @param entry - The entry the transaction belongs to
 * @param index - The position of the transaction within the entry
 * @param transaction - The transaction
 * @param seen - The hashes already given out within the statement
 * @returns The import key
 */
function importKeyOf(
	entry: Entry,
	index: number,
	transaction: Omit<ParsedBankTransaction, 'importKey'>,
	seen: Map<string, number>,
) {
	const reference = nonEmpty(entry.AcctSvcrRef, 35)
	if(reference) {
		return `ref:${reference}:${index}`
	}

	const hash = createHash('sha256')
		.update(JSON.stringify([
			transaction.bookingDate,
			transaction.valueDate,
			transaction.direction,
			transaction.amount,
			transaction.reversal,
			transaction.counterpartyIban,
			transaction.purpose,
			transaction.endToEndId,
		]))
		.digest('hex')

	const occurrence = seen.get(hash) ?? 0
	seen.set(hash, occurrence + 1)

	return `sha:${hash}:${occurrence}`
}

/**
 * Reads a bank statement in the format camt.053.001.02.
 *
 * Only the elements FördeFlow uses are checked, the file is not validated
 * against the complete XML schema.
 *
 * @param xml - The content of the uploaded file
 * @returns The statements of the file, one per account
 */
export function parseCamt053(xml: string): ParsedBankStatement[] {
	// Statements never declare a document type. Refusing one rules out entity
	// expansion of any kind.
	if(/<!DOCTYPE/i.test(xml)) {
		fail('Die Datei enthält eine Dokumenttyp-Deklaration und wird deshalb nicht verarbeitet')
	}

	const namespace = camt053Namespace.replaceAll('.', '\\.')
	if(!new RegExp(`<(\\w+:)?Document\\b[^>]*\\bxmlns(:\\w+)?=["']${namespace}["']`).test(xml)) {
		fail('Die Datei ist kein Kontoauszug im Format camt.053.001.02')
	}

	const parser = new XMLParser({
		ignoreAttributes: false,
		removeNSPrefix: true,
		parseTagValue: false,
		isArray: (tagName) => repeatedElements.has(tagName),
	})

	let document: unknown
	try {
		document = parser.parse(xml)
	} catch(_error) {
		fail('Die Datei ist kein gültiges XML')
	}

	const result = documentSchema.safeParse(document)
	if(!result.success) {
		const [ issue ] = result.error.issues
		fail(`Der Kontoauszug ist fehlerhaft (${issue?.path.join('.')}): ${issue?.message}`)
	}

	return result.data.Document.BkToCstmrStmt.Stmt.map((statement) => {
		const entries = statement.Ntry ?? []
		const seen = new Map<string, number>()

		const transactions = entries
			.filter((entry) => entry.Sts === 'BOOK')
			.flatMap((entry) => splitEntry(entry).map((transaction, index) => ({
				importKey: importKeyOf(entry, index, transaction, seen),
				...transaction,
			})))

		const createdAt = new Date(statement.CreDtTm)
		if(Number.isNaN(createdAt.getTime())) {
			fail(`Der Kontoauszug ${statement.Id} hat ein ungültiges Erstellungsdatum`)
		}

		return {
			iban: normalizeIban(statement.Acct.Id.IBAN),
			statementId: statement.Id.slice(0, 35),
			sequenceNumber: statement.ElctrncSeqNb ?? null,
			createdAt,
			fromDate: statement.FrToDt?.FrDtTm.slice(0, 10) ?? null,
			toDate: statement.FrToDt?.ToDtTm.slice(0, 10) ?? null,
			openingBalance: balanceOf(statement.Bal, [ 'OPBD', 'PRCD' ]),
			closingBalance: balanceOf(statement.Bal, [ 'CLBD' ]),
			transactions,
			pendingCount: entries.length - entries.filter((entry) => entry.Sts === 'BOOK').length,
		}
	})
}
