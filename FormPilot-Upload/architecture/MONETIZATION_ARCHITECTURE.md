# MONETIZATION_ARCHITECTURE — Monetarisierungs-Architektur

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Zweck: Die Architektur soll spätere Erlösmodelle ermöglichen, ohne dass v1 bereits Zahlungen enthält. Hier steht, was dafür heute vorbereitet wird — und was bewusst nicht.

---

## 1. Erlösmodelle (Zielbild, Reihenfolge = wahrscheinliche Einführung)

| # | Modell | Zahler | Beispiel | Architektur-Anker |
|---|---|---|---|---|
| M1 | Freemium (Privat) | Nutzer | Free: 1 Person, 20 Dokumente, 3 aktive Freigaben · Plus: Familie, unbegrenzt, Erinnerungen | `plans`, `subscriptions`, `entitlements` |
| M2 | Organisationsabos | Organisation | Org-Portal: Anfragen stellen, Status sehen, Team-Sitze | `organizations`, `org_members`, Org-`subscriptions` |
| M3 | Transaktionen | Organisation | Preis pro abgeschlossener strukturierter Übergabe (z. B. Onboarding-Vorgang) | Ereignisstrom (abrechenbare Events aus `audit_events`), `api_usage`-analoges Metering |
| M4 | API-Nutzung | Organisation/Partner | Zugriff auf Freigabe-Schema/Webhooks nach Volumen | `api_clients`, `api_usage`, Rate-Tiers |
| M5 | Integrationen | Organisation | Personio-/DATEV-Konnektor als Add-on | `integration_connections` + Entitlement-Key je Konnektor |
| M6 | Pilotleistungen | Kommune/Unternehmen | bezahlte Pilotprojekte (Setup, Anpassung, Begleitung) | keine Produktarchitektur — Vertrag + manuelle Rechnung |

Nicht-Modelle (dauerhaft ausgeschlossen, PRODUCT_BOUNDARIES.md §5): Werbung, Datenverkauf, „Pay-to-privacy“ (Sicherheits-Grundfunktionen sind nie kostenpflichtig — 2FA, Löschung, Export, Widerruf bleiben immer frei).

## 2. Architekturprinzip: Entitlements als einzige Wahrheit

```
PSP (Stripe/Mollie) ──Webhook──► billing-Modul ──► subscriptions ──► entitlements
                                                                        ▲
Produktcode fragt NIE den Plan, IMMER das Entitlement:                  │
  can(user, 'create_share')  →  entitlements.max_active_shares ────────┘
```

- Feature-Gates lesen ausschließlich `entitlements` (subject = user oder org). Pläne sind nur Bündel von Entitlements.
- Dadurch: Preisexperimente, Grandfathering, Pilot-Sonderkonditionen und manuelle Freischaltungen (M6) ohne Codeänderung.
- v1 verhält sich, als hätte jeder Nutzer ein großzügiges „beta“-Entitlement-Set — die Gates existieren aber schon im Code (No-op mit Limit ∞), damit ihre Einführung kein Refactoring ist.

## 3. Free/Plus-Grenzziehung (Vorschlag, später zu validieren)

| Fähigkeit | Free | Plus (Preisidee 4–6 €/M) | Familie |
|---|---|---|---|
| Personenprofile | 1 (+1 verwaltete) | 2 | bis 6 |
| Dokumente | 20 | unbegrenzt | unbegrenzt |
| Aktive Freigaben | 3 | unbegrenzt | unbegrenzt |
| Ablauf-Erinnerungen | Basis | erweitert (Frist-Radar) | erweitert |
| Pakete | 2 | unbegrenzt | unbegrenzt |
| Sicherheit (2FA, Export, Löschung, Widerruf, Protokoll) | **immer enthalten** | — | — |

Leitplanke aus der Marke: Das Freemium-Limit darf nie die Kontrolle beschneiden, nur die Kapazität. Kein Countdown, kein Druck-Upsell (Brand-Guideline „Keine Verkaufsmechanik“).

## 4. Metering für M3/M4 (vorbereitet)

- Abrechenbare Ereignisse sind eine Teilmenge des Ereignisstroms (z. B. `share.completed_via_org_request`, `api.request`). Der Dispatcher schreibt Zähler nach `api_usage`/`billing_usage` (Periode, Zähler, Subjekt).
- Idempotenz über Event-IDs — kein Ereignis wird doppelt bepreist.
- Preislogik lebt außerhalb des Codes (Konfiguration je Plan), Rechnungsstellung macht der PSP bzw. bei M6 die Buchhaltung.

## 5. Org-Abos (M2) — Abgrenzung

- Eine Organisation bezahlt für Komfort (Anfragen, Status, Team, Konnektoren), **nie für Zugriff auf Nutzerdaten**. Daten fließen weiterhin nur über bestätigte Freigaben des Menschen.
- Sitze über `org_members`; Abrechnung pro Sitz oder pro Anfrage-Kontingent (beides über Entitlements abbildbar).
- Kommunen (M6→M2): Beschaffungsrealität (Vergabe, AVV, ggf. C5-Nachweise) — deshalb Pilotleistungen als Einstieg, Abo erst mit belastbaren Nachweisen (DATA_RESIDENCY.md §6).

## 6. PSP-Entscheidung (ADR-6, offen)

| Kriterium | Stripe | Mollie |
|---|---|---|
| Integrationsaufwand | sehr gering (Billing, Portal, Tax) | gering (Subscriptions), weniger Komfort bei Steuer/Portal |
| Zahlarten DE | Karten, SEPA, PayPal via Umweg | Karten, SEPA, PayPal, giropay-Nachfolger — stark in DE/NL |
| Jurisdiktion | US-Konzern (IE-Entität) → Aussage „ohne US-Dienste“ entfällt für Zahlungsdaten | EU (NL) → konsistent mit Residenz-Story |
| Empfehlungstendenz | wenn Time-to-Revenue dominiert | **wenn die Residenz-Story Teil des Markenkerns bleibt (empfohlen)** |

Unabhängig von der Wahl: FormPilot speichert nie Zahlungsmittel; nur PSP-Referenzen (`psp_customer_ref`). Rechnungs-/Steuerpflichten (§14 UStG, GoBD) über PSP-Belege + Buchhaltungstool.

## 7. Was v1 konkret vorbereitet (Checkliste)

- [x] Schema: `plans`, `subscriptions`, `entitlements`, `api_clients`, `api_usage` (Migrationen, inaktiv) — DATA_MODEL.md §9
- [x] Feature-Gate-Funktion im Code, die Entitlements liest (v1: unbegrenzt)
- [x] Ereignisstrom mit stabilen Event-Typen (Grundlage Metering)
- [x] Trennung Zahlungs-/Inhaltsdaten in der Residenz-Argumentation
- [ ] Kein PSP-Code, keine Preise im UI, keine Paywall in v1

## 8. Risiken

| Risiko | Umgang |
|---|---|
| Freemium-Limits zerstören Vertrauen („Geiselhaft der Dokumente“) | Export ist immer frei; Limit wirkt nur auf Neues, nie auf Bestandszugriff |
| Zu frühe Org-Monetarisierung ohne Org-Nutzen | M2 erst nach funktionierendem Org-Anfrage-Flow mit Verifikation |
| Preis vor Wertnachweis | v1 sammelt Nutzungsdaten (aggregiert) zu Wiederverwendungs-Ersparnis als spätere Preisargumentation |
