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
	) Online-Ort
	LocationSelect(
		:id="id"
		v-model="model"
		:organization-item="props.organizationItem"
		kind="online"
		optional
	)
</template>
