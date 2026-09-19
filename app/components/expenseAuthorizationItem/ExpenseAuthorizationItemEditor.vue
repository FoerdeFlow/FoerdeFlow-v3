<script setup lang="ts">
import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const props = defineProps<{
	/** The ordinals of the other items of the authorization, not to be repeated. */
	usedOrds?: number[]
}>()

const itemId = ref<string | null>(null)

interface Model {
	ord: number | null
	title: string
	description: string | null
	amount: number
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const ordValid = computed(() => {
	const ord = model.value?.ord
	return typeof ord === 'number' && Number.isInteger(ord) && ord >= 1 &&
		!props.usedOrds?.includes(ord)
})

const valid = computed(() => {
	if(!model.value) return false
	return ordValid.value && model.value.title.trim() !== ''
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create(ord: number) {
		openDialog(null, {
			ord,
			title: '',
			description: null,
			amount: 0,
		})
	},
	edit({ id, ...item }: { id: string } & Model) {
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	save: [string | null, Model]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function save() {
	if(!dialog.value || !model.value) return
	dialog.value.hide()
	emit('save', itemId.value, model.value)
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('expenseAuthorizationItem.edit.title') : $t('expenseAuthorizationItem.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		ExpenseAuthorizationItemOrdInput(
			v-model="model.ord"
			:used-ords="props.usedOrds"
		)
		ExpenseAuthorizationItemTitleInput(
			v-model="model.title"
		)
		ExpenseAuthorizationItemAmountInput.flex-1(
			v-model="model.amount"
		)
		ExpenseAuthorizationItemDescriptionInput(
			v-model="model.description"
		)
</template>
