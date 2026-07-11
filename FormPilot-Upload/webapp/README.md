# FormPilot Web-App (Phase 1: technisches Fundament)

Next.js (App Router, TypeScript) + Supabase (Auth, PostgreSQL mit Row Level Security).
Architektur-Referenz: [`../architecture/`](../architecture/) · Design-Referenz: `../brand/Brand_Guideline.pdf` und die validierte Demo `../app/index.html`.

**Stand Phase 1:** Registrierung mit E-Mail-Bestätigung, Login/Logout, Passwort-Reset, serverseitige Sessions, geschützte App-Routen, Tabellen `profiles` + `persons` mit RLS, App-Rahmen (Sidebar/Bottom-Nav) gemäß Brand Guideline. Fachfunktionen (Safe, Vorgänge, Pakete, Freigaben) sind bewusst noch Platzhalter.

---

## Projektstruktur

```
webapp/
├── src/
│   ├── env.ts                    # Zod-validierte Umgebungskonfiguration
│   ├── middleware.ts             # Session-Refresh + Routenschutz
│   ├── lib/
│   │   ├── validation.ts         # Formular-/Pfad-Validierung (geteilt: App + Tests)
│   │   └── supabase/             # Browser-/Server-/Middleware-Clients
│   ├── components/               # Navigation, Icons, Formbausteine
│   └── app/
│       ├── (auth)/               # Login, Registrierung, Passwort-Flows + Server-Actions
│       ├── auth/callback|confirm # E-Mail-Link-Verarbeitung (PKCE + Token-Hash)
│       └── (app)/app/            # geschützter Bereich mit App-Rahmen
├── supabase/
│   ├── config.toml               # lokale Supabase-CLI-Konfiguration
│   └── migrations/               # SQL-Migrationen (profiles, persons, RLS)
└── tests/
    ├── unit/                     # env, Validierung, Routenlogik
    └── integration/rls.test.ts   # Nutzer A gegen Nutzer B (echte DB)
```

## Lokal starten (development)

Voraussetzungen: Node ≥ 20.9, [Supabase CLI](https://supabase.com/docs/guides/cli), Docker (für `supabase start`).

```bash
cd webapp
npm install
supabase start                    # lokale Supabase-Instanz (DB, Auth, Inbucket-Mailfänger)
supabase db reset                 # Migrationen anwenden
cp .env.example .env.local        # dann: anon key aus `supabase status` eintragen
npm run dev                       # http://localhost:3000
```

E-Mails (Bestätigung, Passwort-Reset) landen lokal im Inbucket: http://127.0.0.1:54324

## Prüfungen

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript-Regeln)
npm run typecheck   # tsc --noEmit
npm run test:unit   # Vitest: env, Validierung, Routenlogik
npm run test:rls    # RLS-Tests Nutzer A vs. B — braucht laufendes `supabase start`
                    # + SUPABASE_SERVICE_ROLE_KEY in .env.local (nur lokal/Test!)
npm run build       # Produktions-Build
```

Hinweis zu `test:rls`: Vitest lädt `.env.local` nicht automatisch — Variablen exportieren oder so starten:
```bash
export $(grep -v '^#' .env.local | xargs) && npm run test:rls
```

## Umgebungstrennung

| Umgebung | Zweck | Supabase-Projekt | Besonderheit |
|---|---|---|---|
| development | lokale Entwicklung | Supabase CLI (Docker) | Mails im Inbucket, Banner sichtbar |
| demo | öffentliche Demo mit Beispieldaten | eigenes Projekt | Warn-Banner „keine echten Daten“, noindex |
| preview | PR-/Feature-Vorschauen | eigenes Projekt | Banner, noindex, jederzeit zurücksetzbar |
| production | echte Nutzer | eigenes Projekt | einzige Umgebung ohne Banner; nur hier echte Daten |

Regeln: Jede Umgebung hat ihr **eigenes** Supabase-Projekt und eigene Keys — niemals Keys zwischen Umgebungen teilen. `NEXT_PUBLIC_APP_ENV` steuert Banner + robots. Der `SUPABASE_SERVICE_ROLE_KEY` gehört in **keine** deployte Laufzeitumgebung (nur lokale Tests/Admin-Skripte).

## Gehostete Umgebung einrichten (demo/preview/production)

1. Supabase-Projekt anlegen — **Region Frankfurt (eu-central-1)** wählen.
2. `supabase link --project-ref <ref>` und `supabase db push` (Migrationen).
3. Auth-Konfiguration im Dashboard:
   - Site URL = `https://<domain>`; Redirect-URLs: `https://<domain>/auth/callback`, `https://<domain>/auth/confirm`
   - E-Mail-Bestätigung aktivieren („Confirm email“), Mindest-Passwortlänge 10
   - E-Mail-Templates: Standard-`{{ .ConfirmationURL }}` funktioniert mit `/auth/callback`; alternativ Token-Hash-Links auf `/auth/confirm?token_hash={{ .TokenHash }}&type=…`
   - SMTP: eigenen EU-Versender hinterlegen (Standard-Versand von Supabase ist nur für Entwicklung gedacht)
4. Hosting-Umgebungsvariablen setzen (`.env.example` als Referenz), `NEXT_PUBLIC_APP_ENV` passend wählen.

## Sicherheits- und Residenz-Hinweise (ehrlich)

- **Row Level Security** ist auf allen Tabellen aktiv und wird durch `tests/integration/rls.test.ts` (A-gegen-B) belegt.
- Supabase-Projekte in Frankfurt speichern die Daten in Deutschland, laufen aber auf AWS-Infrastruktur (US-Konzern) und Supabase Inc. ist ein US-Unternehmen. Die Marketing-Aussage „ausschließlich europäische Dienstleister“ aus `architecture/DATA_RESIDENCY.md` ist damit **nicht** erfüllt — zulässig bleibt „Speicherort Deutschland (Frankfurt)“. Details und Konsequenzen: `architecture/DATA_RESIDENCY.md`, `architecture/HOSTING_DECISION.md`.
- Es werden keine Sicherheitsaussagen im Produkt gemacht, die nicht umgesetzt sind (Freigabeliste: `architecture/SECURITY_MODEL.md` §12).
