<script setup lang="ts">
import type { RepresentationAllowancePeriodUnit } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<RepresentationAllowancePeriodUnit>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('representationAllowance.input.periodUnit.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('representationAllowance.input.periodUnit.hint') }}
	RepresentationAllowancePeriodUnitSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
	)
</template>
