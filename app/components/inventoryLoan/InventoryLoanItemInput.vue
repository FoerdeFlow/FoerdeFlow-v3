<script setup lang="ts">
import type { InventoryItem } from '~/types'

const props = defineProps<{
	organizationItem: string
}>()

const id = useId()

const model = defineModel<InventoryItem>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('inventoryLoan.input.item.label') }}
	InventoryItemSelect(
		:id="id"
		v-model="model"
		:organization-item="props.organizationItem"
	)
</template>
