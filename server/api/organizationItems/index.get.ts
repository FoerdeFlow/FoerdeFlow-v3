interface OrganizationItem {
	id: string
	organizationType: {
		id: string
		code: string
		name: string
	}
	code: string
	name: string
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
	const database = useDatabase()

	const organizationItems = (await database.query.organizationItems.findMany({
		with: {
			organizationType: true,
		},
	}))
		.map((item) => ({ ...item, children: [] }))

	return buildTree(organizationItems)
})
