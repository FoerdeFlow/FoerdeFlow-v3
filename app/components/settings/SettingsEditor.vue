<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

interface Model {
	providerName: string
	providerLegalForm: string
	providerAddress: string
	representedBy: string
	contactEmail: string
	contactPhone: string
	supervisoryAuthority: string
	responsibleForContent: string
	vatId: string
	privacyController: string
	privacyOfficer: string
	privacyPurposes: string
	privacyRetention: string
	privacyRecipients: string
	privacyAuthority: string
	accessibilityConformance: string
	accessibilityNonAccessible: string
	accessibilityCreatedAt: string
	accessibilityReviewedAt: string
	accessibilityReviewMethod: string
	accessibilityFeedbackContact: string
	accessibilityArbitrationBody: string
	accessibilityEasyLanguage: string
	accessibilitySignLanguage: string
}

const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

defineExpose({
	async edit() {
		if(!dialog.value) return
		const { id: _id, ...item } = await $fetch('/api/settings')
		itemModel.value = structuredClone(item)
		model.value = structuredClone(item)
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

async function save() {
	if(!dialog.value) return
	try {
		await $fetch('/api/settings', {
			method: 'PUT',
			body: model.value,
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: 'Fehler beim Speichern',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	title="Einstellungen bearbeiten"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-container-fluid
			h3.kern-title.kern-title--small Impressum
			.kern-row
				.kern-col
					SettingsTextInput(
						v-model="model.providerName"
						label="Name des Anbieters"
						:max="256"
					)
				.kern-col
					SettingsTextInput(
						v-model="model.providerLegalForm"
						label="Rechtsform"
						:max="256"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.providerAddress"
						label="Anschrift"
						hint="Mehrere Zeilen sind möglich und bleiben so erhalten."
						:max="1024"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.representedBy"
						label="Gesetzlich vertreten durch"
						:max="1024"
					)
			.kern-row
				.kern-col
					SettingsTextInput(
						v-model="model.contactEmail"
						label="E-Mail-Adresse"
						:max="256"
					)
				.kern-col
					SettingsTextInput(
						v-model="model.contactPhone"
						label="Telefonnummer"
						:max="256"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.supervisoryAuthority"
						label="Aufsichtsbehörde"
						:max="1024"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.responsibleForContent"
						label="Inhaltlich verantwortliche Person"
						:max="1024"
					)
			.kern-row
				.kern-col
					SettingsTextInput(
						v-model="model.vatId"
						label="Umsatzsteuer-Identifikationsnummer"
						hint="Nur ausfüllen, wenn eine Nummer nach § 27a UStG vorliegt."
						:max="256"
					)

			h3.kern-title.kern-title--small Datenschutzerklärung
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyController"
						label="Verantwortliche Stelle"
						:max="1024"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyOfficer"
						label="Datenschutzbeauftragte Person"
						:max="1024"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyPurposes"
						label="Zwecke und Rechtsgrundlagen"
						hint="Zweck und Rechtsgrundlage nach Artikel 6 DSGVO beziehungsweise Landesdatenschutzgesetz."
						:rows="5"
						:max="4096"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyRetention"
						label="Speicherdauer"
						:rows="4"
						:max="4096"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyRecipients"
						label="Empfänger und Weitergabe"
						:rows="4"
						:max="4096"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.privacyAuthority"
						label="Datenschutz-Aufsichtsbehörde"
						:max="1024"
					)

			h3.kern-title.kern-title--small Erklärung zur Barrierefreiheit
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityConformance"
						label="Stand der Vereinbarkeit"
						hint="Vollständig, teilweise oder nicht vereinbar mit der BITV 2.0 – jeweils mit Begründung."
						:rows="4"
						:max="4096"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityNonAccessible"
						label="Nicht barrierefreie Inhalte"
						hint="Betroffene Bereiche, Begründung und – soweit vorhanden – barrierefreie Alternativen."
						:rows="5"
						:max="4096"
					)
			.kern-row
				.kern-col
					SettingsTextInput(
						v-model="model.accessibilityCreatedAt"
						label="Erklärung erstellt am"
						:max="256"
					)
				.kern-col
					SettingsTextInput(
						v-model="model.accessibilityReviewedAt"
						label="Zuletzt überprüft am"
						:max="256"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityReviewMethod"
						label="Verfahren der Überprüfung"
						:max="1024"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityFeedbackContact"
						label="Kontakt für Barriere-Meldungen"
						:max="1024"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityArbitrationBody"
						label="Schlichtungsstelle"
						:max="1024"
					)
			.kern-row
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilityEasyLanguage"
						label="Hinweise in Leichter Sprache"
						:rows="4"
						:max="4096"
					)
				.kern-col
					SettingsTextareaInput(
						v-model="model.accessibilitySignLanguage"
						label="Hinweise in Deutscher Gebärdensprache"
						:rows="4"
						:max="4096"
					)
</template>
