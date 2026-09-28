<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	rows?: number
}>()

const model = defineModel<unknown>({
	required: true,
})

/**
 * Whether the text currently parses. While it does not, the model still carries
 * the last value that did, so a form that saves it has to wait for this.
 */
const valid = defineModel<boolean>('valid', {
	default: true,
})

const serialize = (value: unknown) => value === null || value === undefined
	? ''
	: JSON.stringify(value, null, 2)

/** Whether the text stands for the value, so that the model already carries it. */
function represents(source: string, value: unknown) {
	try {
		return JSON.stringify(JSON.parse(source)) === JSON.stringify(value)
	} catch(_error) {
		return false
	}
}

const text = ref(serialize(model.value))
const error = ref<string | null>(null)

function setError(message: string | null) {
	error.value = message
	valid.value = message === null
}

// The text stands on its own instead of being derived from the model, because a
// keystroke in the middle of a document leaves it invalid for a moment. Were it
// derived, that moment would pull the text back to the last value that parsed
// and undo what was just typed.
watch(text, (value) => {
	if(value.trim() === '') {
		setError(null)
		model.value = null
		return
	}
	try {
		model.value = JSON.parse(value)
		setError(null)
	} catch(e: unknown) {
		setError(e instanceof Error ? e.message : 'Ungültiges JSON')
	}
})

// A model that was replaced from the outside — another item was opened for
// editing — is shown as it comes. A model the text itself just wrote is left
// alone, so that typing is not reformatted under the cursor.
watch(model, (value) => {
	if(error.value === null && represents(text.value, value)) return
	text.value = serialize(value)
	setError(null)
})

const describedBy = computed(() => {
	if(error.value) return `${id}-error`
	return props.hint ? `${id}-hint` : undefined
})
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
	textarea.kern-form-input__input(
		:id="id"
		v-model="text"
		:rows="props.rows"
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
