"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function validatePassword(p: string): string | null {
  if (p.length < 12) return "Au moins 12 caractères";
  if (!/[A-Z]/.test(p)) return "Au moins une majuscule";
  if (!/[0-9]/.test(p)) return "Au moins un chiffre";
  if (!/[^A-Za-z0-9]/.test(p)) return "Au moins un caractère spécial";
  return null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstname.trim()) e.firstname = "Le prénom est requis";
    if (!lastname.trim()) e.lastname = "Le nom est requis";
    if (!email.includes("@")) e.email = "Email invalide";
    const pwErr = validatePassword(password);
    if (pwErr) e.password = pwErr;
    if (password !== confirm)
      e.confirm = "Les mots de passe ne correspondent pas";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email, password, firstname, lastname);
      router.push("/offers");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Rejoins JobAggregator gratuitement
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-900"
          aria-label="Formulaire d'inscription"
          noValidate
        >
          {apiError && (
            <div
              role="alert"
              className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              type="text"
              autoComplete="given-name"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              error={errors.firstname}
              required
              placeholder="Jean"
            />
            <Input
              label="Nom"
              type="text"
              autoComplete="family-name"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              error={errors.lastname}
              required
              placeholder="Dupont"
            />
          </div>

          <Input
            label="Adresse email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            placeholder="toi@example.com"
          />

          <Input
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            placeholder="Min. 12 car., 1 maj., 1 chiffre, 1 spécial"
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            required
            placeholder="••••••••"
          />

          <Button type="submit" loading={loading} className="w-full mt-1">
            Créer mon compte
          </Button>

          <p className="text-center text-xs text-zinc-600">
            {"En créant un compte, tu acceptes nos conditions d'utilisation."}
          </p>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
