# ENVIRONMENT_VARIABLES — Umgebungsvariablen & Secret-Handhabung

Version 0.1 · Stand Juli 2026
Bezug: `.env.example` (Root), `webapp/.env.example`, SECURITY.md, RLS_CONCEPT.md §7

**Grundregel:** Keine Secrets im Repository. Committet werden **nur** Beispieldateien mit Platzhaltern (`*.env.example`). Echte Werte gehören in `.env.local` (gitignored) bzw. in den Secret-Store der Plattform.

---

## 1. Beta (`app/index.html`)

**Keine.** Die Beta läuft rein im Browser, ohne Server, ohne Schlüssel. Es gibt nichts zu konfigurieren und nichts geheim zu halten.

---

## 2. Server-Version (`webapp/`, Supabase)

### Öffentlich (dürfen im Browser-Bundle landen)
Im Frontend als `NEXT_PUBLIC_*` gespiegelt. „Öffentlich“ heißt: durch RLS abgesichert, keine Umgehung möglich.

| Variable | Beispiel | Zweck |
|---|---|---|
| `APP_ENV` / `NEXT_PUBLIC_APP_ENV` | `development` | Umgebung: `development` \| `demo` \| `preview` \| `production` |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | Projekt-Endpoint dieser Umgebung |
| `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ey...` | anon/authenticated-Key, RLS-gebunden |
| `SITE_URL` / `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Basis-URL (E-Mail-Redirects, Freigabelinks) |

### Geheim (NIEMALS ins Frontend, nie im Client verwenden)
Nur in serverseitigen Funktionen / Skripten. Ablage im Secret-Store (Netlify/Supabase/Host), nicht als committete Datei.

| Variable | Zweck | Regel |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Umgeht RLS; Migrations-/Wartungs-/Test-Skripte | Nie `NEXT_PUBLIC_*`, nie im Bundle. Rotierbar. |
| `SHARE_TOKEN_PEPPER` | Zusatzgeheimnis fürs Token-Hashing (`SHA-256(token+pepper)`) | Lang, zufällig, pro Umgebung eigen |
| `RESEND_API_KEY` (optional) | Transaktions-E-Mails | serverseitig |
| `STRIPE_SECRET_KEY` (optional) | Zahlungen | serverseitig |

---

## 3. Umgebungstrennung

Vier Umgebungen mit **je eigenem** Supabase-Projekt (keine geteilten Datenbanken):

| Umgebung | Zweck | Besonderheit |
|---|---|---|
| `development` | lokal, Supabase CLI (`supabase start`) | Fake-Mails im Inbucket |
| `demo` | öffentliches Demo mit Beispieldaten | klar gekennzeichnet, keine echten Daten |
| `preview` | Vorschau-Deploys (z. B. pro PR) | `noindex` |
| `production` | echtes System | einzige Umgebung mit echten Nutzerdaten |

---

## 4. Regeln & Prüfungen

- **Fail-fast:** Der Server-Start validiert Pflicht-Variablen (Vorbild: `webapp/src/env.ts`, getestet in `webapp/tests/unit/env.test.ts`). Fehlt eine, bricht der Build/Start mit klarer Meldung ab.
- **`.gitignore`** enthält `.env`, `.env.local`, `.env.*.local`. Nur `*.env.example` wird committet.
- **Kein Service-Role-Key** in einer deployten Laufzeitumgebung als allgemeine Variable — ausschließlich in isolierten, nicht ausgelieferten Server-Kontexten.
- **Rotation:** Secrets sind rotierbar; nach Verdacht auf Kompromittierung sofort neu erzeugen und alte invalidieren.
- **Secret-Scanning:** vor jedem Release ein Scan (Muster: JWTs `eyJ...`, `sk_live`, PEM-Blöcke, `service_role`) — aktueller Stand: sauber.
