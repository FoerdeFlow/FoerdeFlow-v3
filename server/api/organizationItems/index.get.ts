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
}

interface OrganizationTreeItem extends OrganizationItem {
	children: OrganizationTreeItem[]
}

function buildTree(
	items: (OrganizationItem & { parent: string | null })[],
	parentId: string | null = null,
): OrganizationTreeItem[] {
	return items
		.filter((item) => item.parent === parentId)
		.map((item) => ({
			...item,
			children: buildTree(items, item.id),
		}))
}

export default defineEventHandler(async (_event) => {
	await checkPermission('organizationItems.read')

	const database = useDatabase()

	const organizationItems = (await database.query.organizationItems.findMany({
		with: {
			organizationType: true,
		},
		orderBy: (organizationItems, { asc }) => [
			asc(organizationItems.sortOrder),
			asc(organizationItems.name),
		],
	}))
		.map((item) => ({ ...item, children: [] }))

	return buildTree(organizationItems)
})
