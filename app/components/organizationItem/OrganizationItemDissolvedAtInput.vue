<script setup lang="ts">
const id = useId()

const model = defineModel<Date | null>({
	required: true,
})
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Aufgelöst ab #[span.kern-label__optional - Optional]
	div.kern-hint(
		:id="`${id}-hint`"
	)
		| Ab diesem Tag gilt die Organisationseinheit samt ihrer Untereinheiten als inaktiv.
		| Sie erscheint dann nur noch für Personen, die Organisationseinheiten verwalten,
		| in Listen und Auswahlfeldern.
	KernDateInput(
		:id="id"
		v-model="model"
		:show-time="false"
		:aria-describedby="`${id}-hint`"
	)
</template>
