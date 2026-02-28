import { eq, type InferSelectModel } from 'drizzle-orm'
import z from 'zod'

const encoders = {
	candidates: async (
		tx: ReturnType<typeof useDatabase>,
		model: z.infer<typeof processSchemas.candidates.create>,
	) => ({
		...model,
		electionCommittee: await tx.query.electionCommittees.findFirst({
			where: eq(electionCommittees.id, model.electionCommittee),
			with: {
				election: true,
				committee: true,
			},
			columns: {
				election: false,
				committee: false,
			},
		}) ?? null,
		candidate: await tx.query.persons.findFirst({
			where: eq(persons.id, model.candidate),
			columns: {
				course: false,
				pronouns: false,
				matriculationNumber: false,
				postalAddress: false,
				callName: false,
			},
		}) ?? null,
		course: await tx.query.courses.findFirst({
			where: eq(courses.id, model.course),
			with: {
				type: true,
				council: true,
			},
			columns: {
				type: false,
				council: false,
				department: false,
			},
		}) ?? null,
	}),
	expenseAuthorizations: async (
		tx: ReturnType<typeof useDatabase>,
		model: InferSelectModel<typeof expenseAuthorizations> & {
			items: InferSelectModel<typeof expenseAuthorizationItems>[]
		},
	) => ({
		...model,
		budgetPlanItem: await tx.query.budgetPlanItems.findFirst({
			where: eq(budgetPlanItems.id, model.budgetPlanItem),
			with: {
				plan: {
					with: {
						budget: true,
					},
					columns: {
						budget: false,
					},
				},
			},
			columns: {
				plan: false,
			},
		}) ?? null,
	}),
} as const

export async function encodeProcessData<
	T extends keyof typeof encoders,
>(
	tx: ReturnType<typeof useDatabase>,
	table: T,
	model: Parameters<typeof encoders[T]>[1],
) {
	return await encoders[table](tx, model)
}
