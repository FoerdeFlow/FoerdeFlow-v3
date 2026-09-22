<script setup lang="ts">
const id = useId()
// Das Gebäude wird als Kennung geführt, weil der Editor genau die zum Speichern
// braucht und ein Gebäude ausser seinem Namen nichts beiträgt.
const model = defineModel<string | null>({
	required: true,
})

const { data } = useFetch('/api/locations')

const buildings = computed(() => (data.value ?? [])
	.filter((item) => item.type === 'building')
	.sort((a, b) => formatLocation(a).localeCompare(formatLocation(b))),
)

const selectModel = computed({
	get: () => model.value ?? '',
	set: (value: string) => {
		model.value = value === '' ? null : value
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('location.input.parent.label') }}
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="selectModel"
		)
			option(
				disabled
				value=""
			) {{ $t('location.select.placeholder') }}
			option(
				v-for="item of buildings"
				:key="item.id"
				:value="item.id"
			) {{ formatLocation(item) }}
</template>
