interface OrganizationTreeItem {
	id: string
	organizationType: {
		id: string
		code: string
		name: string
	}
	code: string
	name: string
	children: OrganizationTreeItem[]
}

function buildTree(items: OrganizationTreeItem[], parentId: string | null = null): OrganizationTreeItem[] {
	return items
		// @ts-expect-error
		.filter(item => item.parent === parentId)
		.map(item => ({
			...item,
			children: buildTree(items, item.id),
		}))
}

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const organizationItems = (await database.query.organizationItems.findMany({
		with: {
			organizationType: true,
		},
	}))
		.map(item => ({ ...item, children: [] }))

	return buildTree(organizationItems)
})