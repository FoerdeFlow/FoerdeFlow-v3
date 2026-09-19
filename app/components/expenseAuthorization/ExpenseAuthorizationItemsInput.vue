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

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<IdModel[]>({
	required: true,
})

// Which entry the editor is working on, so that its own ordinal does not count
// as taken. `undefined` means that a new entry is being created.
const editing = ref<string | symbol | null | undefined>()

const usedOrds = computed(() => model.value
	.filter((item) => item.id !== editing.value)
	.map((item) => item.ord)
	.filter((ord) => ord !== null))

const total = computed(() => currencySum(...model.value.map((item) => item.amount)))

// The total of the other entries, which the edited one may top up to the
// total entered above.
const otherTotal = computed(() => currencySum(...model.value
	.filter((item) => item.id !== editing.value)
	.map((item) => item.amount)))

// The total the breakdown is meant to reach. It is only an aid for filling in
// the amounts and is therefore not part of the model.
const fillTotal = ref<number | null>(null)

// The amount the edited entry has to carry so that the breakdown reaches it.
const fillAmount = computed(() => fillTotal.value === null
	? null
	: currencySum(fillTotal.value, -otherTotal.value))

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
.kern-fieldset__body.kern-fieldset__body--horizontal
	ExpenseAuthorizationAmountInput.flex-1(
		:model-value="total"
		:readonly="true"
	)
	ExpenseAuthorizationFillTotalInput.flex-1(
		v-if="!props.readonly"
		v-model="fillTotal"
	)
KernTable(
	:caption="$t('expenseAuthorizationItem.table.caption')"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
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
		| {{ formatCurrency(total) }}
ExpenseAuthorizationItemEditor(
	ref="editor"
	:used-ords="usedOrds"
	:fill-amount="fillAmount"
	@save="save"
)
</template>
