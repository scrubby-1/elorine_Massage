// Opmaak van de e-mails aan klanten en aan Elorine.
import { formatDatumNL, formatTijd } from './dates'

export function escapeHtml(tekst: string) {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface Boeking {
  naam_klant: string
  email_klant: string
  telefoon_klant: string
  datum: string
  starttijd: string
  eindtijd: string
  opmerking?: string | null
}

function moment(b: Boeking) {
  return `${formatDatumNL(b.datum)} van ${formatTijd(b.starttijd)} tot ${formatTijd(b.eindtijd)}`
}

function knop(link: string, tekst: string) {
  return `<p><a href="${link}" style="display:inline-block;background:#059669;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">${tekst}</a></p>`
}

function omhulsel(inhoud: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#292524;max-width:560px">${inhoud}<p style="margin-top:24px">Met vriendelijke groet,<br />Elorine</p></div>`
}

// 1. Aan Elorine: nieuwe aanvraag
export function mailNieuweAanvraag(b: Boeking, adminLink: string) {
  const opm = b.opmerking ? `\nOpmerking: ${b.opmerking}` : ''
  return {
    subject: `Nieuwe aanvraag: ${b.naam_klant} – ${formatDatumNL(b.datum)} ${formatTijd(b.starttijd)}`,
    text: `Er is een nieuwe afspraak aangevraagd.\n\nKlant: ${b.naam_klant}\nE-mail: ${b.email_klant}\nTelefoon: ${b.telefoon_klant}\nMoment: ${moment(b)}${opm}\n\nKeur goed of weiger in het beheer: ${adminLink}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#292524;max-width:560px"><p>Er is een nieuwe afspraak aangevraagd.</p><ul><li><b>Klant:</b> ${escapeHtml(b.naam_klant)}</li><li><b>E-mail:</b> ${escapeHtml(b.email_klant)}</li><li><b>Telefoon:</b> ${escapeHtml(b.telefoon_klant)}</li><li><b>Moment:</b> ${moment(b)}</li>${b.opmerking ? `<li><b>Opmerking:</b> ${escapeHtml(b.opmerking)}</li>` : ''}</ul>${knop(adminLink, 'Naar het beheer')}</div>`,
  }
}

// 2. Aan klant: aanvraag ontvangen
export function mailAanvraagOntvangen(b: Boeking) {
  return {
    subject: 'We hebben je aanvraag ontvangen – Elorine Massage',
    text: `Beste ${b.naam_klant},\n\nBedankt voor je aanvraag voor ${moment(b)}.\n\nDit is nog geen bevestiging: je ontvangt zo snel mogelijk een e-mail of de afspraak doorgaat.\n\nMet vriendelijke groet,\nElorine`,
    html: omhulsel(`<p>Beste ${escapeHtml(b.naam_klant)},</p><p>Bedankt voor je aanvraag voor <b>${moment(b)}</b>.</p><p>Dit is nog geen bevestiging: je ontvangt zo snel mogelijk een e-mail of de afspraak doorgaat.</p>`),
  }
}

// Aan klant: bevestigd
export function mailBevestigd(b: Boeking) {
  return {
    subject: 'Je massage-afspraak is bevestigd – Elorine Massage',
    text: `Beste ${b.naam_klant},\n\nGoed nieuws: je afspraak is bevestigd.\n\nWanneer: ${moment(b)}\n\nKun je toch niet komen? Laat het ons zo snel mogelijk weten door op deze e-mail te antwoorden.\n\nWe kijken ernaar uit om je te verwelkomen!\n\nMet vriendelijke groet,\nElorine`,
    html: omhulsel(`<p>Beste ${escapeHtml(b.naam_klant)},</p><p>Goed nieuws: je afspraak is bevestigd.</p><p><b>Wanneer:</b> ${moment(b)}</p><p>Kun je toch niet komen? Laat het ons zo snel mogelijk weten door op deze e-mail te antwoorden.</p><p>We kijken ernaar uit om je te verwelkomen!</p>`),
  }
}

// 3. Aan klant: geweigerd
export function mailGeweigerd(b: Boeking, boekLink: string) {
  return {
    subject: 'Je aanvraag kan helaas niet doorgaan – Elorine Massage',
    text: `Beste ${b.naam_klant},\n\nHelaas kan je afspraak op ${moment(b)} niet doorgaan.\n\nKies gerust een ander moment: ${boekLink}\n\nMet vriendelijke groet,\nElorine`,
    html: omhulsel(`<p>Beste ${escapeHtml(b.naam_klant)},</p><p>Helaas kan je afspraak op <b>${moment(b)}</b> niet doorgaan.</p><p>Kies gerust een ander moment:</p>${knop(boekLink, 'Nieuwe afspraak kiezen')}`),
  }
}

// Aan klant: geannuleerd na bevestiging
export function mailGeannuleerd(b: Boeking, boekLink: string) {
  return {
    subject: 'Je afspraak is geannuleerd – Elorine Massage',
    text: `Beste ${b.naam_klant},\n\nJe afspraak op ${moment(b)} is geannuleerd. Onze excuses voor het ongemak.\n\nKies gerust een nieuw moment: ${boekLink}\n\nMet vriendelijke groet,\nElorine`,
    html: omhulsel(`<p>Beste ${escapeHtml(b.naam_klant)},</p><p>Je afspraak op <b>${moment(b)}</b> is geannuleerd. Onze excuses voor het ongemak.</p><p>Kies gerust een nieuw moment:</p>${knop(boekLink, 'Nieuwe afspraak kiezen')}`),
  }
}
