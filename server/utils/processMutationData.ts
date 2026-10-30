import type { MutationContext } from './processValidators'

/**
 * The fields the validators of `processValidators` add to the data of a
 * mutation on top of what was submitted for it.
 *
 * They follow from the process itself, not from the input: who the initiator is,
 * which budget a referenced plan belongs to, how the titles of that plan stood.
 * A correction of the data therefore neither shows them nor reads them back,
 * they are derived anew when the corrected input is validated.
 */
const processDerivedFields: Partial<Record<keyof typeof processSchemas, string[]>> = {
	budgetPlanItems: [ 'budget', 'previous' ],
	representationAllowances: [ 'organizationItem' ],
	persons: [ 'person' ],
	personIbans: [ 'person' ],
	personPhotos: [ 'person' ],
}

/**
 * Reduces the stored data of a mutation to the input it was made from, so that
 * it can be handed out for editing and validated again afterwards.
 *
 * @param table - The table the mutation writes to
 * @param data - The data as it is stored
 * @returns The data without the fields that are derived from the process
 */
export function processMutationInput(table: string, data: unknown) {
	const derived = processDerivedFields[table as keyof typeof processSchemas]
	if(!derived || typeof data !== 'object' || data === null || Array.isArray(data)) {
		return data
	}

	return Object.fromEntries(Object.entries(data).filter(([ field ]) => !derived.includes(field)))
}

/**
 * Validates the data submitted for a mutation of a process and enriches it the
 * way it is stored.
 *
 * This is the single way data enters `workflow_process_mutations`, no matter
 * whether a process is being created or its data is corrected afterwards: the
 * presets of the mutation are applied, the schema of its table and action
 * parses the result, and the validator of the table has the last word.
 *
 * @param tx - The transaction to validate in
 * @param mutation - The mutation of the workflow the data belongs to
 * @param data - The submitted data
 * @param context - The initiator of the process the data belongs to
 * @param now - The date the date tokens of the presets are resolved relative to
 * @returns The data as it is to be stored
 * @throws When the mutation has no schema or the data does not match it
 */
export async function validateProcessMutationData(
	tx: ReturnType<typeof useDatabase>,
	mutation: {
		id: string
		table: string
		action: 'create' | 'update' | 'delete'
		meta: unknown
		presets: unknown
	},
	data: unknown,
	context: Omit<MutationContext, 'meta'>,
	now: Date = new Date(),
) {
	if(!(mutation.table in processSchemas)) {
		throw createError({
			statusCode: 400,
			message: `Unbekannte Relation für Mutation ${mutation.id}`,
		})
	}

	const schema = processSchemas[mutation.table as keyof typeof processSchemas][mutation.action]
	if(!schema) {
		throw createError({
			statusCode: 400,
			message: `Unbekannte Aktion für Mutation ${mutation.id}`,
		})
	}

	let result: unknown
	try {
		result = await schema.parseAsync(applyProcessPresets(data, mutation.presets, now))
	} catch(error) {
		throw createError({
			statusCode: 400,
			message: `Ungültige Eingabedaten für Mutation ${mutation.id}`,
			data: error,
		})
	}

	if(mutation.table in processValidators) {
		const validate = processValidators[mutation.table as keyof typeof processValidators]
		result = await validate(
			tx,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			result as any,
			{ ...context, meta: mutation.meta },
		)
	}

	return result
}
