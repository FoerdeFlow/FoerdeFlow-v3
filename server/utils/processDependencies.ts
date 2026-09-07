import { eq, inArray } from 'drizzle-orm'

export interface ProcessDependency {
	/** The mutation of the process that carries the reference. */
	mutation: string
	/** The process the referenced budget plan is applied for in. */
	process: string
	/** The ordinal of the referenced item within that budget plan. */
	ord: number
	/** The status of the referenced process, `null` if it no longer exists. */
	status: 'pending' | 'completed' | 'failed' | null
	/** The workflow of the referenced process, `null` if it no longer exists. */
	workflow: { code: string, name: string } | null
}

/**
 * Reads the reference to an item of a budget plan that is still being applied
 * for out of the data of a mutation.
 *
 * @param data - The data of the mutation, untyped as it comes from the database
 * @returns The reference or `null` if the mutation does not carry one
 */
function pendingBudgetPlanItemOf(data: unknown) {
	if(typeof data !== 'object' || data === null || !('pendingBudgetPlanItem' in data)) {
		return null
	}

	const reference = data.pendingBudgetPlanItem
	if(
		typeof reference !== 'object' || reference === null ||
		!('process' in reference) || typeof reference.process !== 'string' ||
		!('ord' in reference) || typeof reference.ord !== 'number'
	) {
		return null
	}

	return { process: reference.process, ord: reference.ord }
}

/**
 * Collects the processes a process depends on, that is the applications for a
 * budget plan whose items its mutations refer to.
 *
 * @param tx - The transaction to read in
 * @param processId - The process to collect the dependencies of
 * @returns The dependencies together with the status of the referenced process
 */
export async function processDependencies(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
): Promise<ProcessDependency[]> {
	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, processId),
		columns: {
			id: true,
			data: true,
		},
	})

	const references = mutations.flatMap((mutation) => {
		const reference = pendingBudgetPlanItemOf(mutation.data)
		return reference ? [ { mutation: mutation.id, ...reference } ] : []
	})
	if(references.length === 0) return []

	const referenced = await tx.query.workflowProcesses.findMany({
		where: inArray(workflowProcesses.id, references.map((item) => item.process)),
		with: {
			workflow: {
				columns: {
					code: true,
					name: true,
				},
			},
		},
		columns: {
			id: true,
			status: true,
		},
	})

	return references.map((reference) => {
		const process = referenced.find((item) => item.id === reference.process) ?? null
		return {
			...reference,
			status: process?.status ?? null,
			workflow: process?.workflow ?? null,
		}
	})
}

/**
 * Ensures that every process a process depends on is completed, so that its
 * mutations can be applied.
 *
 * @param tx - The transaction to read in
 * @param processId - The process to check the dependencies of
 * @throws When a referenced application for a budget plan is not approved
 */
export async function checkProcessDependencies(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	for(const dependency of await processDependencies(tx, processId)) {
		if(dependency.status === 'completed') continue

		const reason = dependency.status === 'pending'
			? 'ist noch nicht genehmigt'
			: dependency.status === 'failed'
				? 'wurde abgelehnt'
				: 'existiert nicht mehr'

		throw createError({
			statusCode: 409,
			message: 'Der Antrag auf Genehmigung des Haushaltsplans, auf den sich dieser ' +
				`Prozess bezieht, ${reason}`,
			data: {
				processId,
				dependency: dependency.process,
				dependencyStatus: dependency.status,
			},
		})
	}
}
