import { eq, type InferInsertModel } from 'drizzle-orm'

async function createExpenseAuthorization(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof expenseAuthorizations>,
		'id'
	> & {
		items: Omit<
			InferInsertModel<typeof expenseAuthorizationItems>,
			'id' | 'expenseAuthorization'
		>[]
	},
) {
	const [ result ] = await tx
		.insert(expenseAuthorizations)
		.values(data)
		.returning({ id: expenseAuthorizations.id })

	for(const item of data.items) {
		await tx.insert(expenseAuthorizationItems).values({
			...item,
			expenseAuthorization: result.id,
		})
	}
}

export async function applyProcessMutations(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, processId),
		with: {
			mutation: true,
		},
		columns: {
			dataId: true,
			data: true,
		},
	})

	for(const mutation of mutations) {
		const handler = {
			expenseAuthorizations: {
				create: createExpenseAuthorization,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
		}[mutation.mutation.table]?.[mutation.mutation.action]

		if(!handler) {
			continue
		}

		// @ts-expect-error | Data is untyped in database
		await handler(tx, mutation.dataId, mutation.data)
	}
}
