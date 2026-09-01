<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { RepresentationAllowanceEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('organizationItems-organizationItem-representationAllowances')

const { data: organizationItemData } = useFetch(
	() => `/api/organizationItems/${route.params.organizationItem}`,
	{
		default: () => ({
			code: '',
			name: '',
		}),
	},
)

const { data, refresh } = useFetch('/api/representationAllowances', {
	query: {
		organizationItem: route.params.organizationItem,
	},
	default: () => [],
})

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))

const editor = useTemplateRef<typeof RepresentationAllowanceEditor>('editor')

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
		title: t('representationAllowance.remove.title'),
		text: t('representationAllowance.remove.text'),
	})) {
		try {
			await $fetch(`/api/representationAllowances/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('representationAllowance.remove.error.title'),
					text: e.data?.message ?? t('representationAllowance.remove.error.message'),
				})
			}
		}
	}
}

function totalAmount(item: { recipients: { amount: number }[] }) {
	return item.recipients.reduce((sum, recipient) => sum + recipient.amount, 0)
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Organisationseinheit
header
	p.kern-preline {{ organizationItemData.name }} ({{ organizationItemData.code }})
	h1.kern-heading-large {{ $t('representationAllowance.title') }}
.mb-8
	KernText(:text="$t('representationAllowance.menu.description')")
KernTable(
	:caption="$t('representationAllowance.table.caption')"
	create-permission="representationAllowances.create"
	update-permission="representationAllowances.update"
	delete-permission="representationAllowances.delete"
	:columns=`[
		'title',
		'recipients',
		{
			name: 'amount',
			width: '12em',
			class: 'numeric',
		},
		'period',
	]`
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('representationAllowance.field.title') }}
	template(#title-body="{ item }")
		| {{ item.title }}
	template(#recipients-header)
		| {{ $t('representationAllowance.field.recipients') }}
	template(#recipients-body="{ item }")
		span.kern-body(v-if="item.recipients.length === 0") –
		ul(v-else)
			li(
				v-for="recipient of item.recipients"
				:key="recipient.id"
			)
				| {{ formatPerson(recipient.person) }} — {{ formatCurrency(recipient.amount) }}
	template(#amount-header)
		| {{ $t('representationAllowance.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(totalAmount(item)) }}
		br
		span.kern-body.kern-body--small
			| {{ $t(`representationAllowance.periodUnit.${item.periodUnit}`) }}
	template(#period-header)
		| {{ $t('representationAllowance.field.period') }}
	template(#period-body="{ item }")
		template(v-if="item.periodUnit === 'once'")
			| {{ formatDate(item.startDate, 'compact') }}
		template(v-else)
			| {{ formatDate(item.startDate, 'compact') }} –
			| {{ item.endDate ? formatDate(item.endDate, 'compact') : 'unbefristet' }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('representationAllowances.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
RepresentationAllowanceEditor(
	ref="editor"
	:organization-item="route.params.organizationItem"
	:readonly="!authStore.hasPermission('representationAllowances.update', scope).value"
	@refresh="refresh"
)
</template>
