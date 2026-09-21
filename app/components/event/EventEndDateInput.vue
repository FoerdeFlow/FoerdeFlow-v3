<script setup lang="ts">
const id = useId()

const props = defineProps<{
	allDay: boolean
}>()

const model = defineModel<Date | null>({
	required: true,
})

// Ein ganztägiger Termin nennt Tage, kein Termin mit Uhrzeit.
const label = computed(() =>
	props.allDay ? 'event.input.endDate.labelAllDay' : 'event.input.endDate.label')
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ $t(label) }} #[span.kern-label__optional - Optional]
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('event.input.endDate.hint') }}
	KernDateInput(
		:id="id"
		v-model="model"
		:show-time="!props.allDay"
		:aria-describedby="`${id}-hint`"
	)
</template>
