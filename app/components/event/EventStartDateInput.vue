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
	props.allDay ? 'event.input.startDate.labelAllDay' : 'event.input.startDate.label')
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ $t(label) }}
	KernDateInput(
		:id="id"
		v-model="model"
		:show-time="!props.allDay"
	)
</template>
