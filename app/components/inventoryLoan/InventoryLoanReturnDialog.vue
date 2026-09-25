<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

interface Loan {
	id: string
	item: { inventoryNumber: string | null, name: string }
	borrower: { firstName: string, lastName: string, callName: string | null }
	note: string | null
}
const loan = ref<Loan | null>(null)

const returnedAt = ref<Date | null>(null)
const note = ref<string | null>(null)

defineExpose({
	async open(item: Loan) {
		if(!dialog.value) return
		loan.value = item
		// Erst im nächsten Tick füllen, damit KernDateInput nicht den Zeitpunkt
		// der zuvor abgeschlossenen Ausleihe weiterschreibt.
		returnedAt.value = null
		note.value = null
		await nextTick()
		// Eine Rückgabe wird erfasst, während sie geschieht.
		returnedAt.value = new Date()
		note.value = item.note
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() => Boolean(returnedAt.value))

async function save() {
	if(!dialog.value || !loan.value || !returnedAt.value) return
	try {
		await $fetch(`/api/inventoryLoans/${loan.value.id}/return`, {
			method: 'POST',
			body: {
				returnedAt: returnedAt.value.toISOString(),
				note: note.value,
			},
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: t('inventoryLoan.return.error.title'),
				text: e.data?.message ?? t('inventoryLoan.return.error.message'),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="$t('inventoryLoan.return.title')"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="loan")
		KernText(
			:text=`$t('inventoryLoan.return.text', {
				item: formatInventoryItem(loan.item),
				borrower: formatPerson(loan.borrower),
			})`
		)
		InventoryLoanReturnedAtInput(v-model="returnedAt")
		InventoryLoanNoteInput(v-model="note")
</template>
