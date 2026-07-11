# HOSTING_DECISION — Hosting-Entscheidung

Version 0.1 · Stand Juli 2026 · Status: Empfehlung zur Freigabe (ADR-4)

---

## 1. Anforderungen (aus Produkt & Recht abgeleitet)

| # | Anforderung | Härte |
|---|---|---|
| H1 | Speicherort personenbezogener Inhaltsdaten in Deutschland, mindestens EU/EWR | Muss |
| H2 | Betreibbar durch 1 Person (überschaubare Ops-Last) | Muss |
| H3 | PostgreSQL + S3-kompatibler Objektspeicher + Linux-VMs | Muss |
| H4 | Nachweisbare RZ-Zertifizierung (ISO 27001) des Providers | Muss |
| H5 | Kalkulierbare Kosten in der 0–10-k-Nutzer-Phase (< 100 €/Monat Start) | Soll |
| H6 | Exit-Fähigkeit: Standard-Technologien, kein Provider-Lock-in | Soll |
| H7 | Minimierung von Nicht-EU-Jurisdiktionsrisiken (US CLOUD Act) | Soll |
| H8 | Wachstumspfad (mehr Leistung, Read-Replica, ggf. zweite Zone) | Soll |

## 2. Ehrliche Einordnung der Jurisdiktionsfrage

- „EU-Region eines US-Hyperscalers“ erfüllt H1 (Speicherort), aber **nicht** H7: US-Anbieter unterliegen als Unternehmen dem US CLOUD Act, unabhängig vom Rechenzentrumsstandort. Wer mit „kein US-Zugriff“ werben will, darf keinen US-Konzern in der Kette für Inhaltsdaten haben.
- Umgekehrt gilt: Ein deutscher Provider macht FormPilot nicht automatisch „sicher“ — Provider-Standort ersetzt keine eigene Härtung (SECURITY_MODEL.md). Beide Aussagen werden im Marketing sauber getrennt.
- Zulässige Werbeaussage hängt an der schwächsten Stelle der Kette (inkl. E-Mail, Monitoring, PSP) — vollständige Liste in DATA_RESIDENCY.md.

## 3. Optionsvergleich

| Option | H1 DE | H2 Ops | H3 Dienste | H4 Zert. | H5 Kosten | H7 US-Risiko | Bewertung |
|---|---|---|---|---|---|---|---|
| **Hetzner (Falkenstein/Nürnberg)** | ✔ DE | gut (einfache VMs, Snapshots) | VMs ✔, Object Storage ✔ (S3-kompatibel), **kein Managed Postgres** → selbst betreiben | ISO 27001 (RZ) | sehr gut (~30–60 €/M Start) | niedrig (dt. Unternehmen) | **Empfehlung** |
| IONOS Cloud | ✔ DE | mittel | VMs ✔, S3 ✔, Managed Postgres ✔ | ISO 27001, BSI C5 verfügbar | mittel | niedrig | starke Alternative, wenn Managed-DB Pflicht wird |
| StackIT (Schwarz-Gruppe) | ✔ DE | mittel | vollständiger, enterprise-orientiert | ISO 27001, C5 | höher | niedrig | Kandidat für spätere Enterprise-/Kommunal-Anforderungen |
| Open Telekom Cloud | ✔ DE | mittel–aufwendig | vollständig | ISO, C5 | höher | niedrig | wie StackIT; für v1 überdimensioniert |
| Scaleway (Paris/Amsterdam) | ✖ (EU, nicht DE) | gut | Managed Postgres ✔, S3 ✔ | ISO 27001 | gut | niedrig (frz.) | gut, aber „Serverstandort Deutschland“-Aussage entfällt |
| AWS eu-central-1 / Azure / GCP (Frankfurt) | ✔ Standort DE | sehr gut (Managed alles) | vollständig | umfassend | mittel (steigt) | **hoch** (US-Konzern) | nur wählen, wenn H7 bewusst aufgegeben wird |

## 4. Entscheidung (Empfehlung)

**Primär: Hetzner, Region Falkenstein/Nürnberg (Deutschland).**

Setup v1:
- 2 Cloud-VMs (getrennt): `app` (Backend+Frontend-Auslieferung, Docker Compose) und `db` (PostgreSQL 16, nur privates Netz), beide mit Volume-Verschlüsselung und Cloud-Firewall.
- Hetzner Object Storage (S3-kompatibel, DE) für verschlüsselte Dokumente (Ciphertext-only, SECURITY_MODEL.md §5) und verschlüsselte DB-Backups (pgBackRest/WAL-G, PITR).
- Snapshots + Offsite-Backup-Kopie bei einem zweiten EU-Anbieter (z. B. IONOS S3) gegen Provider-Single-Point-of-Failure.
- IaC: Terraform (Ressourcen) + Ansible (Konfiguration); reproduzierbarer Neuaufbau < 1 Tag (getestet).
- Begleitdienste (alle EU, per AVV): transaktionale E-Mail über EU-Anbieter (z. B. Brevo/Scaleway TEM), Fehler-Monitoring Sentry-EU-Region oder self-hosted GlitchTip, Uptime-Monitoring EU.

Begründung: erfüllt H1–H7 am besten für die reale Teamgröße; einziger relevanter Nachteil (kein Managed Postgres) wird durch automatisierte Backups + getestete Restores kompensiert und ist zugleich der größte Kostenvorteil.

**Eskalationspfad:** Wenn Managed-DB-Bedarf oder Enterprise-/Kommunal-Compliance (C5-Testat der Infrastruktur) entscheidend wird → Migration zu IONOS oder StackIT; durch Standard-Stack (Postgres, S3-API, Docker) ist der Wechsel eine Datenmigration, keine Re-Architektur (H6).

## 5. Bewusst NICHT gewählt

- US-Hyperscaler trotz Komfortvorteil: kollidiert mit dem Kern-Vertrauensversprechen und H7; ein späterer Rückzug aus einer tiefen Managed-Service-Nutzung wäre teuer.
- Kubernetes/Managed-K8s: Betriebskomplexität ohne v1-Nutzen.
- Serverless/Edge-Architekturen: Datenlokalität und Krypto-Kontrolle schwerer nachweisbar.

## 6. Kostenrahmen (Größenordnung, v1)

| Posten | €/Monat (ca.) |
|---|---|
| 2 VMs (je 4 vCPU/8–16 GB) | 30–50 |
| Object Storage (100 GB + Traffic) | 5–15 |
| Backup-Zweitstandort | 5–10 |
| E-Mail, Monitoring | 0–20 |
| **Summe Start** | **≈ 40–95** |

## 7. Offene Punkte zur Freigabe

1. Bestätigung Hetzner vs. IONOS (Managed Postgres als Komfort-Argument).
2. Offsite-Backup-Anbieter festlegen.
3. Domain-/DNS-Strategie (Registrar EU, DNSSEC, DMARC p=reject).
4. Zeitpunkt eines externen Ops-Reviews (vor Launch empfohlen).
