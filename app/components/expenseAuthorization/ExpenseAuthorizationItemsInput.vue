<script setup lang="ts">
import type { ExpenseAuthorizationItemEditor } from '#components'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Model = {
	ord: number | null
	title: string
	description: string | null
	amount: number
}

type IdModel = Model & {
	id: string | symbol | null
}

const editor = useTemplateRef<typeof ExpenseAuthorizationItemEditor>('editor')

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
	:caption="$t('expenseAuthorizationItem.table.caption')"
	:create-permission="true"
	:update-permission="true"
	:delete-permission="true"
	:columns=`[
		{
			name: 'title',
		},
		{
			name: 'amount',
			width: '8em',
			class: 'numeric',
		},
	]`
	:data="model ?? []"
	show-footer
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('expenseAuthorizationItem.field.title') }}
	template(#title-body="{ item }")
		template(v-if="item.ord")
			span.kern-body--small
				| ({{ item.ord }})
			| &nbsp;
		span.kern-body {{ item.title }}
		template(v-if="item.description")
			br
			span.kern-body.kern-body--small {{ item.description }}
	template(#title-footer)
		| {{ $t('expenseAuthorizationItem.table.footer') }}
	template(#amount-header)
		| {{ $t('expenseAuthorizationItem.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#amount-footer)
		| {{ formatCurrency(model.map(item => item.amount ?? 0).reduce((a, b) => a + b, 0)) }}
ExpenseAuthorizationItemEditor(
	ref="editor"
	@save="save"
)
</template>
