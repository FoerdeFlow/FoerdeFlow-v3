import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

const sumOf = (column: Parameters<typeof sql>[1]) =>
	sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number)

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const plan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, params.budgetPlan),
		with: {
			budget: true,
			items: {
				columns: {
					plan: false,
				},
				orderBy: (items, { asc }) => [ asc(items.ord) ],
			},
		},
		columns: {
			budget: false,
		},
	})

	await checkPermission('budgetPlanActuals.read', { organizationItem: plan?.budget.organizationItem })

	if(!plan) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushaltsplan nicht gefunden',
			data: {
				budgetPlanId: params.budgetPlan,
			},
		})
	}

	const itemIds = plan.items.map((item) => item.id)

	const [ authorized, ordered, actual, travelAuthorized, travelOrdered ] = itemIds.length === 0
		? [ [], [], [], [], [] ]
		: await Promise.all([
			database
				.select({
					item: expenseAuthorizations.budgetPlanItem,
					amount: sumOf(expenseAuthorizations.amount),
				})
				.from(expenseAuthorizations)
				.where(inArray(expenseAuthorizations.budgetPlanItem, itemIds))
				.groupBy(expenseAuthorizations.budgetPlanItem),
			database
				.select({
					item: paymentOrders.budgetPlanItem,
					amount: sumOf(paymentOrders.amount),
				})
				.from(paymentOrders)
				.where(inArray(paymentOrders.budgetPlanItem, itemIds))
				.groupBy(paymentOrders.budgetPlanItem),
			database
				.select({
					item: bankTransactionAssignments.budgetPlanItem,
					direction: bankTransactions.direction,
					amount: sumOf(bankTransactionAssignments.amount),
				})
				.from(bankTransactionAssignments)
				.innerJoin(
					bankTransactions,
					eq(bankTransactions.id, bankTransactionAssignments.transaction),
				)
				.where(inArray(bankTransactionAssignments.budgetPlanItem, itemIds))
				.groupBy(
					bankTransactionAssignments.budgetPlanItem,
					bankTransactions.direction,
				),
			database
				.select({
					item: travelPermits.budgetPlanItem,
					amount: sumOf(travelPermits.amount),
				})
				.from(travelPermits)
				.where(inArray(travelPermits.budgetPlanItem, itemIds))
				.groupBy(travelPermits.budgetPlanItem),
			// A claim supersedes the advance it sets off, so a journey counts
			// with its claim once there is one and with its advance before.
			database
				.select({
					item: travelPermits.budgetPlanItem,
					amount: sumOf(sql`coalesce(${travelClaims.amount}, ${travelAdvances.amount})`),
				})
				.from(travelPermits)
				.leftJoin(travelAdvances, eq(travelAdvances.permit, travelPermits.id))
				.leftJoin(travelClaims, eq(travelClaims.permit, travelPermits.id))
				.where(inArray(travelPermits.budgetPlanItem, itemIds))
				.groupBy(travelPermits.budgetPlanItem),
		])

	// The reserve is not part of a plan, so only what was booked on it within
	// the period of the plan counts here.
	const reserve = await database
		.select({
			direction: bankTransactions.direction,
			amount: sumOf(bankTransactionAssignments.amount),
		})
		.from(bankTransactionAssignments)
		.innerJoin(bankTransactions, eq(bankTransactions.id, bankTransactionAssignments.transaction))
		.where(and(
			eq(bankTransactionAssignments.budget, plan.budget.id),
			gte(bankTransactions.bookingDate, plan.startDate),
			lte(bankTransactions.bookingDate, plan.endDate),
		))
		.groupBy(bankTransactions.direction)

	const amountOf = (rows: { item: string | null, amount: number }[], item: string) =>
		rows.find((row) => row.item === item)?.amount ?? 0
	const actualOf = (item: string, direction: 'credit' | 'debit') =>
		actual.find((row) => row.item === item && row.direction === direction)?.amount ?? 0

	const items = plan.items.map((item) => {
		const actualRevenues = actualOf(item.id, 'credit')
		const actualExpenses = actualOf(item.id, 'debit')

		return {
			...item,
			authorized: currencySum(
				amountOf(authorized, item.id),
				amountOf(travelAuthorized, item.id),
			),
			ordered: currencySum(
				amountOf(ordered, item.id),
				amountOf(travelOrdered, item.id),
			),
			actualRevenues,
			actualExpenses,
			remainingRevenues: currencySum(item.revenues, -actualRevenues),
			remainingExpenses: currencySum(item.expenses, -actualExpenses),
		}
	})

	return {
		id: plan.id,
		startDate: plan.startDate,
		endDate: plan.endDate,
		budget: plan.budget,
		items,
		reserve: {
			actualRevenues: reserve.find((row) => row.direction === 'credit')?.amount ?? 0,
			actualExpenses: reserve.find((row) => row.direction === 'debit')?.amount ?? 0,
		},
	}
})
