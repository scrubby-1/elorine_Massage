import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-2 2-3 4-3 7c0 5 3 9 3 9s3-4 3-9c0-3-1-5-3-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7c-1.5 1.5-2.5 3.5-2.5 6c0 4 2.5 7 2.5 7s2.5-3 2.5-7c0-2.5-1-4.5-2.5-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7c1.5 1.5 2.5 3.5 2.5 6c0 4-2.5 7-2.5 7s-2.5-3-2.5-7c0-2.5 1-4.5 2.5-6z" />
                </svg>
              </div>
              <span className="text-2xl font-serif text-stone-700">Elorine</span>
            </div>
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
              Laat je lichaam en geest tot rust komen
            </h1>
            <p className="mt-6 text-lg text-stone-600 md:text-xl">
              Ervaar diepe ontspanning met onze professionele massagebehandelingen. 
              In een warme, rustige omgeving help ik je om balans te vinden.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/boeken">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8">
                  Maak een afspraak
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-lg px-8">
                Meer informatie
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Massage Services Section */}
      <section id="diensten" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-stone-800 md:text-4xl">Massage Diensten</h2>
            <p className="mt-4 text-stone-600 max-w-2xl mx-auto">
              Kies uit onze selectie van massagebehandelingen, elk ontworpen om je te helpen ontspannen en herstellen.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Ontspanningsmassage */}
            <Card className="border-stone-200 bg-stone-50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <CardTitle className="font-serif text-2xl text-stone-800">Ontspanningsmassage</CardTitle>
                <CardDescription className="text-stone-600">
                  Volledige lichaamsmassage gericht op diepe ontspanning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 mb-4">
                  Een rustgevende massage die spanning in spieren verzacht en stress wegneemt. 
                  Perfect voor wie op zoek is naar innerlijke rust en welzijn.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-emerald-700">€65</span>
                  <span className="text-stone-500">/ 60 minuten</span>
                </div>
              </CardContent>
            </Card>

            {/* Sportmassage */}
            <Card className="border-stone-200 bg-stone-50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="font-serif text-2xl text-stone-800">Sportmassage</CardTitle>
                <CardDescription className="text-stone-600">
                  Intensieve massage voor sporters en actieve mensen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 mb-4">
                  Gericht op het behandelen van sportblessures, het verbeteren van flexibiliteit 
                  en het versnellen van herstel na intensieve trainingen.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-emerald-700">€75</span>
                  <span className="text-stone-500">/ 60 minuten</span>
                </div>
              </CardContent>
            </Card>

            {/* Hot Stone Massage */}
            <Card className="border-stone-200 bg-stone-50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-stone-200 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <CardTitle className="font-serif text-2xl text-stone-800">Hot Stone Massage</CardTitle>
                <CardDescription className="text-stone-600">
                  Verwarmde stenen voor diepe spierontspanning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 mb-4">
                  Verwarmde basaltstenen worden gebruikt om diep in de spieren door te dringen 
                  en een uitzonderlijke ontspanning te bereiken.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-emerald-700">€85</span>
                  <span className="text-stone-500">/ 75 minuten</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="over" className="bg-gradient-to-b from-stone-100 to-emerald-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-serif text-3xl text-stone-800 md:text-4xl">Over mij</h2>
              <p className="mt-6 text-lg text-stone-600 leading-relaxed">
                Al meer dan 10 jaar help ik mensen om te ontspannen en hun lichaam te verzorgen. 
                Met een combinatie van traditionele en moderne massagetechnieken creëer ik een 
                behandeling die precies aansluit bij jouw behoeften.
              </p>
              <p className="mt-4 text-lg text-stone-600 leading-relaxed">
                Mijn praktijk is een rustige ruimte waar je even kunt ontsnappen aan de drukte 
                van het dagelijks leven. Ik geloof dat iedereen verdient om zich goed te voelen.
              </p>
              <div className="mt-8 flex gap-6">
                <div>
                  <div className="text-3xl font-semibold text-emerald-700">500+</div>
                  <div className="text-stone-500">Tevreden klanten</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-emerald-700">10+</div>
                  <div className="text-stone-500">Jaar ervaring</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-200 to-stone-200 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-6xl text-emerald-600">🌿</span>
                </div>
              </div>
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
            Boek nu je massage en geef je lichaam de rust die het verdient. 
            Ik kijk ernaar uit om je te verwelkomen.
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
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-2 2-3 4-3 7c0 5 3 9 3 9s3-4 3-9c0-3-1-5-3-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7c-1.5 1.5-2.5 3.5-2.5 6c0 4 2.5 7 2.5 7s2.5-3 2.5-7c0-2.5-1-4.5-2.5-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7c1.5 1.5 2.5 3.5 2.5 6c0 4-2.5 7-2.5 7s-2.5-3-2.5-7c0-2.5 1-4.5 2.5-6z" />
                  </svg>
                </div>
                <span className="text-2xl font-serif text-white">Elorine</span>
              </div>
              <p className="text-stone-400">
                Professionele massagebehandelingen in een rustige, warme omgeving.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-stone-400">
                <p>info@elorine.nl</p>
                <p>06-12345678</p>
                <p>Kerkstraat 123<br />1234 AB Amsterdam</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Openingstijden</h4>
              <div className="space-y-2 text-stone-400">
                <p>Ma - Vr: 09:00 - 18:00</p>
                <p>Za: 10:00 - 17:00</p>
                <p>Zo: Gesloten</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-700 text-center text-stone-500">
            © 2024 Elorine. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}
