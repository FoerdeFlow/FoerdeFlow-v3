<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { InventoryItem, Person } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
	// Wird die Ausleihe von einem Gegenstand aus erfasst, steht er schon fest.
	item?: InventoryItem
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)
// Beim Bearbeiten wandert die Ausleihe nicht auf ein anderes Stück: der
// Gegenstand wird dann nur noch angezeigt.
const itemLabel = ref('')
const itemLabelId = useId()

interface Model {
	item: InventoryItem
	borrower: Person
	lentAt: Date | null
	dueAt: Date | null
	note: string | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

async function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	// Die Datumsfelder erst im nächsten Tick füllen, damit KernDateInput nicht
	// die Werte der zuvor bearbeiteten Ausleihe weiterschreibt.
	model.value = null
	await nextTick()
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	async create() {
		itemLabel.value = ''
		await openDialog(null, {
			item: props.item ?? null,
			borrower: null,
			// Die Herausgabe wird im Regelfall erfasst, während sie geschieht.
			lentAt: new Date(),
			dueAt: null,
			note: null,
		})
	},
	async edit(id: string) {
		const loan = await $fetch(`/api/inventoryLoans/${id}`)
		itemLabel.value = formatInventoryItem(loan.item)
		await openDialog(id, {
			// Der Gegenstand steht beim Bearbeiten fest, deshalb bleibt die
			// Auswahl leer und an ihrer Stelle steht sein Name.
			item: null,
			borrower: loan.borrower,
			lentAt: new Date(loan.lentAt),
			dueAt: new Date(loan.dueAt),
			note: loan.note,
		})
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

// Ohne Gegenstand, Entleiher und die beiden Zeitpunkte ist nicht dokumentiert,
// wer was bis wann hat.
const valid = computed(() => Boolean(
	(itemId.value ?? model.value?.item) &&
	model.value?.borrower &&
	model.value.lentAt &&
	model.value.dueAt,
))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			borrower: model.value.borrower?.id ?? null,
			lentAt: model.value.lentAt?.toISOString() ?? null,
			dueAt: model.value.dueAt?.toISOString() ?? null,
			note: model.value.note,
		}
		if(itemId.value) {
			await $fetch(`/api/inventoryLoans/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/inventoryLoans', {
				method: 'POST',
				body: {
					...body,
					item: model.value.item?.id ?? null,
				},
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('inventoryLoan.edit.error.title')
					: t('inventoryLoan.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('inventoryLoan.edit.error.message')
					: t('inventoryLoan.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('inventoryLoan.edit.title') : $t('inventoryLoan.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-form-input(v-if="itemId")
			label.kern-label(
				:for="itemLabelId"
			) {{ $t('inventoryLoan.input.item.label') }}
			input.kern-form-input__input(
				:id="itemLabelId"
				:value="itemLabel"
				readonly
			)
		InventoryLoanItemInput(
			v-else-if="!props.item"
			v-model="model.item"
			:organization-item="props.organizationItem"
		)
		InventoryLoanBorrowerInput(v-model="model.borrower")
		InventoryLoanLentAtInput(v-model="model.lentAt")
		InventoryLoanDueAtInput(v-model="model.dueAt")
		InventoryLoanNoteInput(v-model="model.note")
</template>
