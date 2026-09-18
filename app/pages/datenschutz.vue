<script setup lang="ts">
// Die Gliederung folgt den Informationspflichten aus Art. 13 DSGVO. Die
// organisationsbezogenen Angaben werden über die Einstellungen gepflegt.
// Die Abschnitte „Anmeldung“ und „Cookies“ beschreiben das tatsächliche
// Verhalten der Anwendung und sind deshalb fest hinterlegt.

const { settings, missing } = useSettings()

const notice = computed(() =>
	`Es fehlen noch ${missing.value.privacy} Angaben, ` +
	'darunter die rechtliche Bewertung der Verarbeitungszwecke.',
)
</script>

<template lang="pug">
h1.kern-heading-large Datenschutzerklärung
KernAlert(
	v-if="missing.privacy > 0"
	type="warning"
	title="Diese Seite ist noch nicht vollständig"
	:text="notice"
	:dismissible="false"
)

h2.kern-heading-medium Verantwortlicher
p.kern-body
	| Verantwortlich für die Datenverarbeitung in dieser Anwendung im Sinne des
	| Artikels 4 Nummer 7 DSGVO ist:
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Verantwortliche Stelle
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.privacyController")
	.kern-description-list-item
		dt.kern-description-list-item__key Anschrift und Kontakt
		dd.kern-description-list-item__value
			| siehe #[NuxtLink.kern-link(to="/impressum") Impressum]

h2.kern-heading-medium Datenschutzbeauftragte Person
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Kontakt
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.privacyOfficer")

h2.kern-heading-medium Zwecke und Rechtsgrundlagen der Verarbeitung
p.kern-body
	| FördeFlow unterstützt die Organisation der Arbeit der verfassten
	| Studierendenschaft. Dazu werden unter anderem Stammdaten von Personen,
	| Mitgliedschaften in Organisationseinheiten, Sitzungs- und Wahlunterlagen
	| sowie Haushalts-, Antrags- und Zahlungsvorgänge verarbeitet.
p.kern-body
	LegalValue(:value="settings?.privacyPurposes")

h2.kern-heading-medium Speicherdauer
p.kern-body
	LegalValue(:value="settings?.privacyRetention")

h2.kern-heading-medium Empfänger und Weitergabe
p.kern-body
	LegalValue(:value="settings?.privacyRecipients")

h2.kern-heading-medium Anmeldung
p.kern-body
	| Die Anmeldung erfolgt über einen zentralen Anmeldedienst
	| (Single Sign-on nach dem Standard OpenID Connect). Dabei wird eine
	| Kennung der angemeldeten Person an FördeFlow übermittelt und einem
	| vorhandenen Personendatensatz zugeordnet.

h2.kern-heading-medium Cookies und lokale Speicherung
p.kern-body
	| FördeFlow setzt ausschließlich technisch notwendige Cookies. Es findet
	| keine Analyse des Nutzungsverhaltens und keine Weitergabe an Dritte zu
	| Werbezwecken statt.
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key h3
		dd.kern-description-list-item__value
			| Sitzungscookie. Hält die Anmeldung aufrecht und wird beim Abmelden
			| beziehungsweise mit dem Ende der Sitzung ungültig.
	.kern-description-list-item
		dt.kern-description-list-item__key ff3-theme
		dd.kern-description-list-item__value
			| Speichert die gewählte Farbschema-Einstellung (System, Hell oder
			| Dunkel) für ein Jahr. Enthält keine personenbezogenen Daten.
	.kern-description-list-item
		dt.kern-description-list-item__key i18n_redirected
		dd.kern-description-list-item__value
			| Speichert die gewählte Sprache, damit die Anwendung bei weiteren
			| Aufrufen in derselben Sprache erscheint.

h2.kern-heading-medium Ihre Rechte
p.kern-body
	| Sie haben gegenüber der verantwortlichen Stelle die folgenden Rechte,
	| soweit die jeweiligen gesetzlichen Voraussetzungen erfüllt sind:
ul.kern-list.kern-list--bullet
	li Recht auf Auskunft über die verarbeiteten Daten (Artikel 15 DSGVO)
	li Recht auf Berichtigung unrichtiger Daten (Artikel 16 DSGVO)
	li Recht auf Löschung (Artikel 17 DSGVO)
	li Recht auf Einschränkung der Verarbeitung (Artikel 18 DSGVO)
	li Recht auf Datenübertragbarkeit (Artikel 20 DSGVO)
	li Recht auf Widerspruch gegen die Verarbeitung (Artikel 21 DSGVO)

h2.kern-heading-medium Beschwerderecht
p.kern-body
	| Unabhängig davon können Sie sich mit einer Beschwerde an die zuständige
	| Datenschutz-Aufsichtsbehörde wenden:
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Aufsichtsbehörde
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.privacyAuthority")
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
