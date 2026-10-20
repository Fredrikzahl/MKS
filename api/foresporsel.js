// Tar imot skjemaet på forsiden og sender e-post via Resend:
// én til post@kurtsandnes.no og en kopi til kunden.
const TO = process.env.MAIL_TO || 'post@kurtsandnes.no';
const FROM = process.env.MAIL_FROM || 'Kurt Sandnes AS <post@kurtsandnes.no>';

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const FIELDS = [
  ['navn', 'Navn'], ['telefon', 'Telefon'], ['epost', 'E-post'], ['firma', 'Firma / borettslag'],
  ['kunde', 'Kundetype'], ['tjeneste', 'Tjeneste'], ['storrelse', 'Størrelse'],
  ['adresse', 'Adresse'], ['befaring', 'Befaring'], ['beskrivelse', 'Beskrivelse'],
];

async function send(key, msg) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not-configured' });

  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!d.navn || !d.telefon || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.epost || '')) {
    return res.status(400).json({ ok: false, error: 'missing-fields' });
  }

  const rows = FIELDS.filter(([k]) => d[k]).map(([k, l]) => `<tr><td style="padding:4px 12px 4px 0;color:#555">${l}</td><td style="padding:4px 0"><b>${esc(d[k])}</b></td></tr>`).join('');
  const table = `<table style="font:15px/1.4 Arial,sans-serif">${rows}</table>`;
  const en = d.sprak === 'en';

  try {
    await send(key, {
      from: FROM, to: [TO], reply_to: d.epost,
      subject: `Ny forespørsel: ${d.navn}${d.adresse ? ' – ' + d.adresse : ''}`,
      html: `<p style="font:15px Arial,sans-serif">Ny forespørsel fra nettsiden:</p>${table}`,
    });
    await send(key, {
      from: FROM, to: [d.epost], reply_to: TO,
      subject: en ? 'Copy of your request to Kurt Sandnes AS' : 'Kopi av forespørselen din til Kurt Sandnes AS',
      html: `<p style="font:15px/1.5 Arial,sans-serif">${en
        ? `Thank you, ${esc(d.navn.split(' ')[0])}! We will get back to you as soon as we can, unless it is snowing. Then we are out clearing, because our customers always come first. So will you, once you become one of them.`
        : `Takk, ${esc(d.navn.split(' ')[0])}! Vi tar kontakt snarest, med mindre det snør. Da er vi ute og brøyter, for kundene våre kommer alltid først. Det gjør du også, når du blir en av dem.`}</p>${table}<p style="font:15px Arial,sans-serif">Kurt Sandnes AS · 905 55 989 · post@kurtsandnes.no</p>`,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ ok: false });
  }
};
