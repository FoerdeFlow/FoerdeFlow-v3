<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	optional?: boolean
	readonly?: boolean
}>()

/** The IBAN without its spaces, which is how it is stored and checked. */
const model = defineModel<string | null>({
	required: true,
})

const text = ref(formatIban(model.value))
const editing = ref(false)

// Values coming from the outside are reformatted, but never while the field is
// being edited, so that the input does not change under the cursor.
watch(model, (value) => {
	if(editing.value) return
	text.value = formatIban(value)
})

const invalid = computed(() =>
	normalizeIban(text.value) !== '' && !isValidIban(text.value))

// While the IBAN is being typed it is incomplete most of the time, so the
// error is only reported once the field is left.
const error = computed(() => !editing.value && invalid.value
	? 'Diese IBAN ist nicht gültig. Bitte prüfen Sie Ihre Eingabe auf Tippfehler.'
	: null)

const describedBy = computed(() => error.value ? `${id}-error` : undefined)

/**
 * Rewrites the input into groups of four while it is typed.
 *
 * The spaces shift the characters behind the caret, so the caret is counted in
 * characters that belong to the IBAN itself and put back where it was.
 *
 * @param event - The input event of the field
 */
function onInput(event: Event) {
	const input = event.target as HTMLInputElement
	const caret = input.selectionStart ?? input.value.length
	const significant = normalizeIban(input.value.slice(0, caret)).length

	const formatted = formatIban(input.value)
	text.value = formatted
	model.value = normalizeIban(formatted) || null

	// The value is written to the element itself, so that the caret can be
	// placed before Vue renders the new value.
	input.value = formatted
	const position = significant + Math.floor(Math.max(significant - 1, 0) / 4)
	input.setSelectionRange(position, position)
}

function onFocus() {
	editing.value = true
}

function onBlur() {
	editing.value = false
	text.value = formatIban(model.value)
}
</script>

<template lang="pug">
.kern-form-input(
	:class="{ 'kern-form-input--error': error }"
)
	label.kern-label(
		:for="id"
	)
		| {{ props.label }}
		template(v-if="props.optional")
			|
			| #[span.kern-label__optional - Optional]
	input.kern-form-input__input(
		:id="id"
		type="text"
		inputmode="text"
		autocomplete="off"
		spellcheck="false"
		maxlength="42"
		:value="text"
		:class="{ 'kern-form-input__input--error': error }"
		:readonly="props.readonly"
		:aria-describedby="describedBy"
		@input="onInput"
		@focus="onFocus"
		@blur="onBlur"
	)
	p.kern-error(
		v-if="error"
		:id="`${id}-error`"
		role="alert"
	)
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-body {{ error }}
</template>
