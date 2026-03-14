import { writeFile } from 'node:fs/promises'
import { desc, eq } from 'drizzle-orm'

export async function jobCreateDocument(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
	targetOrganizationItemCode: string,
) {
	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		with: {
			initiatorPerson: true,
		},
		columns: {},
	})
	if (!process) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozess nicht gefunden',
			data: {
				processId,
			},
		})
	}

	const mutation = await tx.query.workflowProcessMutations.findFirst({
		where: (tbl, { and, eq, inArray, exists }) => and(
			eq(tbl.process, processId),
			exists(
				tx.select()
					.from(workflowMutations)
					.where(and(
						eq(workflowMutations.id, tbl.mutation),
						inArray(workflowMutations.table, [
							'expenseAuthorizations',
						]),
					)),
			),
		),
		columns: {
			mutation: true,
			data: true,
		},
	})
	if (!mutation) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Document-supported mutation not found for process',
			data: {
				processId,
			},
		})
	}

	const data = await encodeProcessData(tx, 'expenseAuthorizations', mutation.data as any)
	if (!data.budgetPlanItem) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Haushaltstitel fehlt',
		})
	}
	// @ts-expect-error - We ensure the type safety above
	const doc = await pdfEncodeExpenseAuthorization(data, { document: true })

	const latestDocument = await tx.query.documents.findFirst({
		orderBy: (tbl) => [desc(tbl.period)],
		columns: {
			period: true,
		},
	})
	if (!latestDocument) {
		throw createError({
			statusCode: 500,
			statusMessage: 'No documents found to determine period for new document',
		})
	}

	const type = await tx.query.documentTypes.findFirst({
		where: eq(documentTypes.code, 'expenseAuthorization'),
		columns: {
			id: true,
		},
	})
	if (!type) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Document type "expenseAuthorization" not found',
		})
	}

	const targetOrganizationItem = await tx.query.organizationItems.findFirst({
		where: eq(organizationItems.code, targetOrganizationItemCode),
		columns: {
			id: true,
		},
	})
	if (!targetOrganizationItem) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ungültige Ziel-OE',
			data: {
				targetOrganizationItemCode,
			},
		})
	}

	const [document = null] = await tx.insert(documents).values({
		period: latestDocument.period,
		title: data.title,
		type: type.id,
		organizationItem: targetOrganizationItem.id,
		authorOrganizationItem: data.budgetPlanItem.plan.budget.organizationItem,
	}).returning({
		id: documents.id,
	})
	if (!document) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to create document',
		})
	}

	const docOutput = Buffer.from(doc.output('arraybuffer'))
	await writeFile(`./data/${document.id}.pdf`, docOutput)
}