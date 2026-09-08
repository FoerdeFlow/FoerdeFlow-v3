<script setup lang="ts">
import type { Person } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<Person>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Empfangendes Mitglied
	div.kern-hint(
		:id="`${id}-hint`"
	) Die Bankverbindung wird der hinterlegten Bankverbindung dieser Person entnommen.
	PersonSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
	)
</template>
