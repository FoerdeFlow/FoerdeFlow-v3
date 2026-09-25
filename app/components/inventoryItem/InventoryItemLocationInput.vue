<script setup lang="ts">
import type { Location } from '~/types'

const id = useId()

const model = defineModel<Location>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('inventoryItem.input.location.label') }} #[span.kern-label__optional - Optional]
	LocationSelect(
		:id="id"
		v-model="model"
		optional
	)
	p.kern-form-input__hint {{ $t('inventoryItem.input.location.hint') }}
</template>
