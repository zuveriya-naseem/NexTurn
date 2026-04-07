import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    
    if (!res.success) return setErr(res.error);

    // We can fetch from localstorage because auth context set it, 
    // or assume user state reflects it. The context sets `user`.
    // Instead of parsing here, let ProtectedRoute handle it by just steering to right place.
    // However, we don't have role immediately without waiting for context update if we don't get user from result.
    // AuthContext login doesn't return user, let's just go home and let ProtectedRoute bounce us, or get role from localstorage.
    const userRole = JSON.parse(localStorage.getItem('user'))?.role;
    nav(userRole === "admin" ? "/admin" : "/student");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl p-6 ring-1 ring-black/10 bg-white/80 dark:bg-white/5 dark:ring-white/10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Login to NexTurn</h1>
          <Link to="/" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
            Home
          </Link>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your credentials to continue.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-black/10 bg-white/70 dark:bg-zinc-950/40 dark:ring-white/10"
              placeholder="you@example.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-black/10 bg-white/70 dark:bg-zinc-950/40 dark:ring-white/10"
              placeholder="Your password"
              type="password"
              required
            />
          </div>

          {err && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300 ring-1 ring-red-500/20">
              {err}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(34,197,94,0.95))" }}
          >
            Login
          </button>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Don’t have an account?{" "}
            <Link to="/auth/signup" className="font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}