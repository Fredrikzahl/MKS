# MKS – Maskinentreprenør Kurt Sandnes AS

Nettsiden til Kurt Sandnes AS: brøyting og vintervedlikehold i Tromsø siden 1997.

- `public/` er den ferdige siden som Vercel publiserer.
- `src/` er kilden: sidene i `src/pages/`, stil i `site.css`, skript i `site.js` og scroll-filmen i `film.js`. `build.py` bygger `public/` på nytt.
- `api/foresporsel.js` sender skjemaet på forsiden til post@kurtsandnes.no, med kopi til kunden, via Resend.

## Oppsett i Vercel

Legg inn disse miljøvariablene:

- `RESEND_API_KEY` er API-nøkkelen fra resend.com. Domenet kurtsandnes.no må være verifisert der.
- `MAIL_FROM` er valgfri. Standard er `Kurt Sandnes AS <post@kurtsandnes.no>`.
- `MAIL_TO` er valgfri. Standard er `post@kurtsandnes.no`.

Uten `RESEND_API_KEY` viser skjemaet en melding om at det ikke er koblet til ennå.
