<script setup lang="ts">
import type { WorkflowCustomPersonPhotoFormModel } from '~/types'

defineOptions({
	summaryItems: 1,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	processId?: string
	mutationId?: string
	attachments?: string[]
}>()

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<WorkflowCustomPersonPhotoFormModel>({
	required: true,
})

const photoUrl = computed(() => {
	if(props.processId && props.mutationId) {
		return props.attachments?.includes('photo')
			? `/api/processes/${props.processId}/attachments/${props.mutationId}_photo`
			: null
	}
	return model.value.photo
		? URL.createObjectURL(model.value.photo)
		: null
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'person-photo'")
	p.kern-body
		| Das hier hochgeladene Bild ersetzt nach Abschluss des Prozesses das bisherige Lichtbild.
		| Wird kein Bild ausgewählt, bleibt das bisherige Lichtbild unverändert.
	PersonPhotoInput(v-model="model.photo")
	.mt-8(v-if="model.photo && photoUrl")
		p.kern-body
			| Es wurde ein Foto hochgeladen: {{ model.photo.name }} ({{ (model.photo.size / 1024).toFixed(2) }} KB)
		img.mt-4.max-w-xs.border(
			:src="photoUrl"
			alt="Vorschaubild"
		)
		button.mt-4.kern-btn.kern-btn--secondary(
			type="button"
			@click="model.photo = null"
		)
			span.kern-icon.kern-icon--delete(aria-hidden="true")
			span.kern-label Bild entfernen
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Eigenes Lichtbild"
		:items=`[
			{
				key: 'Lichtbild',
				valueImg: photoUrl || '',
				value: model.photo ? 'neu hochgeladen' : 'unverändert',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'person-photo')"
	)
</template>
