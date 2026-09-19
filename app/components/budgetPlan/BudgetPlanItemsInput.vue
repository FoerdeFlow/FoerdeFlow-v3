<script setup lang="ts">
import type { BudgetPlanItemEditor } from '#components'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Model = {
	ord: number | null
	title: string
	description: string | null
	revenues: number | null
	expenses: number | null
}

type IdModel = Model & {
	id: string | symbol | null
}

const editor = useTemplateRef<typeof BudgetPlanItemEditor>('editor')

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<IdModel[]>({
	required: true,
})

const revenues = computed(() => budgetPlanTotal(model.value, 'revenues'))
const expenses = computed(() => budgetPlanTotal(model.value, 'expenses'))
const balance = computed(() => budgetPlanBalance(model.value))

// Which entry the editor is working on, so that its own ordinal does not count
// as taken. `undefined` means that a new entry is being created.
const editing = ref<string | symbol | null | undefined>()

const usedOrds = computed(() => model.value
	.filter((item) => item.id !== editing.value)
	.map((item) => item.ord)
	.filter((ord) => ord !== null))

// The balance of the other entries, which the edited one may take over so that
// the plan as a whole adds up.
const otherBalance = computed(() => budgetPlanBalance(
	model.value.filter((item) => item.id !== editing.value),
))

// Ordinals are handed out in steps of ten, so that entries can be squeezed in
// between them later on.
const nextOrd = computed(() => Math.floor(Math.max(0, ...usedOrds.value) / 10) * 10 + 10)

function create() {
	if(!editor.value) return
	editing.value = undefined
	editor.value.create(nextOrd.value)
}

function edit(item: IdModel) {
	if(!editor.value) return
	editing.value = item.id
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
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'revenues',
			width: '8em',
			class: 'numeric',
		},
		{
			name: 'title',
		},
		{
			name: 'expenses',
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
	template(#revenues-header)
		| {{ $t('budgetPlanItem.field.revenues') }}
	template(#revenues-body="{ item }")
		| {{ formatCurrency(item.revenues) }}
	template(#revenues-footer)
		| {{ formatCurrency(revenues) }}
	template(#title-header)
		| {{ $t('budgetPlanItem.field.title') }}
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
		| {{ $t('budgetPlanItem.table.footer') }}
	template(#expenses-header)
		| {{ $t('budgetPlanItem.field.expenses') }}
	template(#expenses-body="{ item }")
		| {{ formatCurrency(item.expenses) }}
	template(#expenses-footer)
		| {{ formatCurrency(expenses) }}
KernAlert(
	v-if="balance !== 0"
	type="warning"
	:dismissible="false"
	:title="$t('budgetPlanItem.balance.title')"
	:text="$t('budgetPlanItem.balance.text', { amount: formatCurrency(Math.abs(balance)) })"
)
BudgetPlanItemEditor(
	ref="editor"
	:used-ords="usedOrds"
	:other-balance="otherBalance"
	@save="save"
)
</template>
