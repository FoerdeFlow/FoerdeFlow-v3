<script setup lang="ts">
const id = useId()

const { data } = await useFetch('/api/travelRoles', { default: () => [] })

/** The ids of the roles, none means every role. */
const model = defineModel<string[]>({ required: true })

// The state is taken from the event, not from the template: its expressions are
// JavaScript, a TypeScript cast there would fail at runtime.
function toggle(role: string, event: Event) {
	const { checked } = event.target as HTMLInputElement
	model.value = checked
		? [ ...model.value, role ]
		: model.value.filter((item) => item !== role)
}
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Dienstreiserollen #[span.kern-label__optional - Optional]
	div.kern-hint(
		:id="`${id}-hint`"
	) Nur in den gewählten Rollen kann der Grund angegeben werden. Ohne Auswahl gilt er für alle Rollen.
	.kern-fieldset__body(
		:aria-describedby="`${id}-hint`"
	)
		.kern-form-check(
			v-for="role of data"
			:key="role.id"
		)
			input.kern-form-check__checkbox(
				:id="`${id}-${role.id}`"
				type="checkbox"
				:checked="model.includes(role.id)"
				@change="toggle(role.id, $event)"
			)
			label.kern-label(
				:for="`${id}-${role.id}`"
			) {{ formatTravelCoded(role) }}
</template>
