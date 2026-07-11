# FormPilot

> Cockpit-Datei. Wer den Ordner öffnet, liest zuerst das hier — statt sich durch Ordner zu klicken.

**Was:** Persönliche Daten und Dokumente einmal ordnen, Anforderungen (Arbeitgeber, Uni, Wohnung, Pflege) mit Checklisten vorbereiten und kontrolliert freigeben.
**Status:** Beta v1.3 — Privatnutzer-Kern (v1.0) + Anforderungs-Flow (v1.1) + kontrollierter Freigabeprozess & Empfängeransicht (v1.2) **plus Sicherheits-/Datenschutz-Härtung & Supabase-Vorbereitung** (09.07.2026). **Sicherheit:** strikte CSP (`default-src 'none'`), Referrer-/Permissions-Policy, X-Frame/Frame-ancestors, X-Content-Type-Options, HSTS + no-store-Caching (netlify.toml), noindex, Google-Fonts-Abhängigkeit entfernt (kein Drittanbieter-Request), Datei-Prüfung (Magic-Bytes + Typ + 10 MB, keine ausführbaren Dateien), Output-Escaping/Event-Delegation (kein Inline-Handler), generische Fehlertexte (keine Stack Traces). **Datenschutz:** Einwilligungen mit Version & Zeitpunkt, Datenschutz- + Nutzungsbedingungen-Seite, verständlicher Export (lesbares .txt + JSON), vollständiger Konto-Lösch-Flow (aktive Freigaben werden zuerst widerrufen), Demo-Reset, feste Zusagen (kein Modelltraining, keine Werbung, keine Weitergabe ohne Zustimmung, keine Tracking-Cookies). **Audit:** klassifiziertes Protokoll (Anmeldung, Profil, Upload, Version, Löschung, Vorgang, Freigabe, Zugriff, Download, Widerruf, Ablauf, Export, Konto). **Supabase-Vorbereitung (Konzept, kein Backend gebaut):** Service-Abstraktion `Local*`-Repositories + Registry `Repos` (Vertrag für spätere `Supabase*`), plus Doku `architecture/SUPABASE_SCHEMA.md`, `RLS_CONCEPT.md`, `PRIVACY_ARCHITECTURE.md`, `ENVIRONMENT_VARIABLES.md`, Repository-Swap in `MIGRATION_PLAN.md`, `SECURITY.md` (Root), `.env.example`. Weiterhin kein Backend, kein Supabase im Code — alles lokal.
**Unternehmensbereich (v1.4, 09.07.2026):** klar getrennter Workspace (eigene dunkle Shell, Routen `#/org-*`, Wechsel „Mein Bereich ↔ Unternehmen") für strukturierte Daten- und Dokumentenanfragen. FormPilot ist die vorgelagerte Schnittstelle — das Unternehmen fordert gezielt an, die Person entscheidet selbst über jede Freigabe. Rollen: Administrator / Sachbearbeiter / Nur Lesen (durchgesetzt). Unternehmensprofil mit Verifizierungs-Prüfstatus (Demo, keine KYC). Team einladen (Link + E-Mail-Text) / Rollen / deaktivieren. Anfrage-Builder aus 6 Vorlagen (Vollzeit-Onboarding, Werkstudent, Praktikum, Minijob, Ausbildung, freie Vorlage): Datenfelder + Dokumenttypen, Pflicht/optional, **Zweck je Position (erforderlich)**, Frist, Ansprechpartner, Aktenzeichen, prüfen & senden (Link + E-Mail-Text, nichts automatisch versendet). Status-Lebenszyklus (nicht geöffnet → geöffnet → in Bearbeitung → teilweise/vollständig → übermittelt; abgelehnt/abgelaufen/widerrufen), Nachforderung als neue Version mit erneuter Zustimmung, erhaltene Daten/Dokumente ansehen + Download, Auditprotokoll, archivieren. **Datenminimierung:** Zweck je Position erforderlich, sensible Kennzeichnung, Warnung bei ungewöhnlichen Anforderungen, kein „Alles freigeben", Unternehmen sieht nur freigegebene Inhalte, Widerruf beendet Zugriff sofort. Öffentliche Empfänger-Anfrageansicht (`#/r?t=`, ohne Konto, noindex). Fokussiertes Dashboard (offene/teilweise/vollständige/abgelehnte Anfragen, Ø-Bearbeitungszeit, häufig fehlende Dokumente) — kein BI. Datenmodelle: Organization, OrganizationUser, OrganizationRole, OrganizationRequest, OrganizationRequestItem, OrganizationRequestVersion, RequestTemplate, RequestAccess, OrganizationAuditEvent. Bewusst NICHT: CRM, Kanban, Workflow-Builder, Analytics, öffentliche API, Personio/DATEV/Slack/Teams. Voller Loop verifiziert: Anfrage → Empfänger bearbeitet in FormPilot → kontrollierte Freigabe → Unternehmen sieht nur Freigegebenes; Widerruf beendet Zugriff.
**Live:** https://6a4683f9913e07be79f75588--shiny-pie-007565.netlify.app (alter Stand — v1.4 noch deployen)

## Ordnerstruktur

| Ordner | Was drin liegt |
|---|---|
| `app/` | Der Code. `index.html` = **aktuelle Live-Version** (deploybar wie sie ist). |
| `product/` | Produktkonzept + Backlog + `TESTING_GUIDE.md` + `TODO_NEXT_STEPS.md`. |
| `brand/` | Brand Guideline + Master-Logo. Die eine Quelle für Design. |
| `business/` | Für später: GTM, Pricing, Legal, Finanzen. |
| `_archive/` | Alte Stände. Nicht anfassen, nur Referenz. |

## Starten, bauen, deployen

- **Lokal starten:** `app/index.html` im Browser öffnen — fertig. Kein Build, kein npm, keine Abhängigkeiten (eine Datei, Vanilla JS).
- **Sauber lokal testen:** `npx serve app` (Feedback-Versand funktioniert nur über Netlify, lokal greift der E-Mail-Fallback).
- **Deployen:** Netlify → entweder Ordner `app/` per Drag & Drop hochladen, oder das Repo verbinden — `netlify.toml` (Repo-Root) setzt `publish = "app"` automatisch. Danach einmal selbst Feedback senden und unter *Netlify → Forms* prüfen, ob es ankommt.
- **Feedback einsehen:** Netlify-Dashboard → Forms → „feedback". Zusätzlich in der App exportierbar (Sicherheit & Zugriff → „Feedback exportieren").

## Was ist echt, was ist simuliert?

| Echt | Simuliert (Demo) |
|---|---|
| Alle UI-Flows, Navigation, Zustände | Freigabelinks (kein echter geschützter Link) |
| Datei-Upload inkl. Vorschau, Download, Versionen (IndexedDB) | Geräte-Liste & 2FA (als Vorschau gekennzeichnet) |
| Anforderungs-Analyse (lokale Schlüsselwort-Erkennung, Frist & Aktenzeichen) | Zugriffe von Empfängern (per Demo-Button simulierbar) |
| Formale Validierung mit echten Prüfziffern (IBAN mod-97, Steuer-ID, SVNR) | E-Mail-Versand, Unternehmens-Anfragen |
| Speichern im Browser (localStorage + IndexedDB), Demo-Reset, Datenexport als JSON | |
| Feedback-Versand via Netlify Forms | |

**Nicht produktionsreif:** kein Backend, keine echte Verschlüsselung, keine Authentifizierung, kein OCR, keine Mandantentrennung. Siehe `product/TODO_NEXT_STEPS.md`.

## Regeln (damit es nicht wieder chaotisch wird)

1. **Eine Live-Version.** `app/index.html` ist immer der aktuelle Stand. Kein `backup_v2`, `final_final` — dafür ist Git da.
2. **Logo:** Master liegt in `brand/logo.svg`. `app/formpilot_logo.svg` ist die Deploy-Kopie (von der HTML referenziert). Änderung immer erst im Master, dann rüberkopieren.
3. **Alte Stände** wandern nach `_archive/`, nicht daneben ins App-Verzeichnis.

## Nächste Schritte

- [ ] Deployen (v1.0) + Netlify-Form-Test
- [ ] Testlink + `product/TESTING_GUIDE.md`-Text an 5–10 Tester schicken
- [ ] Netlify-Deploy an `app/` koppeln (Auto-Deploy bei Commit)
- [ ] Nach 10 Testern: Feedback auswerten → `product/TODO_NEXT_STEPS.md` priorisieren
