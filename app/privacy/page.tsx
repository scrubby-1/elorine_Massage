import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacyverklaring – Elorine Massage',
  description: 'Hoe Elorine Massage omgaat met je persoonsgegevens.',
}

export default function PrivacyPagina() {
  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/" className="block w-fit mx-auto mb-8">
          <Image src="/logo.png" alt="Elorine Massage" width={120} height={120} />
        </Link>
        <article className="rounded-xl border border-stone-200 bg-white p-6 md:p-10 text-stone-700 leading-relaxed space-y-6">
          <h1 className="font-serif text-3xl text-stone-800">Privacyverklaring</h1>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-800">Wie verwerkt je gegevens?</h2>
            <p>
              Elorine Massage is verantwoordelijk voor de verwerking van de persoonsgegevens die je via deze website
              doorgeeft. Contactgegevens vind je onderaan elke pagina van deze website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-800">Welke gegevens en waarom?</h2>
            <p>Wanneer je een afspraak aanvraagt, bewaren we:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>je naam, e-mailadres en telefoonnummer, om de afspraak te bevestigen en je te contacteren;</li>
              <li>de dag en het uur van je afspraak;</li>
              <li>
                je opmerking, als je die invult. Vermeld je daarin iets over je gezondheid (bijvoorbeeld een blessure),
                dan gebruiken we dat alleen om de massage veilig en op maat te geven;
              </li>
              <li>
                een versleutelde, niet-terug te rekenen code van je internetaansluiting, alleen om misbruik en
                spam tegen te gaan.
              </li>
            </ul>
            <p>
              We gebruiken je gegevens uitsluitend om je afspraak te regelen. We verkopen of delen ze niet voor
              reclame.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-800">Wie heeft toegang?</h2>
            <p>
              Alleen Elorine. Voor de werking van de website gebruiken we enkele dienstverleners die je gegevens
              voor ons opslaan of versturen: Vercel (website), Supabase (database) en Google (e-mail en agenda).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-800">Hoe lang bewaren we je gegevens?</h2>
            <p>
              Niet langer dan nodig voor de afspraak en een eventuele opvolging, tenzij de wet ons verplicht ze
              langer te bewaren.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-800">Je rechten</h2>
            <p>
              Je mag je gegevens altijd inkijken, laten verbeteren of laten verwijderen, en je toestemming intrekken.
              Neem daarvoor contact op via de contactgegevens op deze website. Ben je niet tevreden over hoe we met
              je gegevens omgaan, dan kun je een klacht indienen bij de Gegevensbeschermingsautoriteit
              (www.gegevensbeschermingsautoriteit.be).
            </p>
          </section>

          <div className="pt-2">
            <Link href="/boeken" className="text-emerald-700 underline">
              Terug naar afspraak maken
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
