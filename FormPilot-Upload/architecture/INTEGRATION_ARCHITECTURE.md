# INTEGRATION_ARCHITECTURE — Integrationsarchitektur

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Prämisse (PRODUCT_BOUNDARIES.md): FormPilot arbeitet **vor** Personio, DATEV, SAP und kommunalen Fachverfahren — als Übergabeschicht. Integrationen liefern zu, sie steuern nie die Zielsysteme.

---

## 1. Integrations-Stufenmodell

| Stufe | Kanal | Beschreibung | Zeitpunkt |
|---|---|---|---|
| 0 | **Mensch-lesbare Übergabe** | PDF-Sammelmappe, Ausfüllvorschau, Antworttext für E-Mail | v1 (existiert konzeptionell in Demo) |
| 1 | **Empfängerlink** | Tokenisierte Freigabe-Seite: Ansicht/Download, Ablauf, Protokoll | v1 — die eigentliche Kern-Integration |
| 2 | **Maschinenlesbarer Export + Webhooks** | Freigabe zusätzlich als strukturiertes JSON (signiert); Webhooks über Ereignisse (share.created, share.revoked …) | v1.x — Schema ab v1 stabil |
| 3 | **Konnektoren** | Push in Zielsysteme: Personio API, DATEV-Formate, SAP-Schnittstellen | nach Org-Portal |
| 4 | **Kommunal/hoheitlich** | FIM/XÖV-konforme Datensätze, BundID/eID als Identitäts-Zulieferer | vorbereitet, ohne Termin |

Prinzip: Jede höhere Stufe baut auf denselben zwei Verträgen auf — dem **Freigabe-Schema** und dem **Ereignisstrom**. Beides wird in v1 sauber definiert; genau das ist die „architektonische Vorbereitung“.

## 2. Vertrag 1: Freigabe-Schema (Payload der Übergabe)

Stabiles, versioniertes JSON (`formpilot.share/v1`), das jede Freigabe beschreibt:

```json
{
  "schema": "formpilot.share/v1",
  "share_id": "…",
  "created_at": "…", "expires_at": "…",
  "subject": { "person_ref": "opaque", "display_name": "…", "assurance_level": "self_declared" },
  "purpose": "Werkstudentenvertrag ab 01.08.2026",
  "items": [
    { "type": "data", "key": "steuerid", "fim_id": null, "label": "Steuer-Identifikationsnummer", "value": "…", "sensitive": true },
    { "type": "document", "category": "bildung", "title": "Immatrikulationsbescheinigung", "mime": "application/pdf", "sha256": "…", "download_ref": "…" }
  ],
  "signature": "ed25519:…"
}
```

Regeln:
- Feld-`key`s kommen aus dem zentralen Feldkatalog (`field_definitions`) — derselbe Katalog, den die Nutzer-App verwendet. Kein zweites Vokabular.
- `fim_id` (nullable) ist der vorbereitete Anker für kommunale Datenfeld-Standards (FIM); Befüllung erfolgt erst mit Stufe 4, kostet heute nur eine Spalte.
- Payload signiert (Ed25519, veröffentlichter Public Key) — Empfängersysteme können Echtheit prüfen, ohne FormPilot zu fragen.
- Abwärtskompatibilität: additive Änderungen in v1; Breaking Changes nur als `share/v2` parallel.

## 3. Vertrag 2: Ereignisstrom (Outbox → Webhooks)

- Quelle ist `audit_events` (DATA_MODEL.md §8) — Transactional-Outbox-Muster: Ereignis entsteht in derselben DB-Transaktion wie die Fachänderung; ein Dispatcher versendet asynchron.
- Webhook-Sicherheit: HMAC-Signatur pro Endpoint-Secret, Zeitstempel gegen Replay, Retries mit Backoff, Dead-Letter-Status sichtbar.
- Ereignis-Namensraum ab v1 festgelegt (`share.created`, `share.accessed`, `share.revoked`, `case.completed`, `document.expiring` …) — auch wenn v1 noch keinen externen Abnehmer hat: die interne Benachrichtigungs-Engine konsumiert denselben Strom (ein Pfad, früh getestet).

## 4. Zielsystem-Steckbriefe (Stufe 3, realistisch bewertet)

| Ziel | Realer Weg | Aufwand/Hürden | Ehrliche Einschätzung |
|---|---|---|---|
| **Personio** | Öffentliche REST-API (Recruiting/Personaldaten), API-Credentials der Org | Marketplace-Listing optional; Feld-Mapping je Kunde | Bester erster Konnektor: klar dokumentierte API, typischer Onboarding-Use-Case deckt sich exakt mit FormPilot-Paket „Arbeitsbeginn“ |
| **DATEV** | Kein freier API-Zugang; Wege: DATEV-Marktplatz-Partnerschaft, definierte Import-Formate (z. B. Lohn-Stammdaten), oder Übergabe an die Kanzlei als geprüftes Dokument/CSV | Partnerprogramm, Zertifizierung, Zeit | Kurzfristig realistisch: **Export im DATEV-tauglichen Format** statt Live-API. Live-Integration erst mit Org-Traktion |
| **SAP (HCM/SuccessFactors)** | OData-APIs, aber je Installation individuell; Integration läuft praktisch immer über IT der Org | Enterprise-Sales, lange Zyklen | Nicht aktiv verfolgen; Stufe-2-Export + Webhooks reichen als Andockpunkt, Rest macht die Org-IT |
| **Kommunale Fachverfahren** | FIM-Datenfelder, XÖV-Standards (z. B. XZuFi/XFall je Domäne), Übermittlung über etablierte Kanäle/Middleware | Standardisierung, Vergabeprozesse, föderale Vielfalt | Nur vorbereiten (`fim_id`, sauberes Schema). Aktiv erst mit konkretem Pilot-Partner (Kommune), sonst Ressourcenfalle |
| **BundID / eID** | Anbindung als Service-Konsument über zertifizierte eID-/eIDAS-Dienstleister; hebt `assurance_level` | Zulassung, Kosten, Aufwand | Architektur-Anker existiert (`assurance_level`); Umsetzung erst, wenn ein Vorgangstyp es zwingend braucht |

## 5. Eingehende Richtung: Org-Anfragen (vorbereitet)

Später stellen Organisationen strukturierte Anfragen („wir benötigen X, Y, Z bis Frist F“):
- Format = derselbe Postenkatalog wie `case_items` (heute schon internes Format der Anforderungsanalyse). Eine Org-Anfrage ist technisch ein vorbefüllter Vorgang.
- Sicherheitsvoraussetzung (THREAT_MODEL F8): Absender-Verifikation (Domain-Nachweis, signierte Anfragen), sonst wird FormPilot zum Phishing-Kanal. **Ohne Verifikationsmodell wird diese Richtung nicht freigeschaltet.**
- v1 enthält dafür: `organizations`-Tabelle, `source`-Feld am Vorgang, Anfrage-Schema — keine UI.

## 6. Öffentliche API (vorbereitet)

- Die interne REST-API ist von Tag 1 so geschnitten, dass eine Teilmenge später öffentlich werden kann (stabile Ressourcen, OpenAPI, keine UI-Spezifika in Antworten).
- `api_clients` (Schlüssel-Hashes, Scopes, Rate-Tiers) und `api_usage` (Metering) existieren als Schema — Voraussetzung für API-Monetarisierung (MONETIZATION_ARCHITECTURE.md).
- Kein Developer-Portal, keine öffentlichen Keys in v1.

## 7. Anti-Ziele der Integrationsarchitektur

- Kein bidirektionales Sync (FormPilot spiegelt keine Fremdsystem-Daten zurück ins Profil ohne Nutzerbestätigung).
- Kein „Roboter“-Ansatz (RPA/Screen-Scraping in Zielsysteme) — wartungsfeindlich, rechtlich heikel.
- Keine Integration, die die Freigabe-Kontrolle umgeht: Auch ein Konnektor erhält Daten ausschließlich aus einer bestätigten Freigabe mit Ablauf und Protokoll.
