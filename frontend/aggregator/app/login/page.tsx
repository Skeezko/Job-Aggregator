"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Email ou mot de passe incorrect."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-900"
      aria-label="Formulaire de connexion"
      noValidate
    >
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <Input
        label="Adresse email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="toi@example.com"
      />

      <Input
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="••••••••"
      />

      <Button type="submit" loading={loading} className="w-full mt-1">
        Se connecter
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Accède à ton espace JobAggregator
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300">
            {"S'inscrire"}
          </Link>
        </p>
      </div>
    </div>
  );
}
