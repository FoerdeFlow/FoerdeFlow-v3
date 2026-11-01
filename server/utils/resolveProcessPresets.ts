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

const resolveBudgetPlan: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, value),
		with: {
			budget: true,
		},
		columns: {
			budget: false,
		},
	}) ?? null
}

const resolvePerson: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return withDisplayName(await database.query.persons.findFirst({
		where: eq(persons.id, value),
	}))
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

// The travel master data is resolved in the shape its lists hand it out in,
// as the selects of the forms pick from those lists.
const budgetWithOrganizationItem = {
	with: {
		organizationItem: true,
	},
	columns: {
		organizationItem: false,
	},
} as const

const resolveTravelRole: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.travelRoles.findFirst({
		where: eq(travelRoles.id, value),
		with: {
			organizationItem: true,
			budget: budgetWithOrganizationItem,
		},
		columns: {
			organizationItem: false,
			budget: false,
		},
	}) ?? null
}

const resolveTravelSpecialAllocation: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.travelSpecialAllocations.findFirst({
		where: eq(travelSpecialAllocations.id, value),
		with: {
			budget: budgetWithOrganizationItem,
		},
		columns: {
			budget: false,
		},
	}) ?? null
}

const resolveTravelTransportMode: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	return await database.query.travelTransportModes.findFirst({
		where: eq(travelTransportModes.id, value),
	}) ?? null
}

const resolveTravelTransportReason: Resolver = async (database, value) => {
	if(typeof value !== 'string') return null
	const reason = await database.query.travelTransportReasons.findFirst({
		where: eq(travelTransportReasons.id, value),
		with: travelTransportReasonLinksWith,
	})
	return reason ? withTravelTransportReasonLinks(reason) : null
}

const resolveTravelPermitItems: Resolver = async (database, value) => {
	if(!Array.isArray(value)) return value
	return await Promise.all(value.map(async (item, index) => {
		if(typeof item !== 'object' || item === null) return item
		const { costType } = item as { costType?: unknown }
		return {
			// The lines of a form are told apart by an id, which a preset
			// does not carry.
			id: `preset-${index}`,
			...item,
			costType: typeof costType === 'string'
				? await database.query.travelCostTypes.findFirst({
					where: eq(travelCostTypes.id, costType),
				}) ?? null
				: null,
		}
	}))
}

const resolvers: Record<string, Record<string, Resolver>> = {
	budgetPlans: {
		budget: resolveBudget,
	},
	budgetPlanItems: {
		plan: resolveBudgetPlan,
	},
	expenseAuthorizations: {
		budget: resolveBudget,
		budgetPlanItem: resolveBudgetPlanItem,
	},
	paymentOrders: {
		budget: resolveBudget,
		budgetPlanItem: resolveBudgetPlanItem,
		recipientPerson: resolvePerson,
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
	persons: {
		course: resolveCourse,
	},
	travelPermits: {
		traveler: resolvePerson,
		role: resolveTravelRole,
		specialAllocation: resolveTravelSpecialAllocation,
		transportMode: resolveTravelTransportMode,
		transportReason: resolveTravelTransportReason,
		budgetPlanItem: resolveBudgetPlanItem,
		items: resolveTravelPermitItems,
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
