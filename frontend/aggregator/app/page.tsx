import Link from "next/link";

const stats = [
  { value: "25+", label: "Offres indexées" },
  { value: "6", label: "Catégories IA" },
  { value: "100%", label: "Gratuit" },
  { value: "FR", label: "Marché français" },
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    title: "Recherche avancée",
    description: "Filtre par poste, localisation, type de contrat et salaire. Résultats instantanés depuis WeLoveDevs.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: "Catégorisation IA",
    description: "Chaque offre est analysée automatiquement : catégorie, mots-clés techniques, détection des doublons.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Dashboard analytique",
    description: "Tendances du marché, distribution des salaires, entreprises qui recrutent le plus — tout en un coup d'œil.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
      </svg>
    ),
    title: "Favoris & notes",
    description: "Sauvegarde les offres qui t'intéressent, ajoute des notes pour chaque candidature, retrouve-les facilement.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Authentification sécurisée",
    description: "JWT, protection brute-force, données chiffrées. Ton compte est protégé à chaque étape.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: "Données en temps réel",
    description: "Ingestion automatique depuis WeLoveDevs avec normalisation et déduplication avant stockage.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crée ton compte",
    description: "Inscription gratuite en 30 secondes. Aucune carte bancaire requise.",
  },
  {
    number: "02",
    title: "Explore les offres",
    description: "Filtre par stack, contrat, localisation ou salaire. L'IA classe les offres pour toi.",
  },
  {
    number: "03",
    title: "Postule sereinement",
    description: "Sauvegarde tes favoris, prends des notes, suis tes candidatures depuis le dashboard.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 pt-20 pb-28 text-center"
        aria-labelledby="hero-title"
      >
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            style={{
              width: 600,
              height: 600,
              background:
                "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"
              style={{ animation: "pulse 2s infinite" }}
              aria-hidden="true"
            />
            Données réelles · Powered by WeLoveDevs
          </span>

          <h1
            id="hero-title"
            className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
          >
            Trouve ton prochain
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #3b82f6, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              poste tech en France
            </span>
          </h1>

          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            {"Agrège, filtre et analyse les offres d'emploi et de stage tech. IA intégrée pour catégoriser chaque offre et t'aider à trouver les meilleures opportunités."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/offers"
              className="px-6 py-3 text-sm font-medium border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-lg transition-colors"
            >
              Voir les offres →
            </Link>
          </div>

          {/* Stats */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden border border-zinc-800 bg-zinc-800">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-zinc-900 px-4 py-5 text-center">
                <dt className="text-xs text-zinc-500 mb-1">{stat.label}</dt>
                <dd className="text-2xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-zinc-800/60" aria-labelledby="steps-title">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 id="steps-title" className="text-2xl font-bold text-white mb-3">
              Comment ça marche
            </h2>
            <p className="text-sm text-zinc-400">
              {"Prêt à postuler en moins de 3 minutes"}
            </p>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8" role="list">
            {steps.map((step, i) => (
              <li key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block absolute top-6 left-1/2 w-full h-px bg-zinc-800"
                    style={{ left: "calc(50% + 2rem)" }}
                  />
                )}
                <div
                  className="w-12 h-12 rounded-full border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm mb-4 shrink-0"
                  aria-hidden="true"
                >
                  {step.number}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-zinc-800/60" aria-labelledby="features-title">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 id="features-title" className="text-2xl font-bold text-white mb-3">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-sm text-zinc-400">
              Des outils pensés pour les développeurs, par des développeurs.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/15 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-6 py-20 border-t border-zinc-800/60" aria-labelledby="cta-title">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="rounded-2xl border border-zinc-800 p-12"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(129,140,248,0.05) 100%)",
            }}
          >
            <h2 id="cta-title" className="text-2xl font-bold text-white mb-3">
              Prêt à trouver ton prochain poste ?
            </h2>
            <p className="text-sm text-zinc-400 mb-8">
              Rejoins des centaines de développeurs qui utilisent JobAggregator pour suivre le marché tech français.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Créer un compte gratuit
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {"J'ai déjà un compte →"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
