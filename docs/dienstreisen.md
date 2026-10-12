# Dienstreisen einrichten

FördeFlow bildet die Dienstreiserichtlinie (DiReiseR) über Workflows ab:

- **Dienstreisegenehmigung** (§ 3): Mutation `travelPermits`, Aktion `create`
- **Kostenerstattung** (§§ 4–8): Mutation `travelClaims`, Aktion `create`
- **Fahrberechtigungen** (§ 7 Abs. 2): Seite `/vehicleDrivers`, Berechtigungen `vehicleDrivers.read` und `vehicleDrivers.update`

Jede Stelle, die eine Genehmigung erteilen darf, bekommt einen eigenen Workflow. Die Grenzen und die Zuständigkeit stehen in der Meta der Mutation. Die Seite `/travel` fragt die Eckdaten einer Reise ab und bietet die passenden Workflows an. Beim Anlegen des Prozesses prüft der Server dieselben Regeln noch einmal.

## Meta einer Genehmigung (`travelPermits`)

| Schlüssel | Bedeutung | Standard |
| --- | --- | --- |
| `maximumAmountPerPerson` | Höchstbetrag je Person und Reise. Ein Carsharing-Anteil zählt mit. | keiner |
| `maximumGeneralAmountPerPerson` | Höchstbetrag einer generellen Genehmigung (§ 3 Abs. 6). Gilt zusätzlich. | 25 |
| `domesticOnly` | Nur Reisen im Inland | `false` |
| `permitKinds` | Zulässige Arten: `single` und/oder `general` | `["single"]` |
| `eligibleIf` | Bedingungen für die Zuständigkeit, siehe unten. Eine zutreffende genügt, ohne Liste ist der Workflow immer zuständig. | – |
| `excludeIf` | Bedingungen wie bei `eligibleIf`. Trifft eine zu, ist der Workflow nicht zuständig. | – |
| `advanceRatio`, `advanceMinimumBase` | Vorschuss höchstens 80 % der erstattungsfähigen Kosten, nur über 100 € (§ 9) | 0,8 / 100 |
| `budgetScope` | `"initiator"` beschränkt die Haushalte auf die antragstellende OE | – |

Bedingungen in `eligibleIf`:

- `{ "membershipOf": "<OE-ID>" }`: Alle Reisenden sind zu Reisebeginn Mitglied der OE. Mit `"initiator"` statt einer ID ist die OE gemeint, für die der Prozess gestartet wird.
- `{ "specialInterest": true }` bzw. `false`: Ein besonderes Interesse (§ 2 Abs. 2) ist festgestellt bzw. nicht festgestellt.
- `{ "occasion": "parliamentSession" }`: Die Reise führt zu einer Sitzung des StuPa.
- `{ "travelerBasis": "sports" }`: Teilnehmer*innen am Hochschulsport.

Den Haushalt (§ 2) legt der Workflow über Presets fest, zum Beispiel `budgetPlanItem` als `locked` auf den Titel „Reisekosten“. Für das Wintersemester 2026/27 kann die Herkunft „Rücklage“ voreingestellt werden (ERVerwR § 5).

### Beispiele

Die Beträge aus der Finanzsatzung (§ 11 Abs. 2 S. 1 und § 23 Abs. 2 S. 1) sind hier als Platzhalter `<FinS11>` und `<FinS23>` eingetragen.

| Workflow | Genehmigungsschritte | Meta |
| --- | --- | --- |
| AStA-Vorstand (§ 3 Abs. 2) | AStA-Vorstand | `{"maximumAmountPerPerson": <FinS11>, "domesticOnly": true, "permitKinds": ["single", "general"], "eligibleIf": [{"membershipOf": "<AStA>"}, {"specialInterest": true}]}` |
| Präsidium (§ 3 Abs. 3) | Präsidium | `{"maximumAmountPerPerson": 75, "domesticOnly": true, "permitKinds": ["single", "general"], "eligibleIf": [{"membershipOf": "<StuPa>"}, {"occasion": "parliamentSession"}]}` |
| FS-Vorstand X (§ 3 Abs. 4) | FS-Vorstand X | `{"maximumAmountPerPerson": <FinS23>, "domesticOnly": true, "permitKinds": ["single", "general"], "budgetScope": "initiator", "eligibleIf": [{"membershipOf": "<FSV X>"}], "excludeIf": [{"specialInterest": true}]}` |
| FS-Vorstand X mit StuPa (§ 3 Abs. 4 S. 2) | StuPa, danach FS-Vorstand X | `{"budgetScope": "initiator", "eligibleIf": [{"membershipOf": "<FSV X>"}], "excludeIf": [{"specialInterest": true}]}` |
| AStA, Hochschulsport (§ 3 Abs. 5) | AStA | `{"maximumAmountPerPerson": <FinS11>, "domesticOnly": true, "eligibleIf": [{"travelerBasis": "sports"}]}` |
| StuPa (§ 3 Abs. 1) | StuPa | `{"permitKinds": ["single", "general"]}` |

Die FS-Workflows schließen Reisen mit besonderem Interesse über `excludeIf` aus. Für sie ist nach § 3 Abs. 2 der AStA-Vorstand zuständig, und die Kosten trägt der AStA-Haushalt (§ 2 Abs. 2).

## Meta einer Erstattung (`travelClaims`)

| Schlüssel | Bedeutung | Standard |
| --- | --- | --- |
| `kilometerRate` | Euro je Kilometer mit privatem Kfz (§ 6 Abs. 3) | 0,30 |
| `maximumEventAmountPerPerson` | Tagungsgeld und Fortbildung zusammen je Person und Veranstaltung (§ 8) | 100 |
| `claimDeadlineDays` | Frist nach Reiseende (§ 4). Bei Überschreitung nur ein Hinweis. | 14 |

Der Genehmigungsschritt liegt beim Finanzreferat des AStA (§ 4).

## Berechtigungen

- `workflowProcesses.create` und `persons.read` brauchen alle, die Dienstreisen beantragen. Die Personenauswahl der Reisenden lädt `/api/persons`.
- `travelPermits.read` gilt für die OE des Haushalts und zeigt dort alle Genehmigungen mit ihren Erstattungen. Reisende sehen ihre eigenen Genehmigungen immer.
- `vehicleDrivers.read` und `vehicleDrivers.update` sind für den AStA-Vorstand und von ihm beauftragte Personen gedacht.

## Bewusst nicht abgebildet

- Abweichungen nach § 6 Abs. 5, § 7 Abs. 4 S. 2 und § 10
- Die alte Reisekostenrichtlinie
- Der Zahlungsstatus von Vorschüssen und Erstattungen
- Die Berechnung des FSV-Budgets nach VerwR § 6
