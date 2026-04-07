import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading...</div>;

  if (!user) return <Navigate to="/auth/login" replace />;

  if (role && user.role !== role) {
    // if logged in but wrong role, send to their dashboard
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  }

  return children;
}