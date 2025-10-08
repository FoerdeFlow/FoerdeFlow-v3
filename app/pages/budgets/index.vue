<script setup lang="ts">
import { FetchError } from 'ofetch'
import { BudgetEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/budgets')

const editor = useTemplateRef<typeof BudgetEditor>('editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('budget.remove.title'),
		text: t('budget.remove.text'),
	})) {
		try {
			await $fetch(`/api/budgets/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('budget.remove.error.title'),
					text: e.data?.message ?? t('budget.remove.error.message'),
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large {{ $t('budget.title') }}
KernTable(
	:caption="$t('budget.table.caption')"
	create-permission="budgets.create"
	update-permission="budgets.update"
	delete-permission="budgets.delete"
	show-actions
	:columns="[ 'name' ]"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| {{ $t('budget.field.name') }} ({{ $t('budget.field.code') }})
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'budgets-budget', params: { budget: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
BudgetEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
