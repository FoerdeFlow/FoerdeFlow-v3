import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItems.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	const organizationItem = await database.query.organizationItems.findFirst({
		where: eq(organizationItems.id, params.organizationItem),
		with: {
			parent: {
				columns: {
					id: true,
					code: true,
					name: true,
					dissolvedAt: true,
				},
				with: {
					organizationType: true,
				},
			},
			children: {
				columns: {
					id: true,
					code: true,
					name: true,
					dissolvedAt: true,
				},
				with: {
					organizationType: true,
				},
				orderBy: (children, { asc }) => [
					asc(children.sortOrder),
					asc(children.name),
				],
			},
			organizationType: true,
		},
	})

	if(!organizationItem) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Organisationseinheit nicht gefunden',
			data: {
				organizationItemId: params.organizationItem,
			},
		})
	}

	/*
	 * Die Seite einer inaktiven Einheit bleibt erreichbar. Ihre inaktiven Kinder
	 * sieht aber nur, wer Einheiten verwaltet, wie in der Übersicht.
	 */
	const today = getToday()
	const inactive = await isOrganizationItemInactive(organizationItem.id, today)
	const includeInactive = canManageOrganizationItems()
	const { parent } = organizationItem

	return {
		...organizationItem,
		inactive,
		hasLogo: existsSync(organizationItemLogoPath(organizationItem.id)),
		/*
		 * Spalte und Relation heißen beide `parent`; Drizzle typisiert das Feld
		 * deshalb als `string & {…}`, das sich nicht ausbreiten lässt.
		 */
		parent: parent
			? {
				id: parent.id,
				code: parent.code,
				name: parent.name,
				dissolvedAt: parent.dissolvedAt,
				organizationType: parent.organizationType,
				inactive: await isOrganizationItemInactive(parent.id, today),
			}
			: null,
		children: organizationItem.children
			.map((child) => ({ ...child, inactive: inactive || isDissolved(child.dissolvedAt, today) }))
			.filter((child) => includeInactive || !child.inactive),
	}
})
