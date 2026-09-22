<script setup lang="ts">
import type { Location } from '~/types'

const props = defineProps<{
	organizationItem: string
}>()

const id = useId()
const model = defineModel<Location>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('event.input.location.label') }}
	LocationSelect(
		:id="id"
		v-model="model"
		:organization-item="props.organizationItem"
		optional
	)
</template>
