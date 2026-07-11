# FormPilot — Stand & nächste Schritte (nach QA v0.6)

## P0 — gefunden und behoben ✔

1. **Kein Produktverständnis am Einstieg** — Tester landeten auf einem Login ohne Erklärung. → Startseite mit Nutzenversprechen, 5 Nutzenpunkten, Testhinweis und „Demo starten" als Primärweg.
2. **Kernflow-Lücke Vorgang → Paket** — „Paket vorbereiten" fehlte im Vorgang. → Button ergänzt, wählt passende Vorlage (Onboarding/Pflege) automatisch vor.
3. **Feedback-Formular ohne Testfragen & ohne Export** — → Neues Schema (Verständlichkeit 1–5, Vertrauen 1–5, Nutzen Ja/Vielleicht/Nein, Unklar/Fehlt/Verbessern, Name/E-Mail optional), Netlify-Form angepasst, JSON-Export in Sicherheit & Zugriff.
4. **Demo-Reset warf Tester auf den Login zurück** — → Reset führt jetzt eingeloggt ins Onboarding.

## P1 — behoben ✔

- Goal-abhängige „Dein nächster Schritt"-Karte nach dem Onboarding (7 Testziele gemappt)
- Sensible Daten im Freigabe-Flow markiert (Schritt 1 + Zusammenfassung + Warnbanner)
- „Demo-Freigabe — im echten Betrieb wäre dies ein geschützter Link" im Ergebnis
- Empty State für Pakete; toter Support-Link → mailto; Onboarding-Ziele nach Testliste
- Sprach-Audit: keine KI-Buzzwords, kein Lorem Ipsum (verifiziert per Skript)
- Mobile: Onboarding-Raster 1-spaltig auf kleinen Screens, iOS-Zoom-Fix, Suche/Mitteilungen im Mobile-Kopf

## P1 — offen (bewusst zurückgestellt)

- Tastatur-Fokusreihenfolge in Modals (Accessibility-Feinschliff)
- Personen-Umschalter auf Mobil nur über Profil/Modal erreichbar (ausreichend, nicht ideal)
- Vorgangs-Checkliste im Vorgang nur lesend (bearbeiten führt über „Anforderung öffnen")

## P2 — nach erstem Feedback

- Leichtgewichtiges Nutzungs-Tracking (wo brechen Tester ab?)
- Mehr Formular-/Paketvorlagen (BAföG, Kindergeld, Erasmus)
- Unternehmensportal über die Demo hinaus
- Premiumfunktionen / Pricing-Test

## Backend-Anforderungen (für echten Betrieb)

- Auth (E-Mail-Verifizierung, 2FA, Sessions), verschlüsselter Dokumentenspeicher (signierte URLs)
- OCR/Extraktion für „Daten aus Foto übernehmen" (der UI-Vertrag steht komplett)
- Echte Freigabelinks (zeitlich begrenzt, Passwort, Zugriffprotokoll serverseitig)
- Datenmodell siehe Funktionsliste Kap. 23; DSGVO: Auskunft, Export, Löschung, Einwilligungs-Versionierung

## Security vor echtem Launch

- Keine sensiblen Daten in localStorage (aktuell nur Demo-Daten — deshalb der Testhinweis)
- CSP-Header, verschlüsselte Speicherung, kein Klartext-Logging, Rate-Limiting für Links

## Nächste Produktentscheidungen

1. Zielgruppe schärfen: Werkstudenten-Onboarding vs. Pflege-Angehörige (beide Flows testen lassen, Feedback vergleichen)
2. „Würdest du es nutzen?"-Quote als Kernmetrik der Beta
3. Entscheidung Backend-Stack erst nach 20+ Feedbacks
