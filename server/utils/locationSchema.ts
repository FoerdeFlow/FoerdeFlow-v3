import { z } from 'zod'

function emptyToNull(value: string | null | undefined) {
	const text = value?.trim() ?? ''
	return text === '' ? null : text
}

const nameSchema = z.string().trim().min(1).max(256)
const codeSchema = z.string().max(16).nullish().transform(emptyToNull)
const capacitySchema = z.number().int().positive().nullish().transform((value) => value ?? null)
const postalAddressSchema = z.string().trim().min(1).max(256)
const urlSchema = z.url().max(1024)
const optionalTextSchema = z.string().max(256).nullish().transform(emptyToNull)
const optionalUrlSchema = z.string().max(1024).nullish()
	.transform(emptyToNull)
	.refine(
		(value) => value === null || z.url().safeParse(value).success,
		'Der Link ist keine gültige Internetadresse',
	)

/**
 * The body of a location, as one variant per kind.
 *
 * The variants mirror the `valid_location_type` check of the table, so that a
 * wrong combination of fields is refused as invalid input instead of running
 * into the constraint. A code is optional everywhere: only a room or a building
 * of the university carries one.
 */
export const locationBodySchema = z.discriminatedUnion('type', [
	z.strictObject({
		type: z.literal('building'),
		code: codeSchema,
		name: nameSchema,
		postalAddress: postalAddressSchema,
	}),
	z.strictObject({
		type: z.literal('room'),
		parent: idSchema,
		code: codeSchema,
		name: nameSchema,
		// Negative Stockwerke stehen für das Untergeschoss.
		level: z.number().int(),
		capacity: capacitySchema,
	}),
	z.strictObject({
		type: z.literal('place'),
		code: codeSchema,
		name: nameSchema,
		postalAddress: postalAddressSchema,
		capacity: capacitySchema,
	}),
	z.strictObject({
		type: z.literal('external'),
		code: codeSchema,
		name: nameSchema,
		postalAddress: postalAddressSchema,
		capacity: capacitySchema,
	}),
	z.strictObject({
		type: z.literal('online'),
		code: codeSchema,
		name: nameSchema,
		url: urlSchema,
	}),
	// Ein Ad-hoc-Ort verlangt nur einen Namen, damit niemand beim Eintragen
	// eines Termins an einem Pflichtfeld hängen bleibt.
	z.strictObject({
		type: z.literal('adHoc'),
		organizationItem: idSchema,
		name: nameSchema,
		postalAddress: optionalTextSchema,
		url: optionalUrlSchema,
	}),
])

export type LocationBody = z.infer<typeof locationBodySchema>

/**
 * Spreads a location body over every column of the table.
 *
 * The columns a variant does not carry are set to null rather than left out, so
 * that the same object also serves an update: turning an ad-hoc location into a
 * proper one has to clear the fields the new kind does not use.
 *
 * @param body - The parsed body of the location
 * @returns The values of every column of the table
 */
export function toLocationValues(body: LocationBody) {
	return {
		type: body.type,
		parent: 'parent' in body ? body.parent : null,
		organizationItem: 'organizationItem' in body ? body.organizationItem : null,
		code: 'code' in body ? body.code : null,
		name: body.name,
		level: 'level' in body ? body.level : null,
		capacity: 'capacity' in body ? body.capacity : null,
		postalAddress: 'postalAddress' in body ? body.postalAddress : null,
		url: 'url' in body ? body.url : null,
	}
}
