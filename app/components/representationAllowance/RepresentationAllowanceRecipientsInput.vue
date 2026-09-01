<script setup lang="ts">
import type { RepresentationAllowanceRecipientEditor } from '#components'
import type { Person, RepresentationAllowancePeriodUnit, RepresentationAllowanceRecipientInput } from '~/types'

interface Model {
	ord: number | null
	person: Person
	amount: number
}

const props = defineProps<{
	periodUnit: RepresentationAllowancePeriodUnit
}>()

const editor = useTemplateRef<typeof RepresentationAllowanceRecipientEditor>('editor')

const model = defineModel<RepresentationAllowanceRecipientInput[]>({
	required: true,
})

const total = computed(() => model.value.reduce((sum, item) => sum + (item.amount || 0), 0))

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit(item: RepresentationAllowanceRecipientInput) {
	if(!editor.value) return
	editor.value.edit(item)
}

function remove(item: RepresentationAllowanceRecipientInput) {
	const index = model.value.findIndex((entry) => entry === item)
	if(index === -1) return
	model.value.splice(index, 1)
}

function save(id: string | symbol | null, item: Model) {
	if(id) {
		const index = model.value.findIndex((entry) => entry.id === id)
		if(index === -1) return
		model.value[index] = { id, ...item }
	} else {
		model.value.push({ id: Symbol('newRecipient'), ...item })
	}
}
</script>

<template lang="pug">
KernTable.w-full(
	:caption="$t('representationAllowanceRecipient.table.caption')"
	:create-permission="true"
	:update-permission="true"
	:delete-permission="true"
	:columns=`[
		{
			name: 'person',
		},
		{
			name: 'amount',
			width: '16em',
			class: 'numeric',
		},
	]`
	:data="model ?? []"
	show-footer
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#person-header)
		| {{ $t('representationAllowanceRecipient.field.person') }}
	template(#person-body="{ item }")
		template(v-if="item.ord !== null")
			span.kern-body--small
				| ({{ item.ord }})
			| &nbsp;
		span.kern-body {{ formatPerson(item.person) }}
	template(#amount-header)
		| {{ $t('representationAllowanceRecipient.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#person-footer)
		| {{ $t('representationAllowanceRecipient.field.total') }}
	template(#amount-footer)
		| {{ formatCurrency(total) }}
RepresentationAllowanceRecipientEditor(
	ref="editor"
	:period-unit="props.periodUnit"
	@save="save"
)
</template>
