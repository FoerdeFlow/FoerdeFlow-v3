# Zahlungen einrichten

FördeFlow übernimmt die tatsächlichen Kontobewegungen aus Kontoauszügen im Format camt.053.001.02. Die einzelnen Zahlungen lassen sich dann Haushaltstiteln oder der Rücklage eines Haushalts zuordnen. Die Ist-Übersicht eines Haushaltsplans stellt das Soll den bewilligten, angewiesenen und tatsächlich gezahlten Beträgen gegenüber.

Ablauf:

1. **Konto anlegen**: Gremium → Bankkonten → Erstellen, mit Bezeichnung und IBAN. Ein Konto gehört genau einer OE, und jede IBAN gibt es nur einmal.
2. **Auszug hochladen**: Auf der Seite des Kontos „Kontoauszug hochladen“. Das Konto wird an der IBAN im Auszug erkannt. Eine Datei darf Auszüge mehrerer Konten enthalten, dann braucht es die Berechtigung für jedes davon.
3. **Zuordnen**: Je Zahlung ein Ziel, auf das der volle Betrag gebucht wird: ein Haushaltstitel, die Rücklage eines Haushalts oder eine Umbuchung zwischen eigenen Konten. Ziele sind nur Haushalte der OE, der das Konto gehört. Nur bei Bedarf lässt sich eine Zahlung in Teilbeträge auf mehrere Ziele aufteilen.

## Berechtigungen

Alle gelten für die OE des Kontos bzw. des Haushalts.

| Berechtigung | Erlaubt |
| --- | --- |
| `bankAccounts.read/create/update/delete` | Konten pflegen |
| `bankTransactions.read` | Zahlungen, Zuordnungen und importierte Auszüge lesen. Lässt auch die Konten sehen. |
| `bankTransactions.create` | Kontoauszüge hochladen |
| `bankTransactions.update` | Zahlungen zuordnen und Zuordnungen ändern. Die wählbaren Titel und Zahlungsanweisungen kommen mit, `budgetPlans.read` ist dafür nicht nötig. |
| `bankTransactions.delete` | Einen Auszug zurücknehmen, solange keine seiner Zahlungen zugeordnet ist |
| `budgetPlanActuals.read` | Ist-Übersicht eines Haushaltsplans, nur Summen, keine Einzelzahlungen |

Die Oberfläche erreicht das Konto nur mit `bankTransactions.read`. Wer hochladen oder zuordnen soll, braucht daher in der Regel zusätzlich das Leserecht.

## Regeln beim Import

- Übernommen werden nur gebuchte Einträge (`Sts` = `BOOK`). Vorgemerkte Einträge werden übersprungen und gezählt.
- Nur Beträge in Euro werden angenommen. Eine Dokumenttyp-Deklaration im XML wird abgelehnt.
- Ein Auszug (`Stmt/Id`) lässt sich je Konto nur einmal hochladen.
- **Sammelbuchungen**: Hat ein Eintrag mehrere `TxDtls` mit eigenen Beträgen, die zusammen den Betrag des Eintrags ergeben, wird jede davon eine eigene Zahlung. Sonst bleibt der Eintrag eine Zahlung.
- **Überlappende Auszüge** (etwa Tages- und Monatsauszug) übernehmen eine Zahlung nur einmal. Erkennungsmerkmal ist die Bankreferenz `AcctSvcrRef` des Eintrags. Fehlt sie, entscheidet ein Hash aus Buchungs- und Valutadatum, Richtung, Betrag, Gegen-IBAN, Verwendungszweck und EndToEndId.
- Eine Zahlung gehört zu dem Auszug, mit dem sie zuerst kam. Wer diesen Auszug zurücknimmt, entfernt auch ihre Zahlungen, selbst wenn ein späterer Auszug sie ebenfalls enthielt. Danach also den späteren Auszug zurücknehmen und erneut hochladen.
- Die Originaldatei liegt als `data/bankStatement_<id>.xml` und lässt sich auf der Kontoseite herunterladen.

## Regeln bei der Zuordnung

- Die Teilbeträge einer Zahlung übersteigen nie ihren Betrag. Ein Rest darf offen bleiben, die Zahlung gilt dann als „teilweise zugeordnet“.
- Eingänge zählen als Einnahmen, Ausgänge als Ausgaben des Titels. Eine Erstattung auf einen Ausgabentitel erscheint also als Einnahme dieses Titels und wird nicht mit den Ausgaben verrechnet.
- Nur ein Ausgang kann eine Zahlungsanweisung ausführen. Der Teilbetrag bucht dann auf deren Titel bzw. Rücklage.
- Ein Titel mit zugeordneten Zahlungen lässt sich nicht aus dem Haushaltsplan streichen.
- **Umbuchungen zwischen eigenen Konten** sind weder Einnahme noch Ausgabe eines Haushalts. Das betrifft etwa die Umbuchung der Haushaltsreste auf das Rücklagenkonto am Ende der Periode und die Rückbuchung vom Rücklagenkonto auf das Hauptkonto vor einer Ausschüttung. Sie gelten als zugeordnet, erscheinen aber nicht in der Ist-Übersicht. Die anschließende Auszahlung vom Hauptkonto wird wie bisher der Rücklage des Haushalts zugeordnet. Ist die Gegen-IBAN ein in FördeFlow angelegtes Konto, schlägt der Dialog die Umbuchung vor.
- Die Rücklage gehört zu keinem Plan. Die Ist-Übersicht zeigt deshalb die Rücklagenbuchungen, deren Buchungstag im Planzeitraum liegt.

## Bewusst nicht abgebildet

- Keine vollständige Prüfung gegen das XSD, nur der genutzte Teil wird geprüft.
- Keine anderen camt-Versionen (etwa camt.053.001.08) und kein camt.052/054.
- Keine Vorschläge, welche Zahlung zu welcher Zahlungsanweisung gehört.
