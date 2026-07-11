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
- **Ein-Satz-Kern (CEO-Entscheidung):** Persönliche Daten und Dokumente einmal hinterlegen, Anforderungen schneller verstehen, vollständig beantworten und kontrolliert freigeben. Alles, was nicht direkt darauf einzahlt, wird gestrichen oder deutlich nach hinten verschoben.
- FormPilot darf **nicht** gleichzeitig Dokumentensafe, E-Mail-Programm, Familienverwaltung, Behördenportal, Versicherungsplattform, HR-System, Signaturdienst, Passwortmanager und digitales Bürgerkonto sein. Eine Sache hervorragend lösen, nicht zehn mittelmäßig.
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

### V1-Kernprodukt (verbindlicher MVP-Umfang)

Das ist der reduzierte Funktionsumfang, auf den zuerst alles ausgerichtet wird – abgeleitet aus der CEO-Scope-Entscheidung.

**Privatnutzer:**
- Registrierung und sichere Anmeldung; persönliches Profil; mehrere einfache Personenprofile
- Wichtige wiederverwendbare Datenfelder + wenige eigene Felder
- Dokumentensafe: hochladen, fotografieren, Kategorien, Gültigkeitsdaten, Dokumentversionen, Suche
- Anforderung als Text, Screenshot, Brief oder PDF einfügen → benötigte Angaben und Dokumente erkennen → Status „vorhanden / fehlt / prüfen" → fehlende Inhalte ergänzen
- Vorgang erstellen, Frist speichern, Checkliste abarbeiten
- Sichere Freigabe erstellen: Ablaufdatum, vollständige Zusammenfassung, Freigabelink, Zugriffsprotokoll, Widerruf
- Benachrichtigungen zu Fristen, Zugriffen, Ablaufdaten; Datenexport; Konto löschen; einfache Hilfe

**Unternehmen:**
- Unternehmenskonto, Organisation verifizieren, maximal drei Rollen
- Anfragevorlagen, benötigte Daten/Dokumente auswählen, Anfrage senden, Status sehen
- Vollständige Unterlagen empfangen, Nachforderung senden, Personio-Integration, einfache Abrechnung, Auditprotokoll

**Technischer Kern:** echte Authentifizierung, Datenbank, verschlüsselter Dokumentenspeicher, Berechtigungssystem, Auditlogs, Freigabetoken mit Ablauf/Widerruf, Virenscan, Backups, DSGVO-Funktionen, responsive Webapp, saubere Unternehmensschnittstelle.

### Konkrete V1-Entscheidungen (Umfang je Bereich)

- **Dokumentkategorien (fest, ~11):** Ausweise, Bildung, Arbeit, Wohnen, Bank & Finanzen, Versicherung, Gesundheit & Pflege, Behörden, Verträge, Familie, Sonstiges. Keine Unterordner-Pflicht, keine verschachtelten Hierarchien.
- **Dateiformate:** PDF, JPG, PNG, evtl. HEIC. Keine exotischen Formate (TIFF, Office, XFA, CAD, XML, verschlüsselte Archive).
- **Stammdaten (Standard-Set):** Name, Geburtsdatum/-ort, Staatsangehörigkeit, Adresse, E-Mail, Telefon, Steuer-ID, Sozialversicherungsnr., Krankenkasse + Versichertennr., IBAN + Bankname, Arbeitgeber, Hochschule/Studiengang/Matrikelnr., Führerschein- und Ausweisdaten – plus wenige eigene Felder. Keine riesige vordefinierte Feldbibliothek.
- **Eigene Felder:** nur einfache Typen (Text, Datum, Nummer/Kennung), optional „sensibel", optional Erinnerung. Keine frei konfigurierbare Datenbank mit Formellogik/Validierung.
- **Vorgangsstatus (7):** Offen, Unvollständig, Bereit, Übermittelt, Wartet auf Rückmeldung, Erledigt, Abgelehnt.
- **Vorgangsvorlagen (8):** Arbeitgeber-Onboarding, Bewerbung, Mietbewerbung, Studium/Immatrikulation, Behördliche Anforderung, Versicherungsfall, Pflegevorgang, Freier Vorgang. Alles Übrige läuft über „Freier Vorgang".
- **Freigaben (Kern):** Empfänger, Zweck, ausgewählte Angaben/Dokumente, Ablaufdatum, Ansicht oder Download, optional Passwort, vollständige Zusammenfassung, Link, Zugriffsprotokoll, Widerruf. Bewusst ohne Wasserzeichen, Geräte-/Domainbindung, seitenweise Freigabe, Empfänger-Kommentare.
- **Unternehmensrollen (3):** Administrator, Sachbearbeiter, Nur Lesen. Später ggf. Datenschutz- und Integrationsadministrator.
- **Formularassistent:** Formular hochladen, Felder erkennen (soweit zuverlässig), Profilwerte vorschlagen, prüfen, als vorbereitete PDF/Datenübersicht exportieren. Später ausbauen, nicht erstes Hauptfeature.
- **Pakete:** für V1 vereinfachen oder ganz streichen (siehe offene Entscheidung, Kat. 11) – Alternative: Mehrfachauswahl in der Freigabe, häufige Auswahl später als Vorlage speichern.

### Langfristiges Zielbild (vollständiger Funktionskatalog)

Ein detaillierter Funktionskatalog (50 Bereiche) beschreibt das langfristige Zielbild – nicht den V1-Umfang. Vollständige Fassung liegt in `formpilot_inbox_archive.md`. Grob geclustert:

- **Konto & Identität:** Registrierung/Anmeldung (inkl. Passkeys, SSO), Onboarding, persönliches Profil, Mehrpersonenverwaltung, Stammdatenfelder, Datenqualität.
- **Dokumente & Vorgänge:** Dokumentensafe, Kategorien, Postfach-/E-Mail-Eingabe, Anforderungserkennung, Vorgangsmanagement, Vorgangsvorlagen, Aufgaben/Erinnerungen, Formulare, Daten-/Dokumentpakete.
- **Teilen & Empfänger:** Freigaben, Empfängeransicht, eingehende Unternehmensanfragen, Unternehmensportal.
- **Organisations-Schnittstellen:** HR/Personio, Behörden/Institutionen, Versicherungen, Hochschulen, Signaturen, EUDI/verifizierte Nachweise.
- **Assistenz & Suche:** Suche, Mitteilungen, Familien-/Haushaltsfunktionen, Vollmachten, Notfallmodus, Erkennungs-/Assistenzfunktionen.
- **Sicherheit & Compliance:** Sicherheit, DSGVO-Funktionen, Zugriffs-/Aktivitätsprotokoll, FormPilot-Admin.
- **Plattform & Integrationen:** Integrationen/API, Drittanbieter, Automatisierungen, Hilfe/Support, Barrierefreiheit, Mehrsprachigkeit, Mobile App, Browser-Erweiterung, Einstellungen.
- **Geschäft & Außenauftritt:** Monetarisierung, Website/Produktseiten, Produktanalyse, Zuverlässigkeit/Betrieb, Fehler-/Sonderfälle.

## 5. Technik & Architektur

- Nächster Schritt: bestehende Demo produktionsfähig neu aufbauen – keine weiteren Demo-Ideen.
- HTML-Demo ist Prototyp und Referenz, aber keine langfristig tragfähige Grundlage.
- Architektur darf neu aufgebaut werden, das Produkt selbst nicht.
- **Zuerst responsive Webapp (als PWA installierbar), keine native App zum Start.** Kamera-Upload über Browser, gute mobile Bedienung. Native Apps verdoppeln/verdreifachen den Aufwand.
- Kein Offline-Modus zum Start (Sync-Konflikte, Sicherheitsrisiko bei verlorenen Geräten, geringer Nutzen für den ersten Markt).
- **Etablierte Anbieter statt Eigenbau** für Infrastruktur: kein eigenes HSM, Key-Management, DDoS-Schutz, Monitoring, Mail-Infrastruktur oder Zahlungssystem. Sicher bauen, aber nicht jede Komponente neu erfinden.
- Saubere Architektur als Basis für spätere Partner- und Unternehmensanbindung; nicht jede Integration sofort umsetzen.

## 6. Sicherheit & Vertrauen

- Sicherheit ist Voraussetzung für das gesamte Produkt, keine Einzelfunktion. „Nicht hackbar" ist unrealistisch; Ziel ist ein professionelles Niveau mit mehreren Schutzschichten.
- Erforderlich u. a.: Verschlüsselung (Übertragung + Speicherung), 2FA, sichere Sitzungsverwaltung, Rollen-/Rechtekonzept, Zugriffsprotokolle, kurzlebige/widerrufbare Freigabelinks, getrennte Speicherung sensibler Daten, Backups, Wiederherstellung, Rate Limits, Schutz vor typischen Webangriffen, regelmäßige Sicherheitsprüfungen.
- **Passkeys (WebAuthn) von Beginn an architektonisch berücksichtigen** – phishingresistente Alternative zu Passwörtern, kein reines Späterfeature.
- **Step-up-Authentifizierung** (erneute Bestätigung) vor sensiblen Aktionen: Export, Freigabe, Kontolöschung.
- Unternehmens-SSO (OpenID Connect / SAML) später, wenn B2B-Bedarf da ist.
- Nie suggerieren, dass Daten automatisch oder ohne Zustimmung geteilt werden. Sensible Aktionen brauchen Prüfung, Zusammenfassung und ausdrückliche Bestätigung.
- **Keine Scheinsicherheit:** keine erfundenen Zertifizierungen oder Partnerschaften, nie „nicht hackbar" behaupten. Keine sensiblen Daten in Analytics, URLs oder Fehlermeldungen. Kein dauerhafter/versteckter Supportzugriff – Supportzugriff nur nach Zustimmung.
- Markenanmutung: wie eine gute Bank oder ein seriöses Versicherungsportal – nicht wie ein generisches KI-Startup.

## 7. Monetarisierung & Geschäftsmodell

- Privatnutzer allein erzeugen vermutlich zu geringe Zahlungsbereitschaft; ein reines B2C-Abo ist nicht das Kernmodell.
- Kombiniertes Modell: kostenloser/günstiger Privatbereich + bezahlte Premium-Funktionen + B2B-Zugänge + API-Nutzung + Enterprise-Lösungen + transaktionsbasierte Erlöse.
- **Tarifstruktur bewusst schlank:** am besten „Privat kostenlos, Unternehmen bezahlt"; sonst Kostenlos / Privat Plus / Unternehmen / Enterprise (später). Keine überkomplexen Tarife, keine Einzelabrechnung je Funktion, keine Gutschein-/Rabatt-/Add-on-Marktplätze zum Start.
- Unternehmen können für Anfragen, Workflows, Nutzerkontingente, Integrationen oder verarbeitete Vorgänge zahlen.
- Zusatzerlöse über Partnerleistungen: digitale Signaturen (ein Anbieter, z. B. DocuSign, integrieren statt selbst bauen – als kostenpflichtige Zusatzfunktion), Identitätsprüfung, Dokumentenprüfung, Versicherungs-/Behördenservices.
- Zahlung über Stripe o. ä.; **keine eigene Zahlungsplattform** (keine Wallet, keine Zahlungen zwischen Nutzern, kein Rechnungseinzug für Dritte).
- **Keine Werbung, keine Datenmonetarisierung, keine Provisionsvermittlung** – das würde das Vertrauen zerstören.
- Monetarisierung entsteht vor allem auf der Unternehmensseite; der Privatnutzer liefert Reichweite, Datenstruktur und Nutzung.

## 8. Wettbewerb & Markt

- Konkurrenz nicht nur direkte Dokumenten-Apps; der größte Wettbewerber ist oft der bestehende Prozess: E-Mail, Excel, PDF, Personalabteilung, Unternehmensportal, bestehende HR-Software.
- Ablehnungsrisiko, wenn FormPilot wie ein weiterer Systemwechsel wirkt → Botschaft: bestehende Systeme bleiben, FormPilot verbessert den Dateneingang, Integration statt vollständiger Ablösung.
- Vergleichbare Modelle eher bei Infrastruktur-/Prozesssoftware (DATEV, Personio, DocuSign) als bei Consumer-Apps: sie lösen teure, wiederkehrende Unternehmensprobleme – genau dort liegt das wirtschaftliche Potenzial.

## 9. Website, Kommunikation & Marke

- Nicht nur eine einzelne statische Landingpage; eine starke, interaktive Startseite, die visuell erzählt, wie FormPilot funktioniert (Produktsequenzen, App-Mockups, Scroll-Animationen, konkrete Use Cases).
- Beispiel-Story: Arbeitgeber fordert Unterlagen an → FormPilot erkennt benötigte Daten → fehlende Unterlagen werden angezeigt → Nutzer prüft und gibt gezielt frei → Unternehmen erhält vollständige Daten.
- **Feste Seitenliste (schlank halten):** Startseite, Produkt, Für Privatnutzer, Für Unternehmen, Sicherheit, Preise, Hilfe, Kontakt, Rechtliches, Login. Kein Blog/Forum/Community/Konfigurator/Chatbot/Branchen-Landingpages und keine erfundenen Use Cases zum Start.
- Kommunikation zeigt Nutzen statt Feature-Menge. Kernbotschaft nicht „digitaler Dokumentensafe".
- **Marken- und UX-Prinzipien (Vertrauen zuerst):** keine KI als Hauptbotschaft, keine Sparkles/„magischen" Ladeanimationen, keine Gamification sensibler Bürokratie, keine künstlichen Countdowns/roten Alarmzustände für normale Fristen, keine überladenen Dashboards, keine Miniaturansichten sensibler Dokumente auf dem Dashboard, keine Fachsprache ohne Erklärung, keine uneindeutigen Buttons wie „OK".

## 10. Umsetzung, Priorisierung & Roadmap

- Solo-Gründer: Arbeitskraft ist der größte Engpass → strikt priorisieren. Nicht gleichzeitig bauen: Privat-App, Unternehmensportal, API, Mobile-App, komplette Behördenintegration, komplette Signaturplattform.
- Reihenfolge: (1) Produktdefinition festhalten, (2) Demo stabilisieren, (3) technische Architektur festlegen, (4) produktionsfähige Webapp bauen, (5) erste reale Nutzer testen, (6) B2B-Pilotprozess auswählen, (7) ersten Unternehmenskunden/Pilotpartner gewinnen, (8) erst danach Integrationen und Skalierung.
- **Integrationsreihenfolge:** zuerst Personio (nur Onboarding-Unterlagen einsammeln, prüfen, nach Zustimmung übertragen – FormPilot sitzt vor Personio, ersetzt es nicht) → DATEV nur später und eng begrenzt, falls Kunden es verlangen → alle weiteren Systeme erst bei bezahltem Bedarf. Jede Integration erzeugt dauerhaften Wartungsaufwand.
- Claude Max beschleunigt die Umsetzung, ersetzt aber nicht: Priorisierung, Produktentscheidungen, Testen, Datenschutz, Sicherheit, Kundenverständnis.
- Nicht ständig neue Ideen hinzufügen – den ersten funktionierenden Kernprozess vollständig umsetzen.

### Bewusst NICHT im ersten Schritt (Scope-Cuts)

Explizit verschoben oder gestrichen, um Fokus auf den Kernprozess zu halten (Details in `formpilot_inbox_archive.md`):

- **E-Mail:** kein eigenes Postfach, kein Gmail-/Outlook-/IMAP-Sync, kein E-Mail-Versand. Stattdessen: Text/PDF/Screenshot einfügen, Freigabelink kopieren, Antworttext generieren.
- **Speicher & Geräte:** keine Cloudspeicher-Integrationen (Drive/OneDrive/Dropbox), keine Browser-Erweiterung, keine native App, kein Offline-Modus. Nur Datei-Upload/Drag-and-drop/Kamera.
- **Sonderkontexte:** kein Notfallmodus, Gesundheitsdaten stark begrenzt (Krankenkasse/Pflegegrad ja, keine Diagnosen/Medikamente), kein Versicherungsvergleich/-management, keine Rechtsberatung, kein vollwertiges Behördenportal (kein OZG/ELSTER/BundID zum Start).
- **Identität & Signatur:** keine EUDI-Wallet, keine eigene Identitätsprüfung/KYC, keine eigene Signaturplattform – später genau einen externen Anbieter integrieren, erst bei bezahltem Bedarf.
- **Familie & Profile:** kein Familienbetriebssystem (kein Kalender/Haushaltsaufgaben/Nachlass), Vollmachten nur als Dokument + Gültigkeitsdatum, max. 2–3 einfache Rollen, Profile begrenzt (eigenes, Partner, Kind, Eltern/Großeltern).
- **Daten & Dokumente:** keine riesige Stammdatenbank, keine frei konfigurierbare Nutzer-DB, keine PDF-Editor-Funktionen, reduzierte Kategorien und Dateiformate, einfache Dokumentherkunft statt forensischer Verifikation.
- **Vorgänge & Freigaben:** kein Aufgabenmanagement à la Asana, kein eigener Kalender, vereinfachte Vorgänge (feste Status), vereinfachte Freigaben, Pakete zunächst schlank oder gestrichen.
- **Unternehmen & Plattform:** Unternehmensportal schlank (keine CRM/Reporting-Suite), max. 3 Rollen, keine CRM-/Slack-/Teams-Integration, API stark begrenzt (wenige Partner-Endpunkte, erst bei zahlendem B2B-Kunden), keine universelle Automatisierungsplattform, KI-Funktionen begrenzt (Erkennen/Strukturieren/Vorschlagen, immer mit Nutzerprüfung).
- **Feinschliff später:** Suche einfach, Mitteilungen reduziert (In-App/E-Mail, Push später), keine breite Mehrsprachigkeit (DE zuerst, EN später), Dark Mode keine Priorität, Einstellungen reduziert, schlankes internes Admin-System, einfache Produktanalyse ohne invasives Tracking.

### Kern-Systeme, die immer verbunden bleiben

Persönliches Profil mit wiederverwendbaren Angaben · sicherer Dokumentensafe · mehrere Personen + Vollmachten · Erkennung eingehender Anforderungen · Vorgänge mit Checklisten/Fristen/Verlauf · Formulare mit vorhandenen Daten vorbereiten · sichere, zeitlich begrenzte Freigaben · Transparenz über Zugriffe · Unternehmenskonto für strukturierte Anforderungen · Schnittstellen zu Personio/DATEV/Behörden/Versicherungen/Signatur · Sicherheit, Datenschutz und nachvollziehbare Zustimmung als Grundlage jeder Funktion. Alles andere ist Erweiterung dieser Kernlogik.

## 11. Offene Fragen & Entscheidungen

- **Pakete in V1:** vereinfachen oder ganz streichen? Tendenz: für Version 1 weglassen und stattdessen Mehrfachauswahl in der Freigabe, häufige Auswahl später als Vorlage speichern. Noch final zu entscheiden.
- **Zweiter Signaturanbieter / -zeitpunkt:** genau einen Anbieter integrieren – welchen (DocuSign vs. Alternative) und ab wann, hängt an erstem zahlenden Unternehmensbedarf.
- **DATEV-Umfang:** ob/wann über strukturierte Übergabe weniger Onboarding-Daten hinaus, richtet sich nach Kundennachfrage.

---

## Changelog

- **08.07.2026** – Großer Funktionskatalog + CEO-Scope-Entscheidung eingepflegt: Kat. 4 um verbindlichen V1-MVP-Umfang, konkrete Umfangsentscheidungen (Kategorien, Felder, Status, Vorlagen, Rollen) und geclustertes Langzeit-Zielbild erweitert; Kat. 10 um „Bewusst NICHT im ersten Schritt" (Scope-Cuts) und Integrationsreihenfolge ergänzt; Kat. 1 (Ein-Satz-Kern, Abgrenzung), 5 (PWA statt native App, etablierte Infrastruktur), 6 (Passkeys/Step-up/keine Scheinsicherheit), 7 (schlanke Tarife, Stripe, keine Werbung), 9 (feste Seitenliste, UX-/Marken-Prinzipien) geschärft; Kat. 11 offene Punkte (Pakete, Signaturanbieter, DATEV) ergänzt.
- **08.07.2026** – Playbook initial aus dem Strategie-Braindump aufgebaut: Positionierung, Zielgruppen & Nutzen, Produkt, Technik, Sicherheit, Monetarisierung, Wettbewerb, Website/Marke, Roadmap.
