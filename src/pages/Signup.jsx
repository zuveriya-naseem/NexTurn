import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Signup() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await register(name || "User", email, password, role);
    setLoading(false);

    if (!res.success) return setErr(res.error);

    // After success, they are logged in since our context sets the user
    nav(role === "admin" ? "/admin" : "/student");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl p-6 ring-1 ring-black/10 bg-white/80 dark:bg-white/5 dark:ring-white/10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Create your NexTurn account</h1>
          <Link to="/" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
            Home
          </Link>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Choose your role and create an account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Role</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={[
                  "rounded-xl px-3 py-2 text-sm ring-1 transition",
                  role === "student"
                    ? "bg-zinc-900 text-white ring-black/10 dark:bg-white dark:text-zinc-900 dark:ring-white/10"
                    : "bg-white/60 text-zinc-800 ring-black/10 hover:bg-white dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10",
                ].join(" ")}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={[
                  "rounded-xl px-3 py-2 text-sm ring-1 transition",
                  role === "admin"
                    ? "bg-zinc-900 text-white ring-black/10 dark:bg-white dark:text-zinc-900 dark:ring-white/10"
                    : "bg-white/60 text-zinc-800 ring-black/10 hover:bg-white dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10",
                ].join(" ")}
              >
                Admin / Mentor
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-black/10 bg-white/70 dark:bg-zinc-950/40 dark:ring-white/10"
              placeholder="Your name"
            />
          </div>

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
              placeholder="Enter a string password"
              type="password"
              required
            />
            <p className="mt-2 text-xs text-zinc-500">
              Demo only (stored in localStorage).
            </p>
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
            Create account
          </button>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}