import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Lists the titles a journey may be paid from: those of the plan of the budget
 * of the special allocation, or else of the role, that is in force when the
 * journey starts. The applicant need not be allowed to read budget plans, the
 * budget is fixed by the master data anyway.
 */
export default defineEventHandler(async (event) => {
	requireTravelPerson(event)

	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		role: idSchema,
		specialAllocation: idSchema.optional(),
		startDate: z.iso.date(),
	}).parseAsync(data))

	const database = useDatabase()

	const owner = query.specialAllocation
		? await database.query.travelSpecialAllocations.findFirst({
			where: eq(travelSpecialAllocations.id, query.specialAllocation),
			columns: {
				budget: true,
			},
		})
		: await database.query.travelRoles.findFirst({
			where: eq(travelRoles.id, query.role),
			columns: {
				budget: true,
			},
		})
	if(!owner) return []

	const plan = await database.query.budgetPlans.findFirst({
		where: and(
			eq(budgetPlans.budget, owner.budget),
			lte(budgetPlans.startDate, query.startDate),
			gte(budgetPlans.endDate, query.startDate),
		),
		with: {
			budget: true,
			items: {
				columns: {
					id: true,
					ord: true,
					title: true,
					description: true,
					expenses: true,
				},
				orderBy: [ asc(budgetPlanItems.ord) ],
			},
		},
		columns: {
			id: true,
			startDate: true,
			endDate: true,
		},
	})
	if(!plan) return []

	const { items, ...planData } = plan
	return items.map((item) => ({ ...item, plan: planData }))
})
