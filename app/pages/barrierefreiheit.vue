<script setup lang="ts">
// Die Gliederung folgt den Pflichtangaben aus § 12b BITV 2.0 (Umsetzung von
// Artikel 7 der Richtlinie (EU) 2016/2102). Die prüfungsabhängigen Angaben
// werden über die Einstellungen gepflegt; „Getroffene Maßnahmen“ beschreibt
// den tatsächlichen Stand der Anwendung und ist deshalb fest hinterlegt.

const { settings, missing } = useSettings()

const notice = computed(() =>
	`Es fehlen noch ${missing.value.accessibility} Angaben. ` +
	'Eine Konformitätsaussage ohne vorherige Prüfung ist nicht zulässig.',
)
</script>

<template lang="pug">
h1.kern-heading-large Erklärung zur Barrierefreiheit
KernAlert(
	v-if="missing.accessibility > 0"
	type="warning"
	title="Diese Seite ist noch nicht vollständig"
	:text="notice"
	:dismissible="false"
)

h2.kern-heading-medium Stand der Vereinbarkeit
p.kern-body
	LegalValue(:value="settings?.accessibilityConformance")

h2.kern-heading-medium Nicht barrierefreie Inhalte
p.kern-body
	LegalValue(:value="settings?.accessibilityNonAccessible")

h2.kern-heading-medium Getroffene Maßnahmen
p.kern-body
	| Unabhängig von der noch ausstehenden Prüfung sind bereits folgende
	| Maßnahmen umgesetzt:
ul.kern-list.kern-list--bullet
	li
		| Die Oberfläche setzt auf dem Designsystem KERN UX auf, das auf die
		| Anforderungen öffentlicher Stellen ausgelegt ist.
	li
		| Farben werden ausschließlich über die Farb-Token des Designsystems
		| vergeben, damit die Kontrastwerte in beiden Farbschemata erhalten bleiben.
	li
		| Es gibt einen hellen und einen dunklen Modus. Standardmäßig gilt die
		| Einstellung des Betriebssystems; zusätzlich lässt sich das Farbschema
		| in der Kopfzeile fest einstellen.
	li
		| Am Anfang jeder Seite steht ein Sprunglink, der die Navigation
		| überspringt und direkt zum Inhalt führt.
	li
		| Interaktive Elemente haben einen sichtbaren Fokusindikator und sind
		| mit der Tastatur erreichbar.

h2.kern-heading-medium Erstellung dieser Erklärung
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Erstellt am
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.accessibilityCreatedAt")
	.kern-description-list-item
		dt.kern-description-list-item__key Letzte Überprüfung
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.accessibilityReviewedAt")
	.kern-description-list-item
		dt.kern-description-list-item__key Verfahren der Überprüfung
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.accessibilityReviewMethod")

h2.kern-heading-medium Barrieren melden
p.kern-body
	| Sind Ihnen Barrieren aufgefallen oder benötigen Sie Informationen in einer
	| barrierefreien Form? Dann wenden Sie sich bitte an folgende Stelle:
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Kontakt
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.accessibilityFeedbackContact")

h2.kern-heading-medium Durchsetzungsverfahren
p.kern-body
	| Erhalten Sie auf Ihre Meldung keine oder keine zufriedenstellende
	| Antwort, können Sie sich an die zuständige Schlichtungsstelle wenden:
dl.kern-description-list
	.kern-description-list-item
		dt.kern-description-list-item__key Schlichtungsstelle
		dd.kern-description-list-item__value
			LegalValue(:value="settings?.accessibilityArbitrationBody")

h2.kern-heading-medium Leichte Sprache
p.kern-body
	LegalValue(:value="settings?.accessibilityEasyLanguage")

h2.kern-heading-medium Deutsche Gebärdensprache
p.kern-body
	LegalValue(:value="settings?.accessibilitySignLanguage")
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
