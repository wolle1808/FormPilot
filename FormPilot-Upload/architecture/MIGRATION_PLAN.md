# MIGRATION_PLAN — Von der Demo zum produktiven MVP

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe

---

## 1. Ausgangslage (Ist)

- `app/index.html` (v0.9.1): Ein-Datei-Demo, Vanilla JS, localStorage, alle Kernflows simuliert, bewusst ohne Backend. Getestet, stabil, ehrlich als Demo gekennzeichnet.
- Tester wurden ausdrücklich angewiesen, **keine echten Daten** einzugeben; es existieren keine servergespeicherten Nutzerdaten.
- Wertvoll an der Demo: validierte Flows und Texte, Feldkatalog, Anforderungs-Postenlogik, Freigabe-3-Schritte-UX, Brand-Umsetzung.

## 2. Strategie-Entscheidung: Neubau neben der Demo (ADR-2)

**Kein Umbau der Demo zum Produkt.** Gründe:
1. Die Demo ist eine 2.000-Zeilen-Einzeldatei mit String-konkateniertem HTML — als Produkt-Frontend eine dauerhafte XSS- und Wartbarkeitshypothek (SECURITY_MODEL.md §10).
2. Das Produkt braucht API-first-Struktur, Tests, CSP ohne `unsafe-inline` — das ist im Demo-Ansatz nicht nachrüstbar, ohne ihn faktisch neu zu schreiben.
3. Die Demo hat weiter einen Job: Marketing-Playground („ausprobieren ohne Konto“) und UX-Referenz.

Konsequenzen:
- Neues Repository/Verzeichnis (Monorepo: `backend/`, `frontend/`, `infra/`), die Demo bleibt unter `app/` eingefroren (nur noch kritische Fixes).
- **Übernommen werden Konzepte, nicht Code:** Feldkatalog → `field_definitions`-Seed; Anforderungs-Katalog (CATALOG-Regexes) → Analyse-Service-Seed; alle deutschen Produkttexte und Validierungsmeldungen → i18n-Dateien; Design-Tokens (CSS-Variablen) → Frontend-Theme; Seed-Personas (Maurice/Heinz) → Demo-Konto im Produkt.

## 3. Migrationspfade im Überblick

| Pfad | Inhalt | Aufwandstreiber |
|---|---|---|
| P-A Code | Neubau Frontend+Backend, Konzeptübernahme aus Demo | IMPLEMENTATION_PLAN.md |
| P-B Demo-Nutzerdaten | localStorage-Export → Import ins Produkt (optional, Komfort) | gering |
| P-C Betrieb | Netlify (statisch) → Hetzner-Infrastruktur (HOSTING_DECISION.md) | IaC einmalig |
| P-D Domains | Demo unter `demo.formpilot.…`, Produkt unter `app.formpilot.…` | gering |
| P-E Schema-Zukunft | Migrations-Disziplin ab erster Produktivwoche | Prozess |

## 4. P-B: Übernahme von Demo-Daten (bewusst klein gehalten)

- Die Demo erhält (bereits vorhanden: Datenexport als JSON) — das Produkt bekommt einen **Import-Assistenten**: JSON einlesen → Feld-Mapping anzeigen → Nutzer bestätigt jede Übernahme (gleiches UX-Muster wie „Daten aus Foto“).
- Kein automatischer Sync, keine Pflicht: Da Tester keine echten Daten eingeben sollten, ist der Import Komfort, nicht Migration im engen Sinn.
- Sicherheitsregel: Import validiert gegen den Feldkatalog, verwirft Unbekanntes, markiert alles als `source=import, needs_review=true`.

## 5. P-C/P-D: Betriebsübergang

1. Infrastruktur per Terraform/Ansible aufbauen (Staging zuerst), Restore-Test vor erstem echten Nutzer.
2. Produkt unter `app.`-Subdomain live; Demo bleibt parallel erreichbar, verlinkt aufs Produkt („Jetzt echtes Konto anlegen“).
3. Netlify-Feedback-Formular bleibt für die Demo; Produkt-Feedback läuft über eigenes Backend.
4. Abschaltkriterium Demo: wenn < X Besuche/Monat oder Produkt-Onboarding nachweislich besser konvertiert — Entscheidung explizit, nicht schleichend.

## 6. P-E: Schema-Migrations-Disziplin (ab Tag 1 des Backends)

- Jede Schemaänderung als versionierte SQL-Migration im Repo (Tool: Drizzle-Kit/Atlas), CI wendet Migrationen auf eine Wegwerf-DB an + führt Schema-Drift-Check aus.
- Expand-Contract-Muster für Änderungen an belegten Tabellen (erst additiv, dann Umzug, dann Abbau) — Zero-Data-Loss auch ohne Zero-Downtime-Anspruch.
- Vorbereitete Tabellen (DATA_MODEL.md §9) werden als Migration angelegt, sobald ihr Modul beginnt — nicht auf Vorrat verändert.
- Rollback-Politik: Migrationen sind vorwärts-korrigierend (neue Migration statt Down-Skripte in Produktion); Backups + PITR sind das echte Sicherheitsnetz.

## 7. Reihenfolge und Abhängigkeiten

```
Woche 0        Infra-Grundgerüst (P-C Staging) ─┐
Phase 1–3      Neubau Kernprodukt (P-A)         ├─► Private Beta (geladene Nutzer)
parallel spät  Import-Assistent (P-B)          ─┘
Beta-Ende      DNS-Umbau (P-D), Demo verlinkt Produkt
```

Harte Abhängigkeiten: Kein echter Nutzerdatensatz vor bestandenem Restore-Test + Basis-Härtung (SECURITY_MODEL §2–§5) + Datenschutz-Grundausstattung (DATA_RESIDENCY §5).

## 8. Risiken der Migration

| Risiko | Gegenmaßnahme |
|---|---|
| Zwei Codebasen driften (Demo vs. Produkt) | Demo eingefroren; Texte/Feldkatalog haben eine Quelle im Produkt-Repo, Demo wird nicht mehr inhaltlich gepflegt |
| Neubau verliert die validierte UX | Flows der Demo sind die Spezifikation; Abweichungen brauchen Begründung |
| „Vorbereitete“ Module wachsen heimlich zu Features | PRODUCT_BOUNDARIES.md §4 + Review-Frage „Schema oder Feature?“ |
| Solo-Kapazität überschätzt | Phasenschnitte mit auslieferbaren Zwischenständen (IMPLEMENTATION_PLAN.md), kein Big Bang |

## 9. Repository-Swap: Local* → Supabase* (Service-Abstraktion)

Damit der Wechsel von der lokalen Speicherung auf Supabase die Aufrufstellen **nicht** umbaut, kapselt eine Repository-Schicht den Datenzugriff. Die Beta enthält bereits die `Local*`-Implementierungen und eine zentrale Registry (`Repos`); die `Supabase*`-Varianten erfüllen später denselben Vertrag.

### Schnittstellen (Vertrag)

| Repository | Methoden (Auszug) | Local (Beta) | Supabase (später) |
|---|---|---|---|
| `AuthService` | `currentUser`, `isAuthenticated`, `signInDemo`, `signUpLocal`, `signOut` | State-Flags, `_wipe` | `supabase.auth.*` (E-Mail/Passwort, Magic Link, 2FA) |
| `ProfileRepository` | `listPersons`, `getPerson`, `getField`, `setField`, `listConsents`, `setConsent` | `S.persons` / `profile_fields`-Analogon | Tabellen `persons`, `profile_fields`, `consents` (RLS) |
| `DocumentRepository` | `list`, `get`, `currentVersion`, `getBlob`, `status` | IndexedDB-Blobs + State | `documents`/`document_versions` + Storage (signierte URLs) |
| `CaseRepository` | `list`, `get`, `status`, `checklist` | State | `cases`/`case_requirements`/`case_history` |
| `ShareRepository` | `list`, `get`, `getByToken`, `currentVersion`, `status`, `logAccess` | State + Token im Klartext | `shares`/`share_versions`/`share_items`; Token gehasht; `resolve_share`-RPC |
| `NotificationRepository` | `list`, `unreadCount`, `markRead`, `markAllRead` | State | `notifications` (RLS) |
| `AuditRepository` | `record`, `list` | `addLog`/`S.log` | `audit_events` (append-only) |

### Regeln beim Swap
- **Synchron → asynchron:** Die Local-Methoden sind synchron; die Supabase-Varianten liefern dieselben Formen als `Promise`. Aufrufstellen werden beim Umzug `await`-fähig gemacht (die UI-Aktionen sind bereits überwiegend `async`).
- **Ein Austauschpunkt:** Nur die Registry `Repos` wird umgestellt (`backend: 'local' → 'supabase'`); Views/Aktionen bleiben unverändert.
- **Token & Empfänger:** `ShareRepository.getByToken` wird serverseitig zu `resolve_share` (Token-Hash-Vergleich, Ablauf-/Widerruf-/Passwortprüfung, nur Snapshot-Rückgabe) — der Client bekommt nie die Rohtabellen.
- **Audit unveränderlich:** `AuditRepository.record` schreibt in eine append-only-Tabelle; kein Update/Delete für Nutzerrollen (RLS_CONCEPT.md §5).
- **Snapshots bleiben Snapshots:** Die in der Beta eingefrorenen Freigabewerte/-versionen entsprechen 1:1 `share_items` (Wert + `document_version_id`) — die Datenregel „keine stille Änderung“ ist schon im Modell verankert.

### Reihenfolge
1. Schema + RLS anlegen (SUPABASE_SCHEMA.md, RLS_CONCEPT.md), Integrationstests grün.
2. `Supabase*`-Repos gegen den identischen Vertrag implementieren, gegen die Local-Suite testen.
3. Registry umstellen, Aufrufstellen `await`-fähig machen, Feldkatalog/Seed übernehmen.
4. Empfängeransicht auf `resolve_share` + signierte URLs umstellen.
