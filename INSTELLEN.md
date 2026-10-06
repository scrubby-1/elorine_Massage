# Elorine Massage online zetten

Volg deze stappen één keer. Daarna werkt de site met boekingen, het beheer, mails en de agenda.

## 1. Database (Supabase)

1. Maak een gratis account op [supabase.com](https://supabase.com) en klik op **New project**.
   Kies als regio **West EU (Ireland)** of **Central EU (Frankfurt)**.
2. Open **SQL Editor → New query**, plak de inhoud van `supabase/schema.sql` en klik op **Run**.
3. Ga naar **Project Settings → API** en noteer:
   - **Project URL** → wordt `SUPABASE_URL`
   - **service_role**-sleutel (onder "Project API keys", klik op "Reveal") → wordt `SUPABASE_SERVICE_ROLE_KEY`

   Deel de service_role-sleutel met niemand: wie hem heeft, kan alle boekingen lezen en wissen.

## 2. Variabelen in Vercel

Open het project in Vercel → **Settings → Environment Variables** en voeg toe
(vink telkens Production, Preview en Development aan):

| Naam | Waarde | Verplicht |
|---|---|---|
| `SUPABASE_URL` | Project URL uit stap 1 | ja |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role-sleutel uit stap 1 | ja |
| `ADMIN_PASSWORD` | het wachtwoord voor /admin | ja |
| `ADMIN_SESSION_SECRET` | een lange willekeurige tekst (bv. 40 tekens door elkaar) | ja |
| `GMAIL_USER` | Gmail-adres waarvan de bevestigingsmails vertrekken | nee* |
| `GMAIL_APP_PASSWORD` | app-wachtwoord van dat Gmail-account (zie stap 3) | nee* |
| `GOOGLE_CLIENT_EMAIL` | e-mailadres van het serviceaccount (zie stap 4) | nee** |
| `GOOGLE_PRIVATE_KEY` | private key van het serviceaccount | nee** |
| `GOOGLE_CALENDAR_ID` | agenda-ID, standaard het Gmail-adres | nee |

\* Zonder deze twee worden er geen bevestigingsmails verstuurd; de rest werkt wel.
\*\* Zonder deze twee komen goedgekeurde afspraken niet automatisch in Google Agenda.

Klik daarna op **Deployments → … → Redeploy**, anders worden de nieuwe waarden niet gebruikt.

## 3. Gmail app-wachtwoord (optioneel)

1. Zet tweestapsverificatie aan op het Google-account.
2. Ga naar [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords),
   maak een app-wachtwoord aan ("Elorine website") en kopieer de 16 tekens naar `GMAIL_APP_PASSWORD`.

## 4. Google Agenda (optioneel)

1. Ga naar [console.cloud.google.com](https://console.cloud.google.com), maak een project en zet de
   **Google Calendar API** aan.
2. Maak onder **IAM → Service accounts** een serviceaccount, open het, kies **Keys → Add key → JSON**.
3. Uit het gedownloade JSON-bestand: `client_email` → `GOOGLE_CLIENT_EMAIL`,
   `private_key` → `GOOGLE_PRIVATE_KEY` (volledig, inclusief `-----BEGIN PRIVATE KEY-----`).
4. Open Google Agenda → instellingen van de agenda → **Delen met specifieke personen** → voeg het
   `client_email`-adres toe met recht **Wijzigingen aanbrengen in afspraken**.

## 5. Testen

1. Ga naar `/admin`, log in en maak een tijdslot aan voor morgen.
2. Ga naar `/boeken`, kies die dag en vraag de afspraak aan.
3. Keur de aanvraag goed in `/admin` en kijk of de mail en de agenda-afspraak aankomen.
