<script setup lang="ts">
const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()
const model = defineModel<string>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('longtermContract.input.title.label') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		type="text"
	)
</template>
