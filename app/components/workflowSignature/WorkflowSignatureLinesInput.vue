<script setup lang="ts">
interface Line {
	label: string
	hint: string | null
}

const id = useId()

const model = defineModel<Line[]>({
	required: true,
})

function add() {
	model.value.push({ label: '', hint: null })
}

function remove(index: number) {
	model.value.splice(index, 1)
}
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Unterschriftenzeilen
	div.kern-hint(
		:id="`${id}-hint`"
	) Je Zeile entsteht im PDF eine Unterschriftslinie mit einem Feld für Ort und Datum.
	.mb-4(
		v-for="(line, index) of model"
		:key="index"
	)
		.flex.items-end.gap-2
			.kern-form-input.flex-1
				label.kern-label(
					:for="`${id}-label-${index}`"
				) Beschriftung
				input.kern-form-input__input(
					:id="`${id}-label-${index}`"
					v-model="line.label"
					type="text"
				)
			button.kern-btn.kern-btn--tertiary(
				type="button"
				@click="remove(index)"
			)
				span.kern-icon.kern-icon--delete(aria-hidden="true")
				span.kern-label.kern-sr-only Zeile entfernen
		.kern-form-input
			label.kern-label(
				:for="`${id}-lineHint-${index}`"
			) Zusatz #[span.kern-label__optional - Optional]
			input.kern-form-input__input(
				:id="`${id}-lineHint-${index}`"
				v-model="line.hint"
				type="text"
			)
	button.kern-btn.kern-btn--secondary(
		type="button"
		@click="add()"
	)
		span.kern-icon.kern-icon--add(aria-hidden="true")
		span.kern-label Zeile hinzufügen
</template>
