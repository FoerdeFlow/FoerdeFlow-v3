<script setup lang="ts">
const id = useId()

const { data } = await useFetch('/api/travelTransportModes', { default: () => [] })

/** The ids of the means of transport, at least one. */
const model = defineModel<string[]>({ required: true })

// The state is taken from the event, not from the template: its expressions are
// JavaScript, a TypeScript cast there would fail at runtime.
function toggle(transportMode: string, event: Event) {
	const { checked } = event.target as HTMLInputElement
	model.value = checked
		? [ ...model.value, transportMode ]
		: model.value.filter((item) => item !== transportMode)
}
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Verkehrsmittel
	div.kern-hint(
		:id="`${id}-hint`"
	) Für diese Verkehrsmittel kann der Grund angegeben werden.
	.kern-fieldset__body(
		:aria-describedby="`${id}-hint`"
	)
		.kern-form-check(
			v-for="transportMode of data"
			:key="transportMode.id"
		)
			input.kern-form-check__checkbox(
				:id="`${id}-${transportMode.id}`"
				type="checkbox"
				:checked="model.includes(transportMode.id)"
				@change="toggle(transportMode.id, $event)"
			)
			label.kern-label(
				:for="`${id}-${transportMode.id}`"
			) {{ formatTravelCoded(transportMode) }}
</template>
