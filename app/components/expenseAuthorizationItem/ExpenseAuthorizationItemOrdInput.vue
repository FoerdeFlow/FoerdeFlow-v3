<script setup lang="ts">
const id = useId()

const { t } = useI18n()

const props = defineProps<{
	/** The ordinals of the other items of the authorization, not to be repeated. */
	usedOrds?: number[]
}>()

const model = defineModel<number | null>({
	required: true,
})

const error = computed(() => {
	if(typeof model.value !== 'number' || !Number.isInteger(model.value) || model.value < 1) {
		return t('expenseAuthorizationItem.input.ord.error.invalid')
	}
	if(props.usedOrds?.includes(model.value)) {
		return t('expenseAuthorizationItem.input.ord.error.duplicate')
	}
	return null
})

const describedBy = computed(() => [
	`${id}-hint`,
	error.value ? `${id}-error` : null,
].filter((value) => value !== null).join(' '))
</script>

<template lang="pug">
.kern-form-input(
	:class="{ 'kern-form-input--error': error }"
)
	label.kern-label(
		:for="id"
	) {{ $t('expenseAuthorizationItem.input.ord.label') }}
	.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('expenseAuthorizationItem.input.ord.hint') }}
	input.kern-form-input__input.kern-form-input__input--width-4(
		:id="id"
		v-model.number="model"
		type="text"
		inputmode="numeric"
		:class="{ 'kern-form-input__input--error': error }"
		:aria-describedby="describedBy"
	)
	p.kern-error(
		v-if="error"
		:id="`${id}-error`"
		role="alert"
	)
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-body {{ error }}
</template>
