<script setup lang="ts">
import type { LocationType } from '~/types'

const id = useId()
const model = defineModel<LocationType>({
	required: true,
})

// Ein Ad-hoc-Ort entsteht nur beim Termin. In der Verwaltung steht er zur Wahl,
// solange der Ort noch einer ist, damit das Überführen den Typ wechseln kann.
const types = computed(() => {
	const curated: LocationType[] = [ 'building', 'room', 'place', 'external', 'online' ]
	return model.value === 'adHoc' ? [ 'adHoc' as const, ...curated ] : curated
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('location.input.type.label') }}
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="model"
		)
			option(
				v-for="type of types"
				:key="type"
				:value="type"
			) {{ $t(`location.type.${type}`) }}
</template>
