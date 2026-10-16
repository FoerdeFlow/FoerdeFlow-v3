import { eq } from 'drizzle-orm'

const berlinDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' })

/**
 * Today in Berlin, in the form a `date` column holds. A unit dissolved as of
 * today counts as inactive from midnight Berlin time, not from midnight UTC.
 *
 * @returns The date as `YYYY-MM-DD`
 */
export function getToday() {
	return berlinDate.format(new Date())
}

/**
 * Whether a unit is dissolved by its own date. A unit below a dissolved one is
 * inactive as well; see {@link isOrganizationItemInactive}.
 *
 * @param dissolvedAt - The day the unit is dissolved from, if any
 * @param today - The day to check against, as `YYYY-MM-DD`
 * @returns Whether the day has come
 */
export function isDissolved(dissolvedAt: string | null, today = getToday()) {
	return dissolvedAt !== null && dissolvedAt <= today
}

/**
 * Whether the unit or one above it is dissolved.
 *
 * @param id - The unit to check
 * @param today - The day to check against, as `YYYY-MM-DD`
 * @returns Whether the unit is inactive
 */
export async function isOrganizationItemInactive(id: string, today = getToday()) {
	const database = useDatabase()
	for(let current: string | null = id; current;) {
		const item: { parent: string | null, dissolvedAt: string | null } | undefined =
			await database.query.organizationItems.findFirst({
				where: eq(organizationItems.id, current),
				columns: { parent: true, dissolvedAt: true },
			})
		if(!item) return false
		if(isDissolved(item.dissolvedAt, today)) return true
		current = item.parent
	}
	return false
}

/**
 * Whether the current user manages the units and therefore still sees the
 * inactive ones. The same rule decides whether the overview offers the table.
 *
 * @returns Whether the user holds a global permission to manage units
 */
export function canManageOrganizationItems() {
	return ([
		'organizationItems.create',
		'organizationItems.update',
		'organizationItems.delete',
	] as const).some((permission) => hasPermission(permission))
}
