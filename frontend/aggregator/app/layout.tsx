import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobAggregator — Trouve ton prochain poste tech",
  description:
    "Agrégateur d'offres d'emploi et de stages tech. Données réelles, filtres avancés, recommandations IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
