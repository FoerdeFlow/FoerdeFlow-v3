<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { LongtermContractEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('budgets-budget-longtermContracts')

const { data: budgetData } = useFetch(`/api/budgets/${route.params.budget}`)

const { data, refresh } = useFetch('/api/longtermContracts', {
	query: {
		budget: route.params.budget,
	},
	default: () => [],
})

const editor = useTemplateRef<typeof LongtermContractEditor>('editor')

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
		title: t('longtermContract.remove.title'),
		text: t('longtermContract.remove.text'),
	})) {
		try {
			await $fetch(`/api/longtermContracts/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('longtermContract.remove.error.title'),
					text: e.data?.message ?? t('longtermContract.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => {
	const organizationItem = budgetData.value?.organizationItem
	return {
		organizationItem: typeof organizationItem === 'string'
			? organizationItem
			: organizationItem?.id ?? '',
	}
})

function openAsPdf({ id }: { id: string }) {
	window.open(`/api/longtermContracts/${id}/pdf`, '_blank')
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'budgets-budget',
			params: { budget: route.params.budget },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Haushalt
h1.kern-heading-large {{ $t('longtermContract.title') }}
KernTable(
	:caption="$t('longtermContract.table.caption')"
	create-permission="longtermContracts.create"
	update-permission="longtermContracts.update"
	delete-permission="longtermContracts.delete"
	:columns="[ 'title', 'startDate', 'endDate' ]"
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('longtermContract.field.title') }}
	template(#title-body="{ item }")
		| {{ item.title }}
	template(#startDate-header)
		| {{ $t('longtermContract.field.startDate') }}
	template(#startDate-body="{ item }")
		| {{ formatDate(item.startDate, 'compact') }}
	template(#endDate-header)
		| {{ $t('longtermContract.field.endDate') }}
	template(#endDate-body="{ item }")
		| {{ item.endDate ? formatDate(item.endDate, 'compact') : 'unbefristet' }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('longtermContracts.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
		button.kern-btn.kern-btn--tertiary(
			@click="openAsPdf(item)"
		)
			span.kern-icon.kern-icon--open-in-new(aria-hidden="true")
			span.kern-label.kern-sr-only Als PDF öffnen
LongtermContractEditor(
	ref="editor"
	:budget="route.params.budget"
	:readonly="!authStore.hasPermission('longtermContracts.update', scope).value"
	@refresh="refresh"
)
</template>
