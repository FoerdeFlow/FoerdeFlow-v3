<script setup lang="ts">
import { FetchError } from 'ofetch'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/bankAccountOverview', {
	default: () => [],
})

// Nach Gremium sortiert, innerhalb eines Gremiums bleibt die Reihenfolge des
// Servers nach Bezeichnung erhalten.
const accounts = computed(() => data.value.toSorted((a, b) =>
	a.organizationItem.name.localeCompare(b.organizationItem.name, 'de')))

const organizationItems = computed(() => [
	...new Map(accounts.value.map((account) => [ account.organizationItem.id, account.organizationItem ])).values(),
])

const groups = computed(() => organizationItems.value.map((organizationItem) => ({
	key: organizationItem.id,
	label: organizationItem.name,
	includes: (item: { organizationItem: { id: string } }) => item.organizationItem.id === organizationItem.id,
})))

function accountRoute(account: { id: string, organizationItem: { id: string } }) {
	return {
		name: 'organizationItems-organizationItem-bankAccounts-bankAccount' as const,
		params: { organizationItem: account.organizationItem.id, bankAccount: account.id },
	}
}

// Welche Konten einer Datei der Nutzer beschicken darf, prüft erst der Server.
const uploadAllowed = authStore.hasPermissionInAnyScope('bankTransactions.create')

const fileId = useId()
const file = ref<File | null>(null)
// Ein neuer Schlüssel leert das Dateifeld nach dem Hochladen.
const inputKey = ref(0)
const uploading = ref(false)
const error = ref<string | null>(null)

interface ImportedStatement {
	file: string | null
	bankAccount: string
	bankAccountName: string
	statementId: string
	skipped: boolean
	imported: number
	duplicates: number
	pending: number
}

const results = ref<ImportedStatement[]>([])

const isZip = computed(() => /\.zip$/i.test(file.value?.name ?? ''))

function onChange(event: Event) {
	file.value = (event.target as HTMLInputElement).files?.[0] ?? null
	error.value = null
}

// Ein Archiv kann viele Auszüge enthalten, deshalb werden sie dann nur noch
// zusammengefasst. Die Einzelheiten zeigt die Tabelle.
function describe(statements: ImportedStatement[]) {
	const [ statement ] = statements
	if(statement && statements.length === 1) {
		return statement.skipped
			? t('bankStatement.upload.skipped', { ...statement })
			: t('bankStatement.upload.result', { ...statement })
	}

	const imported = statements.filter((statement) => !statement.skipped)
	const skipped = statements.length - imported.length

	return [
		imported.length > 0 && t('bankStatement.upload.summary', {
			statements: imported.length,
			accounts: [ ...new Set(imported.map((statement) => statement.bankAccountName)) ].join(', '),
			imported: imported.reduce((sum, statement) => sum + statement.imported, 0),
			duplicates: imported.reduce((sum, statement) => sum + statement.duplicates, 0),
			pending: imported.reduce((sum, statement) => sum + statement.pending, 0),
		}),
		skipped > 0 && t('bankStatement.upload.summarySkipped', { skipped }),
	].filter(Boolean).join(' ')
}

async function upload() {
	if(!file.value || uploading.value) return
	uploading.value = true
	error.value = null
	try {
		const result = await $fetch('/api/bankStatements', {
			method: 'POST',
			headers: {
				'Content-Type': isZip.value ? 'application/zip' : 'application/xml',
			},
			body: file.value,
		})
		results.value = result.statements
		file.value = null
		inputKey.value++
		alertStore.showAlert({
			type: 'success',
			title: t('bankStatement.upload.success'),
			text: describe(result.statements),
		})
		await refresh()
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			error.value = e.data?.message ?? t('bankStatement.upload.error.message')
		}
	} finally {
		uploading.value = false
	}
}

function describeOpen(account: { openCount: number, openAmount: number }) {
	return t('bankAccount.overview.open', {
		count: account.openCount,
		amount: formatCurrency(account.openAmount, 'amount'),
	}, account.openCount)
}

function describeBalanceDate(statement: { toDate: string | null, createdAt: string }) {
	return formatDate(statement.toDate ?? statement.createdAt, 'compact')
}

const showFiles = computed(() => results.value.some((statement) => statement.file))

const resultColumns = computed(() => [
	...showFiles.value ? [ 'file' ] : [],
	'bankAccount',
	'statementId',
	'outcome',
])
</script>

<template lang="pug">
h1.kern-heading-large {{ $t('bankAccount.overview.title') }}
p.kern-body.mb-8 {{ $t('bankAccount.overview.description') }}
section.my-8(
	v-if="uploadAllowed"
	aria-labelledby="ff3-upload-heading"
)
	h2#ff3-upload-heading.kern-heading-medium {{ $t('bankStatement.upload.title') }}
	form(@submit.prevent="upload()")
		.kern-form-input(:class="{ 'kern-form-input--error': error }")
			label.kern-label(:for="fileId") {{ $t('bankStatement.upload.label') }}
			.kern-hint(:id="`${fileId}-hint`") {{ $t('bankStatement.upload.hint') }}
			input.kern-form-input__input(
				:id="fileId"
				:key="inputKey"
				type="file"
				accept=".xml,.zip,application/xml,text/xml,application/zip"
				:class="{ 'kern-form-input__input--error': error }"
				:aria-describedby="error ? `${fileId}-hint ${fileId}-error` : `${fileId}-hint`"
				@change="onChange"
			)
			p.kern-error(
				v-if="error"
				:id="`${fileId}-error`"
				role="alert"
			)
				span.kern-icon.kern-icon--danger(aria-hidden="true")
				span.kern-body {{ error }}
		button.kern-btn.kern-btn--primary.mt-4(
			type="submit"
			:disabled="!file || uploading"
		)
			span.kern-icon.kern-icon--drive-folder-upload(aria-hidden="true")
			span.kern-label {{ uploading ? $t('bankStatement.upload.uploading') : $t('bankStatement.upload.submit') }}
	.mt-8(v-if="results.length > 0")
		KernTable(
			:caption="$t('bankStatement.upload.results.caption')"
			:create-permission="null"
			:update-permission="null"
			:delete-permission="null"
			:columns="resultColumns"
			:data="results"
		)
			template(#file-header)
				| {{ $t('bankStatement.upload.results.file') }}
			template(#file-body="{ item }")
				| {{ item.file }}
			template(#bankAccount-header)
				| {{ $t('bankStatement.upload.results.bankAccount') }}
			template(#bankAccount-body="{ item }")
				| {{ item.bankAccountName }}
			template(#statementId-header)
				| {{ $t('bankStatement.field.statementId') }}
			template(#statementId-body="{ item }")
				| {{ item.statementId }}
			template(#outcome-header)
				| {{ $t('bankStatement.upload.results.outcome') }}
			template(#outcome-body="{ item }")
				template(v-if="item.skipped")
					| {{ $t('bankStatement.upload.results.skipped') }}
				template(v-else)
					| {{ $t('bankStatement.upload.results.imported', item) }}
KernTable(
	:caption="$t('bankAccount.overview.table.caption')"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	show-actions
	:columns=`[
		'name',
		'iban',
		{ name: 'balance', class: 'numeric' },
		'open',
	]`
	:data="accounts"
	:groups="groups"
)
	template(#name-header)
		| {{ $t('bankAccount.field.name') }}
	template(#name-body="{ item }")
		NuxtLink.kern-link(:to="accountRoute(item)") {{ item.name }}
	template(#iban-header)
		| {{ $t('bankAccount.field.iban') }}
	template(#iban-body="{ item }")
		| {{ formatIban(item.iban) }}
	template(#balance-header)
		| {{ $t('bankAccount.field.balance') }}
	template(#balance-body="{ item }")
		template(v-if="item.latestStatement")
			| {{ formatCurrency(item.latestStatement.closingBalance, 'amount') }}
			br
			span.kern-body--small.kern-body--muted
				| {{ $t('bankAccount.overview.balanceDate', { date: describeBalanceDate(item.latestStatement) }) }}
		template(v-else)
			| {{ $t('bankAccount.overview.noStatement') }}
	template(#open-header)
		| {{ $t('bankAccount.overview.field.open') }}
	template(#open-body="{ item }")
		template(v-if="item.openCount > 0")
			| {{ describeOpen(item) }}
		template(v-else-if="item.latestStatement")
			| {{ $t('bankAccount.overview.allAssigned') }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(:to="accountRoute(item)")
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only {{ $t('bankAccount.overview.show', { name: item.name }) }}
</template>
