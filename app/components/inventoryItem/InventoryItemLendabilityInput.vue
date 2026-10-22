<script setup lang="ts">
const id = useId()

const model = defineModel<'lendable' | 'notLendable' | 'pendingDisposal'>({
	required: true,
})

const items = [ 'lendable', 'notLendable', 'pendingDisposal' ] as const
</script>

<template lang="pug">
fieldset.kern-fieldset(
	:aria-describedby="`${id}-hint`"
)
	legend.kern-label {{ $t('inventoryItem.input.lendability.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('inventoryItem.input.lendability.hint') }}
	.kern-fieldset__body
		.kern-form-check(
			v-for="item of items"
			:key="item"
		)
			input.kern-form-check__radio(
				:id="`${id}-${item}`"
				v-model="model"
				type="radio"
				:name="id"
				:value="item"
			)
			label.kern-label(
				:for="`${id}-${item}`"
			) {{ $t(`inventoryItem.lendability.${item}`) }}
</template>
