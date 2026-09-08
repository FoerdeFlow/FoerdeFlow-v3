<script setup lang="ts">
import type { WorkflowCustomPersonIbanFormModel } from '~/types'

defineOptions({
	summaryItems: 1,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<WorkflowCustomPersonIbanFormModel>({
	required: true,
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'person-iban'")
	p.kern-body
		| Auf dieses Konto werden Erstattungen und Aufwandsentschädigungen ausgezahlt. Wird das Feld leer gelassen, ist keine Bankverbindung hinterlegt.
	.kern-row
		.kern-col-12
			PersonIbanInput(
				v-model="model.iban"
				:readonly="presets.readonly('iban')"
			)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Bankverbindung"
		:items=`[
			{
				key: 'IBAN',
				value: formatIban(model.iban) || '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'person-iban')"
	)
</template>
