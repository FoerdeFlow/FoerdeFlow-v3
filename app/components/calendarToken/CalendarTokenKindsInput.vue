<script setup lang="ts">
const id = useId()
const { t } = useI18n()

const { data } = await useFetch('/api/eventTypes', { default: () => [] })

const model = defineModel<string[]>({ required: true })

// Die Sitzungen stehen neben den Veranstaltungsarten, obwohl sie keine Art
// haben — für die Auswahl sind sie eine.
const options = computed(() => [
	{ value: calendarSessionKind, label: t('calendarToken.kind.session') },
	...data.value.map((eventType) => ({
		value: eventType.id,
		label: formatEventType(eventType),
	})),
])

// Der Zustand kommt aus dem Ereignis und nicht aus dem Template: dessen
// Ausdrücke sind JavaScript, eine TypeScript-Umdeutung schlüge dort zur
// Laufzeit fehl.
function toggle(value: string, event: Event) {
	const { checked } = event.target as HTMLInputElement
	model.value = checked
		? [ ...model.value, value ]
		: model.value.filter((item) => item !== value)
}
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ $t('calendarToken.input.kinds.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('calendarToken.input.kinds.hint') }}
	.kern-fieldset__body(
		:aria-describedby="`${id}-hint`"
	)
		.kern-form-check(
			v-for="option of options"
			:key="option.value"
		)
			input.kern-form-check__checkbox(
				:id="`${id}-${option.value}`"
				type="checkbox"
				:checked="model.includes(option.value)"
				@change="toggle(option.value, $event)"
			)
			label.kern-label(
				:for="`${id}-${option.value}`"
			) {{ option.label }}
</template>
