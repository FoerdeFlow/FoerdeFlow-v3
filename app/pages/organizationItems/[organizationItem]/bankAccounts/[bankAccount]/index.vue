<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { BankStatementUploadDialog, BankTransactionAssignmentDialog } from '#components'

const route = useRoute('organizationItems-organizationItem-bankAccounts-bankAccount')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data: account, refresh: refreshAccount } = useFetch(`/api/bankAccounts/${route.params.bankAccount}`)

const { data: transactions, refresh: refreshTransactions } = useFetch('/api/bankTransactions', {
	query: { bankAccount: route.params.bankAccount },
	default: () => [],
})

const { data: statements, refresh: refreshStatements } = useFetch('/api/bankStatements', {
	query: { bankAccount: route.params.bankAccount },
	default: () => [],
})

async function refresh() {
	await Promise.all([ refreshAccount(), refreshTransactions(), refreshStatements() ])
}

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))

const uploadAllowed = authStore.hasPermission('bankTransactions.create', scope.value)
const assignAllowed = authStore.hasPermission('bankTransactions.update', scope.value)

// Der Kontostand ist der Endsaldo des zuletzt erstellten Auszugs.
const balance = computed(() => {
	const statement = account.value?.latestStatement
	if(!statement) return null
	return {
		date: formatDate(statement.toDate ?? statement.createdAt, 'compact'),
		amount: formatCurrency(statement.closingBalance, 'amount'),
	}
})

const withStatus = computed(() => transactions.value.map((transaction) => ({
	...transaction,
	status: getBankTransactionStatus(transaction),
})))

const open = computed(() => withStatus.value.filter((transaction) => transaction.status !== 'assigned'))
const openAmount = computed(() => currencySum(...open.value.map((transaction) =>
	currencySum(transaction.amount, -transaction.assignedAmount))))

const searchId = useId()
const statusId = useId()
const directionId = useId()
const fromId = useId()
const toId = useId()

const search = ref('')
const status = ref<BankTransactionStatus | ''>('')
const direction = ref<'credit' | 'debit' | ''>('')
const from = ref('')
const to = ref('')

const filterActive = computed(() =>
	[ search.value, status.value, direction.value, from.value, to.value ].some(Boolean))

function resetFilter() {
	search.value = ''
	status.value = ''
	direction.value = ''
	from.value = ''
	to.value = ''
}

function describeAssignment(assignment: (typeof transactions.value)[number]['assignments'][number]) {
	if(!assignment.budgetPlanItem) {
		return t('bankTransaction.reserve', { budget: formatBudget(assignment.budget) })
	}
	const { plan } = assignment.budgetPlanItem
	return `${formatBudget(plan.budget)}: ${formatBudgetPlanItem(assignment.budgetPlanItem)}`
}

// Jedes Wort der Suche muss in einem der Felder vorkommen, wie bei den Terminen.
const filtered = computed(() => {
	const words = search.value.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
	return withStatus.value.filter((transaction) => {
		if(status.value && transaction.status !== status.value) return false
		if(direction.value && transaction.direction !== direction.value) return false
		if(from.value && transaction.bookingDate < from.value) return false
		if(to.value && transaction.bookingDate > to.value) return false
		const text = [
			transaction.counterpartyName,
			transaction.counterpartyIban,
			transaction.purpose,
			transaction.additionalInfo,
			transaction.endToEndId,
			formatCurrencyAmount(transaction.amount),
			...transaction.assignments.map((assignment) => [
				describeAssignment(assignment),
				assignment.paymentOrder?.title,
				assignment.note,
			].join('\n')),
		].join('\n').toLocaleLowerCase('de')
		return words.every((word) => text.includes(word))
	})
})

const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Die Zahlungen kommen nach Buchungstag absteigend, die Monate also auch.
const months = computed(() => [ ...new Set(filtered.value.map((transaction) => transaction.bookingDate.slice(0, 7))) ])
const groups = computed(() => months.value.map((month) => ({
	key: month,
	label: monthFormatter.format(new Date(`${month}-01T00:00:00Z`)),
	includes: (transaction: { bookingDate: string }) => transaction.bookingDate.startsWith(month),
})))

const uploadDialog = useTemplateRef<typeof BankStatementUploadDialog>('uploadDialog')
const assignmentDialog = useTemplateRef<typeof BankTransactionAssignmentDialog>('assignmentDialog')

function upload() {
	if(!uploadDialog.value) return
	uploadDialog.value.show()
}

async function assign(transaction: (typeof transactions.value)[number]) {
	if(!assignmentDialog.value) return
	try {
		await assignmentDialog.value.assign(transaction)
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: t('bankTransaction.assign.error.title'),
				text: e.data?.message ?? t('bankTransaction.assign.error.message'),
			})
		}
	}
}

function download({ id }: { id: string }) {
	window.open(`/api/bankStatements/${id}/xml`, '_blank')
}

async function removeStatement({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('bankStatement.remove.title'),
		text: t('bankStatement.remove.text'),
	})) {
		try {
			await $fetch(`/api/bankStatements/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('bankStatement.remove.error.title'),
					text: e.data?.message ?? t('bankStatement.remove.error.message'),
				})
			}
		}
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem-bankAccounts',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu den Bankkonten
header.mb-8
	p.kern-preline {{ $t('bankAccount.title') }}
	h1.kern-heading-large {{ account?.name }}
	p.kern-body--large {{ formatIban(account?.iban ?? null) }}
	p.kern-body(v-if="balance") {{ $t('bankAccount.balance', balance) }}
	p.kern-body(v-else) {{ $t('bankAccount.noStatement') }}
	p.kern-body(v-if="open.length > 0")
		| {{ $t('bankAccount.unassigned', { count: open.length, amount: formatCurrency(openAmount, 'amount') }) }}
	p.kern-body(v-else-if="transactions.length > 0") {{ $t('bankAccount.allAssigned') }}
.mb-8(v-if="uploadAllowed")
	button.kern-btn.kern-btn--primary(
		type="button"
		@click="upload()"
	)
		span.kern-icon.kern-icon--drive-folder-upload(aria-hidden="true")
		span.kern-label {{ $t('bankStatement.upload.button') }}
.ff3-transaction-filter.mb-8
	.kern-form-input
		label.kern-label(:for="searchId") {{ $t('bankTransaction.filter.search') }}
		.flex.flex-row.gap-2.w-full
			input.flex-1.kern-form-input__input(
				:id="searchId"
				v-model="search"
				type="text"
				:placeholder="$t('bankTransaction.filter.searchPlaceholder')"
			)
			button.kern-btn.kern-btn--tertiary(
				v-if="search"
				@click="search = ''"
			)
				span.kern-icon.kern-icon--close(aria-hidden="true")
				span.kern-label.kern-sr-only {{ $t('bankTransaction.filter.searchReset') }}
	.kern-form-input
		label.kern-label(:for="statusId") {{ $t('bankTransaction.filter.status') }}
		.kern-form-input__select-wrapper
			select.kern-form-input__select(
				:id="statusId"
				v-model="status"
			)
				option(value="") {{ $t('bankTransaction.filter.allStatus') }}
				option(value="unassigned") {{ $t('bankTransaction.status.unassigned') }}
				option(value="partial") {{ $t('bankTransaction.status.partial') }}
				option(value="assigned") {{ $t('bankTransaction.status.assigned') }}
	.kern-form-input
		label.kern-label(:for="directionId") {{ $t('bankTransaction.filter.direction') }}
		.kern-form-input__select-wrapper
			select.kern-form-input__select(
				:id="directionId"
				v-model="direction"
			)
				option(value="") {{ $t('bankTransaction.direction.all') }}
				option(value="credit") {{ $t('bankTransaction.direction.credit') }}
				option(value="debit") {{ $t('bankTransaction.direction.debit') }}
	.kern-form-input
		label.kern-label(:for="fromId") {{ $t('bankTransaction.filter.from') }}
		input.kern-form-input__input(
			:id="fromId"
			v-model="from"
			type="date"
		)
	.kern-form-input
		label.kern-label(:for="toId") {{ $t('bankTransaction.filter.to') }}
		input.kern-form-input__input(
			:id="toId"
			v-model="to"
			type="date"
		)
	button.kern-btn.kern-btn--secondary.self-end(
		v-if="filterActive"
		type="button"
		@click="resetFilter()"
	)
		span.kern-icon.kern-icon--close(aria-hidden="true")
		span.kern-label {{ $t('bankTransaction.filter.reset') }}
KernTable(
	:caption="$t('bankTransaction.table.caption')"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:show-actions="assignAllowed"
	:columns=`[
		'bookingDate',
		'counterparty',
		'purpose',
		{ name: 'amount', class: 'numeric' },
		'status',
		'assignments',
	]`
	:data="filtered"
	:groups="groups"
	:scope="scope"
)
	template(#bookingDate-header)
		| {{ $t('bankTransaction.field.bookingDate') }}
	template(#bookingDate-body="{ item }")
		| {{ formatDate(item.bookingDate, 'compact') }}
	template(#counterparty-header)
		| {{ $t('bankTransaction.field.counterparty') }}
	template(#counterparty-body="{ item }")
		template(v-if="item.counterpartyName")
			| {{ item.counterpartyName }}
			template(v-if="item.counterpartyIban")
				br
				span.kern-body--small {{ formatIban(item.counterpartyIban) }}
		template(v-else)
			| {{ item.additionalInfo ?? '–' }}
	template(#purpose-header)
		| {{ $t('bankTransaction.field.purpose') }}
	template(#purpose-body="{ item }")
		| {{ item.purpose ?? '' }}
	template(#amount-header)
		| {{ $t('bankTransaction.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(getSignedAmount(item), 'amount') }}
		template(v-if="item.reversal")
			br
			span.kern-badge.kern-badge--info
				span.kern-label.kern-label--small {{ $t('bankTransaction.reversal') }}
	template(#status-header)
		| {{ $t('bankTransaction.field.status') }}
	template(#status-body="{ item }")
		BankTransactionStatusBadge(:status="item.status")
	template(#assignments-header)
		| {{ $t('bankTransaction.field.assignments') }}
	template(#assignments-body="{ item }")
		template(
			v-for="(assignment, index) of item.assignments"
			:key="assignment.id"
		)
			br(v-if="index > 0")
			span
				| {{ describeAssignment(assignment) }}:
				| {{ formatCurrency(assignment.amount, 'amount') }}
				template(v-if="assignment.paymentOrder")
					|
					| ({{ $t('bankTransaction.assign.paymentOrder') }} „{{ assignment.paymentOrder.title }}“)
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="assignAllowed"
			type="button"
			@click="assign(item)"
		)
			span.kern-icon.kern-icon--edit(aria-hidden="true")
			span.kern-label.kern-sr-only {{ $t('bankTransaction.assign.button') }}
details.mt-8(v-if="statements.length > 0")
	summary.kern-title {{ $t('bankStatement.summary', { count: statements.length }) }}
	KernTable(
		:caption="$t('bankStatement.table.caption')"
		:create-permission="null"
		:update-permission="null"
		delete-permission="bankTransactions.delete"
		show-actions
		:columns=`[
			'statementId',
			'period',
			{ name: 'closingBalance', class: 'numeric' },
			{ name: 'transactionCount', class: 'numeric' },
			'uploaded',
		]`
		:data="statements"
		:scope="scope"
		@remove="removeStatement"
	)
		template(#statementId-header)
			| {{ $t('bankStatement.field.statementId') }}
		template(#statementId-body="{ item }")
			| {{ item.statementId }}
			template(v-if="item.sequenceNumber")
				|  (Nr. {{ item.sequenceNumber }})
		template(#period-header)
			| {{ $t('bankStatement.field.period') }}
		template(#period-body="{ item }")
			template(v-if="item.fromDate && item.toDate")
				| {{ formatDate(item.fromDate, 'compact') }} – {{ formatDate(item.toDate, 'compact') }}
		template(#closingBalance-header)
			| {{ $t('bankStatement.field.closingBalance') }}
		template(#closingBalance-body="{ item }")
			| {{ formatCurrency(item.closingBalance, 'amount') }}
		template(#transactionCount-header)
			| {{ $t('bankStatement.field.transactionCount') }}
		template(#transactionCount-body="{ item }")
			| {{ item.transactionCount }}
		template(#uploaded-header)
			| {{ $t('bankStatement.field.uploaded') }}
		template(#uploaded-body="{ item }")
			| {{ formatDatetime(item.uploadedAt, 'compact') }}
			template(v-if="item.uploadedBy")
				br
				| {{ item.uploadedBy.displayName }}
		template(#actions="{ item }")
			button.kern-btn.kern-btn--tertiary(
				type="button"
				@click="download(item)"
			)
				span.kern-icon.kern-icon--download(aria-hidden="true")
				span.kern-label.kern-sr-only {{ $t('bankStatement.download') }}
BankStatementUploadDialog(
	ref="uploadDialog"
	@refresh="refresh"
)
BankTransactionAssignmentDialog(
	ref="assignmentDialog"
	:bank-account="route.params.bankAccount"
	@refresh="refresh"
)
</template>

<style scoped>
.ff3-transaction-filter {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
	gap: 1rem;
}
</style>
