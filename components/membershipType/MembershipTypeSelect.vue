<script setup lang="ts">
const props = defineProps<{
	id: string
}>()
const model = defineModel()

const { data } = await useFetch('/api/membershipTypes')
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="model"
	)
		option(
			disabled
			value=""
		) - Bitte wählen -
		option(
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ item.name }} ({{ item.code }})
</template>