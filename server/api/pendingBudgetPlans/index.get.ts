import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Lists the budget plans of a budget that are still being applied for, so that
 * an expense authorization can be applied for alongside its budget plan.
 *
 * The plans do not exist as rows yet, they only live in the data of the
 * mutation of their application. They are shaped like an approved plan all the
 * same, with synthetic ids, so that the same selects can offer both.
 */
export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		budget: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	// Shaped exactly like the budgets of `/api/budgets`, so that the plans can be
	// offered next to the approved ones.
	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, query.budget),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	await checkPermission('budgetPlans.read', { organizationItem: budget?.organizationItem.id })

	if(!budget) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Budget not found',
			data: {
				budgetId: query.budget,
			},
		})
	}

	const rows = await database
		.select({
			process: workflowProcesses.id,
			createdAt: workflowProcesses.createdAt,
			data: workflowProcessMutations.data,
			workflow: {
				code: workflows.code,
				name: workflows.name,
			},
		})
		.from(workflowProcessMutations)
		.innerJoin(
			workflowMutations,
			eq(workflowProcessMutations.mutation, workflowMutations.id),
		)
		.innerJoin(
			workflowProcesses,
			eq(workflowProcessMutations.process, workflowProcesses.id),
		)
		.innerJoin(workflows, eq(workflowProcesses.workflow, workflows.id))
		.where(and(
			eq(workflowMutations.table, 'budgetPlans'),
			eq(workflowMutations.action, 'create'),
			eq(workflowProcesses.status, 'pending'),
			sql`${workflowProcessMutations.data}->>'budget' = ${query.budget}`,
		))
		.orderBy(desc(workflowProcesses.createdAt))

	const plans = await Promise.all(rows.map(async (row) => {
		const parsed = processSchemas.budgetPlans.create.safeParse(row.data)
		if(!parsed.success) return null

		try {
			await checkProcessPermissionTx(database, row.process)
		} catch{
			return null
		}

		return {
			id: `pending:${row.process}`,
			pending: true as const,
			process: row.process,
			createdAt: row.createdAt,
			workflow: row.workflow,
			startDate: parsed.data.startDate.toISOString().slice(0, 10),
			endDate: parsed.data.endDate.toISOString().slice(0, 10),
			budget,
			items: parsed.data.items.map((item) => ({
				id: `pending:${row.process}:${item.ord}`,
				pending: true as const,
				process: row.process,
				ord: item.ord,
				title: item.title,
				description: item.description,
				revenues: item.revenues ?? null,
				expenses: item.expenses ?? null,
			})),
		}
	}))

	return plans.filter((plan): plan is NonNullable<typeof plan> => plan !== null)
})
