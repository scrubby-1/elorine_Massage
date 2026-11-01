import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Elorine Massage" width={72} height={72} priority />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#diensten" className="text-stone-600 hover:text-emerald-700 transition-colors">Diensten</a>
              <a href="#over" className="text-stone-600 hover:text-emerald-700 transition-colors">Over mij</a>
              <a href="#contact" className="text-stone-600 hover:text-emerald-700 transition-colors">Contact</a>
            </div>
            <Link href="/boeken">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Maak een afspraak
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-stone-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(110,231,183,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-tight text-stone-800 md:text-5xl lg:text-6xl">
              Minder moeten. Meer genieten.
            </h1>
            <p className="mt-6 text-lg text-stone-600 md:text-xl">
              In de drukte van elke dag is het soms heerlijk om even op pauze te drukken. Om los te laten wat
              moet, je hoofd tot rust te brengen en gewoon te genieten van een moment voor jezelf.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/boeken">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8">
                  Maak een afspraak
                </Button>
              </Link>
              <a href="#diensten">
                <Button variant="outline" size="lg" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-lg px-8">
                  Meer informatie
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Massage */}
      <section id="diensten" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-stone-800 md:text-4xl">Ontspanningsmassage</h2>
          </div>

          <Card className="border-stone-200 bg-stone-50">
            <CardContent className="grid gap-8 p-8 md:grid-cols-3 md:p-10">
              <div className="md:col-span-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <CardTitle className="font-serif text-2xl text-stone-800">Ontspanningsmassage</CardTitle>
                <CardDescription className="mt-2 text-lg text-stone-600">
                  Een heerlijk moment helemaal voor jezelf.
                </CardDescription>
                <p className="mt-4 text-lg text-stone-600 leading-relaxed">
                  Laat de dagelijkse drukte even achter je en geniet van een rustgevende lichaamsmassage. Met
                  zachte, vloeiende bewegingen help ik je om spanning los te laten, je hoofd tot rust te brengen
                  en helemaal te ontspannen. Even niets moeten, alleen maar genieten.
                </p>
              </div>
              <div className="flex flex-col items-start justify-center gap-4 rounded-xl bg-white p-6 md:items-center md:text-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-emerald-700">€65</span>
                  <span className="text-lg text-stone-500">/ uur</span>
                </div>
                <Link href="/boeken" className="w-full">
                  <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    Maak een afspraak
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="over" className="bg-gradient-to-b from-stone-100 to-emerald-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-serif text-3xl text-stone-800 md:text-4xl">Over mij</h2>
              <p className="mt-6 font-serif text-xl text-stone-800 md:text-2xl">
                Kleine momenten van rust kunnen een groot verschil maken.
              </p>
              <p className="mt-6 text-lg text-stone-600 leading-relaxed">
                In het dagelijkse leven zijn we vaak druk bezig en proberen we heel wat ballen tegelijk in de
                lucht te houden. Net daarom is het belangrijk om af en toe even op de pauzeknop te drukken. Om
                stil te staan, los te laten en gewoon te genieten.
              </p>
              <p className="mt-4 text-lg text-stone-600 leading-relaxed">
                In mijn rustige thuisomgeving in Balen heb ik een plek gecreëerd waar je even mag ontsnappen aan
                de dagelijkse drukte. Hier krijg je de ruimte om te vertragen, los te laten en gewoon te genieten
                van een moment voor jezelf.
              </p>
              <p className="mt-4 text-lg text-stone-700 leading-relaxed italic">
                Want soms is even niets moeten precies wat je nodig hebt.
              </p>
            </div>
            <div className="relative">
              <Image
                src="/massage.jpg"
                alt="Ontspannende rugmassage"
                width={1600}
                height={1066}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-[4/5] w-full rounded-2xl object-cover object-[65%_center] shadow-lg md:aspect-square"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-700 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-3xl text-white md:text-4xl">
            Klaar om te ontspannen?
          </h2>
          <p className="mt-4 text-lg text-emerald-100 max-w-2xl mx-auto">
            Boek nu je massage en geef jezelf de rust die je verdient.
          </p>
          <Link href="/boeken">
            <Button size="lg" className="mt-10 bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-10">
              Maak een afspraak
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-stone-800 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-stone-50 p-2">
                <Image src="/logo.png" alt="Elorine Massage" width={96} height={96} />
              </div>
              <p className="text-stone-400">
                Professionele massagebehandelingen in een rustige, warme omgeving.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-stone-400">
                <p>
                  <a href="mailto:tineke@elorine.net" className="hover:text-white transition-colors">
                    tineke@elorine.net
                  </a>
                </p>
                <p>Vogelsberg 4<br />2490 Balen</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Openingstijden</h4>
              <div className="space-y-2 text-stone-400">
                <p>Op afspraak</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-700 text-center text-stone-500">
            © {new Date().getFullYear()} Elorine. Alle rechten voorbehouden. ·{' '}
            <Link href="/privacy" className="hover:text-stone-300 underline">
              Privacyverklaring
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
