# FormPilot — Testanleitung (Beta v0.9.1)

> **Testhinweis:** Frühe Testversion. Bitte keine echten Steuer-IDs, IBANs, Ausweisnummern, Gesundheitsdaten oder vertraulichen Dokumente eingeben. Alle Daten bleiben nur im Browser (localStorage).

## Text zum Verschicken (kopieren & anpassen)

> Hi! Ich baue gerade FormPilot — eine App, mit der du persönliche Daten und Dokumente einmal ordnest und dann für Bewerbungen, Arbeitgeber, Uni oder Behörden schnell wiederverwendest, ohne die Kontrolle abzugeben.
>
> Magst du sie 5 Minuten testen? Es ist eine Demo mit Beispieldaten — du kannst nichts kaputt machen und musst kein Konto anlegen. **Bitte gib keine echten sensiblen Daten ein** (Steuer-ID, IBAN, Ausweisnummer) — alles bleibt nur in deinem Browser.
>
> Link: https://6a4683f9913e07be79f75588--shiny-pie-007565.netlify.app
>
> Klick auf „Demo starten", folge der blauen Test-Karte auf der Übersicht und drück am Ende auf „Feedback geben". Danke dir!

## Der 5-Minuten-Test

1. **Demo starten** (Startseite, kein Konto nötig) und im Onboarding ein Testziel wählen — z. B. „Arbeitgeber-Onboarding".
2. **Vorgang öffnen:** Übersicht → „Arbeitgeber-Onboarding" → „Anforderung öffnen & prüfen".
3. **Fehlende Angabe ergänzen:** In der Checkliste die Sozialversicherungsnummer eintragen (Fantasiewert im richtigen Format, z. B. `12 160394 W 512`).
4. **Dokument simuliert hochladen:** In der Checkliste „Neue Version hochladen" bzw. „Dokument hochladen" — es wird keine echte Datei übertragen.
5. **Freigabe vorbereiten:** „Freigabe vorbereiten" → 3 Schritte durchgehen → Zusammenfassung bestätigen → Demo-Freigabe erstellen.
6. **Freigabe widerrufen:** Bereich „Freigaben" → bei der neuen Freigabe „Zugriff widerrufen".
7. **Angehörigenprofil öffnen:** Oben links Person wechseln → „Heinz Wollmer" (Pflege-Fall, Vorsorgevollmacht).
8. **Feedback geben:** Button in der Test-Karte oder im Seitenfuß — dauert unter 2 Minuten.

Optional: Foto einer Karte „einlesen" (Profil → „Schneller als Tippen"), Formular aus Vorlage ausfüllen, Paket erstellen.

## Fragen an Tester

- Hast du sofort verstanden, was FormPilot macht?
- War dir bei der Freigabe klar, welche Daten geteilt werden?
- Wirkt die App vertrauenswürdig genug, um ihr echte Dokumente anzuvertrauen?
- Würdest du sie im Alltag nutzen? Wofür zuerst?
- Welche Funktion fehlt dir?
- Was war verwirrend, wo hättest du abgebrochen?

## Hinweise für dich (Maurice)

- Feedback kommt in Netlify → Forms an (E-Mail-Benachrichtigung dort aktivieren). Lokal/offline greift der localStorage- und E-Mail-Fallback; Export unter Sicherheit & Zugriff → „Feedback exportieren".
- Tester auf Handy schicken: die App ist mobil nutzbar (Bottom-Navigation).
- Die Demo rechnet mit festem Datenstand **03.07.2026** (steht im Seitenfuß) — Fristen und Ablaufdaten sind darauf abgestimmt und bleiben so reproduzierbar.
- Bei Problemen eines Testers: „Demo zurücksetzen" (Seitenfuß) löst fast alles. Ältere gespeicherte Stände werden beim Laden automatisch repariert (State-Migration).
