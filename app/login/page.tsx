"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function handleDemoLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("demo");
    setError("");

    try {
      const result = await signIn("demo", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid demo email or password.");
        setLoading("");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Demo login failed. Please try again.");
      setLoading("");
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setLoading(provider);
    setError("");

    try {
      await signIn(provider, { redirectTo: "/" });
    } catch {
      setError("Sign-in could not be started. Please try again.");
      setLoading("");
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <div className="login-logo">P</div>
          <h1>PayShield <span>AI</span></h1>
          <p>Protect Every Payment. Investigate Every Threat.</p>
        </header>

        <div className="login-security">
          <span className="login-live-dot" />
          SECURE PAYMENT COMMAND CENTER
        </div>

        <div className="login-oauth">
          <button
            type="button"
            className="login-google"
            onClick={() => handleOAuth("google")}
            disabled={Boolean(loading)}
          >
            {loading === "google" ? "Connecting..." : "Continue with Google"}
          </button>

          <button
            type="button"
            className="login-github"
            onClick={() => handleOAuth("github")}
            disabled={Boolean(loading)}
          >
            {loading === "github" ? "Connecting..." : "Continue with GitHub"}
          </button>
        </div>

        <div className="login-divider">
          <span />
          <small>OR USE DEMO ACCESS</small>
          <span />
        </div>

        <form onSubmit={handleDemoLogin} className="login-form">
          <label htmlFor="email">Demo email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@gmail.com"
          />

          <label htmlFor="password">Demo password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter demo password"
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="login-submit"
            disabled={Boolean(loading)}
          >
            {loading === "demo" ? "Signing in..." : "Enter Demo"}
          </button>
        </form>

        <footer className="login-footer">
          <span>PAYSHIELD AI</span>
          <span>HACKATHON DEMONSTRATION · PAYPAL SANDBOX</span>
        </footer>
      </section>
    </main>
  );
}
