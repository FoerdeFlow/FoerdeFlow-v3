<script setup lang="ts">
// Die Pflichtangaben richten sich nach § 5 Digitale-Dienste-Gesetz (DDG,
// vormals § 5 TMG). Die Werte werden über die Einstellungen gepflegt.

const { settings, missing } = useSettings()

const notice = computed(() =>
	`Es fehlen noch ${missing.value.imprint} Pflichtangaben. ` +
	'Ein unvollständiges Impressum ist ein Rechtsverstoß.',
)
</script>

<template lang="pug">
h1.kern-heading-large Impressum
KernAlert(
	v-if="missing.imprint > 0"
	type="warning"
	title="Diese Seite ist noch nicht vollständig"
	:text="notice"
	:dismissible="false"
)

h2.kern-heading-medium Anbieter
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Name
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.providerName")
	.kern-description-list-item
		dt.kern-description-list-item__key Rechtsform
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.providerLegalForm")
	.kern-description-list-item
		dt.kern-description-list-item__key Anschrift
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.providerAddress")

h2.kern-heading-medium Vertretungsberechtigung
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Gesetzlich vertreten durch
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.representedBy")

h2.kern-heading-medium Kontakt
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key E-Mail
		dd.kern-description-list-item__value
			a.kern-link(
				v-if="settings?.contactEmail"
				:href="`mailto:${settings?.contactEmail}`"
			) {{ settings?.contactEmail }}
			LegalValue(
				v-else
				value=""
			)
	.kern-description-list-item
		dt.kern-description-list-item__key Telefon
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.contactPhone")

h2.kern-heading-medium Aufsichtsbehörde
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Zuständige Aufsicht
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.supervisoryAuthority")

h2.kern-heading-medium Inhaltlich verantwortlich
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Verantwortliche Person
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.responsibleForContent")

//- Nur anzeigen, wenn eine Nummer vorliegt: ohne Nummer gibt es nichts anzugeben.
template(v-if="settings?.vatId")
	h2.kern-heading-medium Umsatzsteuer-Identifikationsnummer
	dl.kern-description-list
		.kern-description-list-item
			dt.kern-description-list-item__key Nummer nach § 27a UStG
			dd.kern-description-list-item__value {{ settings?.vatId }}
</template>

<style scoped>
/*
 * KERN setzt bei Typografie-Klassen `margin: 0` und liegt in der Kaskade hinter
 * den Tailwind-Utilities; `mt-8` bliebe hier also wirkungslos. Der Abstand kommt
 * deshalb aus dem Scope der Seite.
 */
h2 {
	margin-top: var(--kern-metric-space-x-large);
}
</style>
