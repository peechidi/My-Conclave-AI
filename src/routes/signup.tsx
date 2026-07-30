import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { GoogleIcon } from "@/components/google-icon";
import { RedirectIfAuthenticated } from "@/components/auth-guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up · Conclave AI" },
      { name: "description", content: "Create your Conclave AI account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <RedirectIfAuthenticated>
      <SignupForm />
    </RedirectIfAuthenticated>
  );
}

function SignupForm() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp(email, password);
      if (result.needsEmailConfirmation) {
        setConfirmationPending(true);
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-8 shadow-elegant">
          {confirmationPending ? (
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-soft text-emerald">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h1 className="font-display mt-4 text-2xl">Check your inbox</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="text-foreground">{email}</span>.
                Confirm your email to finish creating your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Convene your council in minutes.</p>

              {error && (
                <Alert variant="destructive" className="mt-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-6 h-10 w-full gap-2 rounded-xl"
                onClick={handleGoogle}
                disabled={isGoogleLoading || isSubmitting}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or continue with email
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Email</span>
                  <Input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Password</span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    placeholder="At least 6 characters"
                  />
                </label>
                <Button
                  type="submit"
                  className="h-10 w-full gap-1.5 rounded-xl"
                  disabled={isSubmitting || isGoogleLoading}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
