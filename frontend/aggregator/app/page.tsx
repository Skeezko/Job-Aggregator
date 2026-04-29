const features = [
  {
    icon: "🔍",
    title: "Recherche & filtres",
    description: "Filtre par poste, localisation, type de contrat et salaire. Résultats en temps réel depuis WeLoveDevs.",
  },
  {
    icon: "🤖",
    title: "IA intégrée",
    description: "Catégorisation automatique des offres, extraction de mots-clés et détection des doublons.",
  },
  {
    icon: "📊",
    title: "Dashboard analytique",
    description: "Visualise les tendances du marché, la distribution des salaires et les entreprises qui recrutent.",
  },
  {
    icon: "🔖",
    title: "Favoris personnels",
    description: "Sauvegarde les offres qui t'intéressent et ajoute des notes pour chaque candidature.",
  },
  {
    icon: "🛡️",
    title: "Sécurisé",
    description: "Authentification JWT, protection brute-force, chiffrement des données sensibles.",
  },
  {
    icon: "⚡",
    title: "Données fraîches",
    description: "Ingestion automatique depuis WeLoveDevs avec normalisation et déduplication avant stockage.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full font-sans">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white">
            Job<span className="text-blue-500">Aggregator</span>
          </span>
          <nav className="flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Connexion
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              S'inscrire
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-block mb-4 px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
              Données réelles · Powered by WeLoveDevs
            </span>
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight mb-6">
              Toutes les offres tech.<br />
              <span className="text-blue-500">Au même endroit.</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
              Agrège, filtre et analyse les offres d'emploi et de stage tech en France.
              IA intégrée pour t'aider à trouver les meilleures opportunités.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/register"
                className="px-6 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Commencer gratuitement
              </a>
              <a
                href="/offers"
                className="px-6 py-3 text-sm font-medium border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-lg transition-colors"
              >
                Voir les offres
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                >
                  <span className="text-2xl mb-3 block">{feature.icon}</span>
                  <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-600">
        JobAggregator · Epitech 2025 · Données fournies par{" "}
        <span className="text-zinc-500">WeLoveDevs</span>
      </footer>
    </div>
  );
}
