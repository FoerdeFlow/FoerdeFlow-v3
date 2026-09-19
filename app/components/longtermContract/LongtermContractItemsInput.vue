<script setup lang="ts">
import type { LongtermContractItemEditor } from '#components'
import type { LongtermContractItemType, LongtermContractTimeUnit } from '~/types'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Model = {
	ord: number | null
	type: LongtermContractItemType
	title: string
	description: string | null
	amount: number
	timeUnit: LongtermContractTimeUnit | null
	usageUnit: string | null
	expectedUsage: number | null
}

type IdModel = Model & {
	id: string | symbol | null
}

const { t } = useI18n()

const editor = useTemplateRef<typeof LongtermContractItemEditor>('editor')

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

function formatItemAmount(item: Model) {
	const timeUnit = item.timeUnit ? t(`longtermContractItem.timeUnit.${item.timeUnit}`) : ''
	switch(item.type) {
		case 'time':
			return t('longtermContractItem.amount.time', {
				amount: formatCurrency(item.amount),
				timeUnit,
			})
		case 'usage':
			return t('longtermContractItem.amount.usage', {
				amount: formatCurrency(item.amount),
				usageUnit: item.usageUnit ?? '',
				expectedUsage: item.expectedUsage ?? 0,
				timeUnit,
			})
		case 'fixed':
			return t('longtermContractItem.amount.fixed', {
				amount: formatCurrency(item.amount),
			})
	}
}
</script>

<template lang="pug">
KernTable.w-full(
	:caption="$t('longtermContractItem.table.caption')"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'title',
		},
		{
			name: 'amount',
			width: '16em',
			class: 'numeric',
		},
	]`
	:data="model ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('longtermContractItem.field.title') }}
	template(#title-body="{ item }")
		template(v-if="item.ord")
			span.kern-body--small
				| ({{ item.ord }})
			| &nbsp;
		span.kern-body {{ item.title }}
		template(v-if="item.description")
			br
			span.kern-body.kern-body--small {{ item.description }}
	template(#amount-header)
		| {{ $t('longtermContractItem.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatItemAmount(item) }}
LongtermContractItemEditor(
	ref="editor"
	:used-ords="usedOrds"
	@save="save"
)
</template>
