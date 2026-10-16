interface OrganizationItem {
	id: string
	organizationType: {
		id: string
		code: string
		name: string
		sortOrder: number
	}
	code: string
	name: string
	sortOrder: number
	dissolvedAt: string | null
}

interface OrganizationTreeItem extends OrganizationItem {
	/** Whether the unit or one above it is dissolved. */
	inactive: boolean
	children: OrganizationTreeItem[]
}

/*
 * Inaktive Einheiten fallen samt ihrem Teilbaum heraus, wenn `includeInactive`
 * nicht gesetzt ist: Ihre Kinder werden gar nicht erst an den Baum gehängt.
 */
function buildTree(
	items: (OrganizationItem & { parent: string | null })[],
	options: { includeInactive: boolean, today: string },
	parentId: string | null = null,
	parentInactive = false,
): OrganizationTreeItem[] {
	return items
		.filter((item) => item.parent === parentId)
		.map((item) => ({ item, inactive: parentInactive || isDissolved(item.dissolvedAt, options.today) }))
		.filter(({ inactive }) => options.includeInactive || !inactive)
		.map(({ item, inactive }) => ({
			...item,
			inactive,
			children: buildTree(items, options, item.id, inactive),
		}))
}

export default defineEventHandler(async (_event) => {
	await checkPermission('organizationItems.read')

	const database = useDatabase()

	const organizationItems = await database.query.organizationItems.findMany({
		with: {
			organizationType: true,
		},
		orderBy: (organizationItems, { asc }) => [
			asc(organizationItems.sortOrder),
			asc(organizationItems.name),
		],
	})

	return buildTree(organizationItems, {
		includeInactive: canManageOrganizationItems(),
		today: getToday(),
	})
})
