<script setup lang="ts">
import type { ExpenseAuthorization } from '~/types'

const id = useId()

const props = defineProps<{
	/** The plan the payment is made from, for a planned payment. */
	budgetPlan?: string | null
	/** The budget the payment is made from, for a reserve payout. */
	budget?: string | null
	readonly?: boolean
}>()

const model = defineModel<ExpenseAuthorization>({
	required: true,
})

// Only the authorizations of the budget the payment is made from are offered,
// so that the origin the server insists on can never be missed.
watch([ () => props.budgetPlan, () => props.budget ], () => {
	model.value = null
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Ausgabeermächtigung #[span.kern-label__optional - Optional]
	div.kern-hint(
		:id="`${id}-hint`"
	) Nur Ausgabeermächtigungen derselben Herkunft können ausgewählt werden.
	ExpenseAuthorizationSelect(
		:id="id"
		v-model="model"
		:budget-plan="props.budgetPlan"
		:budget="props.budget"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
	)
</template>
