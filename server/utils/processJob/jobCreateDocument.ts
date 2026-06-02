import { writeFile } from 'node:fs/promises'
import { desc, eq } from 'drizzle-orm'
import type jsPDF from 'jspdf'

export async function jobCreateDocument(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
	targetOrganizationItemCode: string,
) {
	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		columns: {
			initiatorType: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
		},
	})
	if(!process) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozess nicht gefunden',
			data: {
				processId,
			},
		})
	}

	const allowedMutationTables = [
		'budgetPlans',
		'expenseAuthorizations',
	] as const
	const mutation = await tx.query.workflowProcessMutations.findFirst({
		where: (tbl, { and, eq, inArray, exists }) => and(
			eq(tbl.process, processId),
			exists(
				tx.select()
					.from(workflowMutations)
					.where(and(
						eq(workflowMutations.id, tbl.mutation),
						inArray(workflowMutations.table, allowedMutationTables),
					)),
			),
		),
		with: {
			mutation: {
				columns: {
					id: true,
					table: true,
				},
			},
		},
		columns: {
			mutation: false,
			data: true,
		},
	})
	if(!mutation) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Document-supported mutation not found for process',
			data: {
				processId,
			},
		})
	}

	const data = await encodeProcessData(
		tx,
		mutation.mutation.table as typeof allowedMutationTables[number],
		mutation.data as any,
	)

	let doc: jsPDF
	switch(mutation.mutation.table) {
		case 'budgetPlans':
			// @ts-expect-error - We ensure the type safety above
			doc = await pdfEncodeBudgetPlan(data, { document: true })
			break
		case 'expenseAuthorizations':
			if(!data.budgetPlanItem) {
				throw createError({
					statusCode: 400,
					statusMessage: 'Haushaltstitel fehlt',
				})
			}
			// @ts-expect-error - We ensure the type safety above
			doc = await pdfEncodeExpenseAuthorization(data, { document: true })
			break
		default:
			throw createError({
				statusCode: 400,
				statusMessage: 'Unsupported mutation type for document creation',
				data: {
					mutationTable: mutation.mutation.table,
				},
			})
	}

	const latestDocument = await tx.query.documents.findFirst({
		orderBy: (tbl) => [ desc(tbl.period) ],
		columns: {
			period: true,
		},
	})
	if(!latestDocument) {
		throw createError({
			statusCode: 500,
			statusMessage: 'No documents found to determine period for new document',
		})
	}

	const type = await tx.query.documentTypes.findFirst({
		where: eq(documentTypes.code, mutation.mutation.table.substring(0, mutation.mutation.table.length - 1)),
		columns: {
			id: true,
		},
	})
	if(!type) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Document type not found',
			data: {
				mutationTable: mutation.mutation,
			},
		})
	}

	const targetOrganizationItem = await tx.query.organizationItems.findFirst({
		where: eq(organizationItems.code, targetOrganizationItemCode),
		columns: {
			id: true,
		},
	})
	if(!targetOrganizationItem) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ungültige Ziel-OE',
			data: {
				targetOrganizationItemCode,
			},
		})
	}

	let title = 'Unbenannte Drucksache'
	if('title' in data && typeof data.title === 'string' && data.title.trim() !== '') {
		title = data.title.trim()
	} else if('startDate' in data && 'endDate' in data) {
		title = `Haushaltsplan ${formatDate(data.startDate, 'compact')} - ${formatDate(data.endDate, 'compact')}`
	}

	const [ document = null ] = await tx.insert(documents).values({
		period: latestDocument.period,
		title,
		type: type.id,
		organizationItem: targetOrganizationItem.id,
		...(process.initiatorType === 'person'
			? { authorPerson: process.initiatorPerson }
			: { authorOrganizationItem: process.initiatorOrganizationItem }
		),
	}).returning({
		id: documents.id,
	})
	if(!document) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to create document',
		})
	}

	const docOutput = Buffer.from(doc.output('arraybuffer'))
	await writeFile(`./data/${document.id}.pdf`, docOutput)
}
