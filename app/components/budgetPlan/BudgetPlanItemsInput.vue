<script setup lang="ts">
import type { BudgetPlanItemEditor } from '#components'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Model = {
	title: string
	description: string
	revenues: number | null
	expenses: number | null
}

type IdModel = Model & {
	id: string | symbol | null
}

const editor = useTemplateRef<typeof BudgetPlanItemEditor>('editor')

const model = defineModel<IdModel[]>({
	required: true,
})

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit(item: Model) {
	if(!editor.value) return
	editor.value.edit(item)
}

function remove(item: Model) {
	const index = model.value.findIndex((entry) => entry === item)
	if(index === -1) return
	model.value.splice(index, 1)
}

function save(id: string | null, item: Model) {
	if(id) {
		const index = model.value.findIndex((item) => item.id === id)
		if(index === -1) return
		model.value[index] = { id, ...item }
	} else {
		model.value.push({ id: Symbol('newItem'), ...item })
	}
}
</script>

<template lang="pug">
KernTable(
	:caption="$t('budgetPlanItem.table.caption')"
	create-permission="budgetPlans.update"
	update-permission="budgetPlans.update"
	delete-permission="budgetPlans.update"
	:columns=`[
		{
			name: 'revenues',
			width: '8em',
		},
		{
			name: 'title',
		},
		{
			name: 'expenses',
			width: '8em',
		},
	]`
	:data="model ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#revenues-header)
		| {{ $t('budgetPlanItem.field.revenues') }}
	template(#revenues-body="{ item }")
		| {{ formatCurrency(item.revenues) }}
	template(#title-header)
		| {{ $t('budgetPlanItem.field.title') }}
	template(#title-body="{ item }")
		span.kern-body {{ item.title }}
		br
		span.kern-body.kern-body--small {{ item.description }}
	template(#expenses-header)
		| {{ $t('budgetPlanItem.field.expenses') }}
	template(#expenses-body="{ item }")
		| {{ formatCurrency(item.expenses) }}
BudgetPlanItemEditor(
	ref="editor"
	@save="save"
)
</template>
