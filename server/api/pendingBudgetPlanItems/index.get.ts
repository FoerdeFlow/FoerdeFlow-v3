import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Lists the titles a supplement adds to a budget plan while it is still being
 * applied for, so that an expense authorization can be applied for alongside
 * the supplement it is paid from.
 *
 * The titles do not exist as rows yet, they only live in the data of the
 * mutation of their application. They are shaped like an approved title all the
 * same, with synthetic ids, so that the same select can offer both. A title the
 * supplement merely changes exists already and is therefore left out.
 */
export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		plan: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const plan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, query.plan),
		with: {
			budget: {
				with: {
					organizationItem: true,
				},
				columns: {
					organizationItem: false,
				},
			},
		},
		columns: {
			budget: false,
		},
	})

	await checkPermission('budgetPlans.read', {
		organizationItem: plan?.budget.organizationItem.id,
	})

	if(!plan) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushaltsplan nicht gefunden',
			data: {
				budgetPlanId: query.plan,
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
			eq(workflowMutations.table, 'budgetPlanItems'),
			eq(workflowMutations.action, 'update'),
			eq(workflowProcesses.status, 'pending'),
			sql`${workflowProcessMutations.data}->>'plan' = ${query.plan}`,
		))
		.orderBy(desc(workflowProcesses.createdAt))

	const items = await Promise.all(rows.map(async (row) => {
		const parsed = storedBudgetPlanItemsUpdate.safeParse(row.data)
		if(!parsed.success) return []

		try {
			await checkProcessPermissionTx(database, row.process)
		} catch{
			return []
		}

		return parsed.data.items
			.filter((item) => !item.id)
			.map((item) => ({
				id: `pending:${row.process}:${item.ord}`,
				pending: true as const,
				process: row.process,
				createdAt: row.createdAt,
				workflow: row.workflow,
				ord: item.ord,
				title: item.title,
				description: item.description,
				revenues: item.revenues ?? null,
				expenses: item.expenses ?? null,
				plan,
			}))
	}))

	return items.flat()
})
