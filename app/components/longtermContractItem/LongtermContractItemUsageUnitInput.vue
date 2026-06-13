<script setup lang="ts">
const id = useId()
const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('longtermContractItem.input.usageUnit.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('longtermContractItem.input.usageUnit.hint') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:aria-describedby="`${id}-hint`"
	)
</template>
