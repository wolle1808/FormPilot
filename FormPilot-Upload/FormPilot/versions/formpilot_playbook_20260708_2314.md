---
title: "FormPilot – Playbook"
subtitle: "Das zentrale Wissen zur Firma & App – dein zweites Gehirn"
lang: de
---

## So funktioniert dieses Playbook

Dieses Dokument ist die lebende Wissensbasis zu FormPilot – Firma und App. Es ist **nach Kategorien** geordnet (nicht chronologisch) und hält immer den aktuellen Stand. Neue Gedanken kommen zuerst in **formpilot_inbox.md**; alle 2 Tage pflegt ein automatischer Task sie in die passenden Kategorien ein (ergänzen, schärfen, dedupen), notiert die Änderung im **Changelog**, sichert die alte Version unter **versions/** und archiviert die Rohnotizen in **formpilot_inbox_archive.md**. So wächst das Playbook konsistent, ohne dass etwas verloren geht.

---

## 1. Vision & Kernthese

- FormPilot wird nicht wertvoll durch möglichst viele gespeicherte Dokumente, sondern dadurch, dass es einen realen Bürokratieprozess von der Anforderung bis zur vollständigen, sicheren Übergabe deutlich einfacher macht.
- Erster Beweis muss ein klarer End-to-End-Prozess sein (Arbeitgeber-Onboarding). Erst wenn dieser zuverlässig funktioniert und echten Aufwand spart, folgen weitere Lebensbereiche und Integrationen.
- Leitmotiv gegenüber Nutzern: weniger suchen, weniger abtippen, weniger Fehler, schneller erledigen, jederzeit Kontrolle behalten.

## 2. Positionierung

- Kein weiterer Dokumentenspeicher, sondern die **Eingangsschicht/Schnittstelle** zwischen Privatpersonen und Organisationen.
- Sitzt **vor** bestehenden Systemen (Personio, DATEV, Behörden-, Versicherungs-, Hochschulportale) und ergänzt sie auf der Eingangsseite – ersetzt sie nicht.
- KI ist Hintergrundfunktion, nicht Positionierung oder Marketingbotschaft.
- Produkt nicht neu erfinden: die bestehende Demo bleibt die funktionale und visuelle Referenz.
- Produktlogik: Daten/Dokumente einmal hinterlegen → Anforderungen erkennen → fehlende Inhalte anzeigen → prüfen → kontrolliert freigeben → Freigaben nachvollziehen und widerrufen.

## 3. Zielgruppen & Nutzen

### Privatpersonen
- Bürokratie dauerhaft einfacher erledigen, nicht nur Dokumente speichern.
- Größter Nutzen in wiederkehrenden Lebenssituationen: Arbeitgeber-Onboarding, Bewerbungen, Studium/BAföG, Versicherungen, Behörden, Vermietung/Wohnungssuche, Pflege/Angehörigenverwaltung.
- Mehrpersonenprofile (Kinder, Partner, Eltern, Großeltern) sind ein wichtiger Differenzierungsfaktor.
- Muss zeigen, was vorhanden, veraltet, unvollständig oder noch hochzuladen ist.
- Volle Transparenz für den Nutzer: wer Daten erhalten hat, welche geteilt wurden, wie lange der Zugriff gilt, wann zuletzt zugegriffen wurde, wie widerrufbar.
- Nutzen messbar machen: wiederverwendete Angaben, vorbefüllte Formulare, vermiedene Suchvorgänge, gesparte Zeit.

### Unternehmen
- Sparen Zeit bei unvollständigen/fehlerhaften Unterlagen; HR erhält strukturierte, geprüfte, vollständige Daten statt verstreuter E-Mails und Anhänge.
- Kann den bisherigen E-Mail-Weg ersetzen oder strukturieren, ohne sofortigen Umbau der Softwarelandschaft.
- Stärkste B2B-Positionierung: sicherer Dateneingang, strukturierte Dokumentenanforderung, Vollständigkeitsprüfung, standardisierte Übergabe an bestehende Systeme.
- Zahlungsbereitschaft für: weniger Rückfragen, kürzere Durchlaufzeiten, weniger manuelle Übertragung, weniger Fehler, bessere Nachvollziehbarkeit, sichere Freigaben, API-/Systemintegration.

## 4. Produkt & Funktionsumfang

Mindestumfang produktionsfähige Webapp:
- Registrierung, Anmeldung, Benutzer- und Rechteverwaltung
- Echte Datenbank und sicherer Dokumentenspeicher
- Mehrpersonenprofile
- Echte Vorgänge, echte Dokumente, echte Freigaben mit Ablaufzeiten
- Anforderungserkennung und Vollständigkeitsprüfung
- Protokollierung, Benachrichtigungen, Admin-Bereich
- API-Struktur, Datenschutz- und Löschprozesse
- Bestehende Nutzerführung, Texte, Datenlogik und Designregeln bleiben erhalten.

## 5. Technik & Architektur

- Nächster Schritt: bestehende Demo produktionsfähig neu aufbauen – keine weiteren Demo-Ideen.
- HTML-Demo ist Prototyp und Referenz, aber keine langfristig tragfähige Grundlage.
- Architektur darf neu aufgebaut werden, das Produkt selbst nicht.
- Zuerst die Privatnutzer-Webapp stabil, native Apps später.
- Saubere Architektur als Basis für spätere Partner- und Unternehmensanbindung; nicht jede Integration sofort umsetzen.

## 6. Sicherheit & Vertrauen

- Sicherheit ist Voraussetzung für das gesamte Produkt, keine Einzelfunktion. „Nicht hackbar" ist unrealistisch; Ziel ist ein professionelles Niveau mit mehreren Schutzschichten.
- Erforderlich u. a.: Verschlüsselung (Übertragung + Speicherung), 2FA, sichere Sitzungsverwaltung, Rollen-/Rechtekonzept, Zugriffsprotokolle, kurzlebige/widerrufbare Freigabelinks, getrennte Speicherung sensibler Daten, Backups, Wiederherstellung, Rate Limits, Schutz vor typischen Webangriffen, regelmäßige Sicherheitsprüfungen.
- Nie suggerieren, dass Daten automatisch oder ohne Zustimmung geteilt werden. Sensible Aktionen brauchen Prüfung, Zusammenfassung und ausdrückliche Bestätigung.
- Markenanmutung: wie eine gute Bank oder ein seriöses Versicherungsportal – nicht wie ein generisches KI-Startup.

## 7. Monetarisierung & Geschäftsmodell

- Privatnutzer allein erzeugen vermutlich zu geringe Zahlungsbereitschaft; ein reines B2C-Abo ist nicht das Kernmodell.
- Kombiniertes Modell: kostenloser/günstiger Privatbereich + bezahlte Premium-Funktionen + B2B-Zugänge + API-Nutzung + Enterprise-Lösungen + transaktionsbasierte Erlöse.
- Unternehmen können für Anfragen, Workflows, Nutzerkontingente, Integrationen oder verarbeitete Vorgänge zahlen.
- Zusatzerlöse über Partnerleistungen: digitale Signaturen, Identitätsprüfung, Dokumentenprüfung, Versicherungs-/Behördenservices (z. B. DocuSign integrieren statt selbst bauen).
- Monetarisierung entsteht vor allem auf der Unternehmensseite; der Privatnutzer liefert Reichweite, Datenstruktur und Nutzung.

## 8. Wettbewerb & Markt

- Konkurrenz nicht nur direkte Dokumenten-Apps; der größte Wettbewerber ist oft der bestehende Prozess: E-Mail, Excel, PDF, Personalabteilung, Unternehmensportal, bestehende HR-Software.
- Ablehnungsrisiko, wenn FormPilot wie ein weiterer Systemwechsel wirkt → Botschaft: bestehende Systeme bleiben, FormPilot verbessert den Dateneingang, Integration statt vollständiger Ablösung.
- Vergleichbare Modelle eher bei Infrastruktur-/Prozesssoftware (DATEV, Personio, DocuSign) als bei Consumer-Apps: sie lösen teure, wiederkehrende Unternehmensprobleme – genau dort liegt das wirtschaftliche Potenzial.

## 9. Website, Kommunikation & Marke

- Nicht nur eine einzelne statische Landingpage; eine starke, interaktive Startseite, die visuell erzählt, wie FormPilot funktioniert (Produktsequenzen, App-Mockups, Scroll-Animationen, konkrete Use Cases).
- Beispiel-Story: Arbeitgeber fordert Unterlagen an → FormPilot erkennt benötigte Daten → fehlende Unterlagen werden angezeigt → Nutzer prüft und gibt gezielt frei → Unternehmen erhält vollständige Daten.
- Eigenständige Seiten: Produkt, Für Privatpersonen, Für Unternehmen, Sicherheit, Anwendungsfälle, Preise, Hilfe, Datenschutz, Kontakt.
- Kommunikation zeigt Nutzen statt Feature-Menge. Kernbotschaft nicht „digitaler Dokumentensafe".

## 10. Umsetzung, Priorisierung & Roadmap

- Solo-Gründer: Arbeitskraft ist der größte Engpass → strikt priorisieren. Nicht gleichzeitig bauen: Privat-App, Unternehmensportal, API, Mobile-App, komplette Behördenintegration, komplette Signaturplattform.
- Reihenfolge: (1) Produktdefinition festhalten, (2) Demo stabilisieren, (3) technische Architektur festlegen, (4) produktionsfähige Webapp bauen, (5) erste reale Nutzer testen, (6) B2B-Pilotprozess auswählen, (7) ersten Unternehmenskunden/Pilotpartner gewinnen, (8) erst danach Integrationen und Skalierung.
- Claude Max beschleunigt die Umsetzung, ersetzt aber nicht: Priorisierung, Produktentscheidungen, Testen, Datenschutz, Sicherheit, Kundenverständnis.
- Nicht ständig neue Ideen hinzufügen – den ersten funktionierenden Kernprozess vollständig umsetzen.

## 11. Offene Fragen & Entscheidungen

- (Noch keine erfassten offenen Punkte – hier landen künftig ungeklärte Entscheidungen.)

---

## Changelog

- **08.07.2026** – Playbook initial aus dem Strategie-Braindump aufgebaut: Positionierung, Zielgruppen & Nutzen, Produkt, Technik, Sicherheit, Monetarisierung, Wettbewerb, Website/Marke, Roadmap.