<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	readonly?: boolean
}>()

const model = defineModel<number | null>({
	required: true,
})

const text = ref(formatCurrencyAmount(model.value))
const editing = ref(false)

// Values coming from the outside are reformatted, but never while the field is
// being edited, so that the input does not change under the cursor.
watch(model, (value) => {
	if(editing.value) return
	text.value = formatCurrencyAmount(value)
})

const invalid = computed(() => text.value.trim() !== '' && parseCurrency(text.value) === null)

// While the amount is being typed it is incomplete most of the time, so the
// error is only reported once the field is left.
const error = computed(() => !editing.value && invalid.value
	? 'Bitte geben Sie einen Betrag in der Form 1.234,56 ein.'
	: null)

const describedBy = computed(() => [
	`${id}-unit`,
	props.hint ? `${id}-hint` : null,
	error.value ? `${id}-error` : null,
].filter((value) => value !== null).join(' '))

function onInput() {
	model.value = parseCurrency(text.value)
}

function onFocus(event: FocusEvent) {
	editing.value = true
	// Selecting the amount allows to overwrite a preset value right away.
	;(event.target as HTMLInputElement).select()
}

function onBlur() {
	editing.value = false
	if(invalid.value) return
	text.value = formatCurrencyAmount(model.value)
}

// The decimal key of the numeric keypad types a dot, which is the thousands
// separator here, so it is replaced by the decimal comma.
function onKeydown(event: KeyboardEvent) {
	if(event.code !== 'NumpadDecimal' || props.readonly) return
	event.preventDefault()
	const input = event.target as HTMLInputElement
	const start = input.selectionStart ?? input.value.length
	const end = input.selectionEnd ?? start
	// The value is written to the element itself so that the caret keeps its
	// place; the patch of the model afterwards leaves the element untouched.
	input.value = `${input.value.slice(0, start)},${input.value.slice(end)}`
	input.setSelectionRange(start + 1, start + 1)
	text.value = input.value
	onInput()
}
</script>

<template lang="pug">
.kern-form-input(
	:class="{ 'kern-form-input--error': error }"
)
	label.kern-label(
		:for="id"
	) {{ props.label }}
	.kern-hint(
		v-if="props.hint"
		:id="`${id}-hint`"
	) {{ props.hint }}
	.flex.items-center.gap-2
		input.kern-form-input__input(
			:id="id"
			v-model="text"
			type="text"
			inputmode="decimal"
			autocomplete="off"
			:class="{ 'kern-form-input__input--error': error }"
			:readonly="props.readonly"
			:aria-describedby="describedBy"
			@input="onInput"
			@focus="onFocus"
			@blur="onBlur"
			@keydown="onKeydown"
		)
		span.kern-body(
			:id="`${id}-unit`"
		) €
	p.kern-error(
		v-if="error"
		:id="`${id}-error`"
		role="alert"
	)
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-body {{ error }}
</template>
