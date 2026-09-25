<script setup lang="ts">
import type { Person } from '~/types'

const id = useId()

const model = defineModel<Person>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('inventoryLoan.input.borrower.label') }}
	PersonSelect(
		:id="id"
		v-model="model"
	)
	p.kern-form-input__hint {{ $t('inventoryLoan.input.borrower.hint') }}
</template>
