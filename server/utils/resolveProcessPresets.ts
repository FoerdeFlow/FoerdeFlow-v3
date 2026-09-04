import { eq } from 'drizzle-orm'

import type { Presets } from '#shared/utils/presets'

type Resolver = (
	database: ReturnType<typeof useDatabase>,
	value: unknown,
) => Promise<unknown>

const resolveBudget: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.budgets.findFirst({
		where: eq(budgets.id, value),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	}) ?? null
}

const resolveBudgetPlanItem: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.budgetPlanItems.findFirst({
		where: eq(budgetPlanItems.id, value),
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
	}) ?? null
}

const resolvePerson: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.persons.findFirst({
		where: eq(persons.id, value),
	}) ?? null
}

const resolveCourse: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.courses.findFirst({
		where: eq(courses.id, value),
		with: {
			type: true,
			council: true,
			department: true,
		},
		columns: {
			type: false,
			council: false,
			department: false,
		},
	}) ?? null
}

const resolveElectionCommittee: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.electionCommittees.findFirst({
		where: eq(electionCommittees.id, value),
		with: {
			election: true,
			committee: true,
		},
		columns: {
			election: false,
			committee: false,
		},
	}) ?? null
}

const resolveRecipients: Resolver = async (database, value) => {
	if(!Array.isArray(value)) return value
	return await Promise.all(value.map(async (recipient) => {
		if(typeof recipient !== 'object' || recipient === null) return recipient
		const person = await resolvePerson(database, (recipient as { person?: unknown }).person)
		return {
			id: (recipient as { person?: unknown }).person,
			...recipient,
			person,
		}
	}))
}

const resolvers: Record<string, Record<string, Resolver>> = {
	budgetPlans: {
		budget: resolveBudget,
	},
	expenseAuthorizations: {
		budget: resolveBudget,
		budgetPlanItem: resolveBudgetPlanItem,
	},
	longtermContracts: {
		budget: resolveBudget,
	},
	representationAllowances: {
		recipients: resolveRecipients,
	},
	candidates: {
		electionCommittee: resolveElectionCommittee,
		candidate: resolvePerson,
		course: resolveCourse,
	},
}

/**
 * Resolves the presets of a workflow mutation for the process form, meaning
 * that date tokens are replaced by the date they stand for and referenced
 * entities by the objects the form works with.
 *
 * @param database - The database to resolve the references with
 * @param table - The table the mutation applies to
 * @param presets - The raw presets of the mutation
 * @returns The presets with all references resolved
 */
export async function resolveProcessPresets(
	database: ReturnType<typeof useDatabase>,
	table: string,
	presets: unknown,
): Promise<Presets> {
	const parsed = parsePresets(presets)
	const tableResolvers = resolvers[table] ?? {}

	return Object.fromEntries(await Promise.all(Object
		.entries(parsed)
		.map(async ([ field, preset ]) => {
			const resolver = tableResolvers[field]
			const value = resolvePresetValue(preset.value)
			return [
				field,
				{
					mode: preset.mode,
					value: resolver ? await resolver(database, value) : value,
				},
			]
		})))
}
