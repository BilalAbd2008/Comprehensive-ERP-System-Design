import { useState } from "react";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const success = await login(username, password);
    if (success) {
      navigate("/");
    } else {
      setError("Username atau password salah");
    }

    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#1B4332" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2" style={{ color: "#1B4332" }}>
            Hers Farm
          </h1>
          <p className="text-sm" style={{ color: "#495057" }}>
            Sistem ERP Peternakan Kambing & Domba
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: "#495057" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              style={{ borderColor: "#DEE2E6" }}
              placeholder="admin_hers"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm" style={{ color: "#495057" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              style={{ borderColor: "#DEE2E6" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="text-sm p-2 rounded"
              style={{ backgroundColor: "#FEE", color: "#DC3545" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: isSubmitting ? "#6C757D" : "#1B4332" }}
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>

          <p className="text-xs text-center" style={{ color: "#6C757D" }}>
            Username: admin_hers | Password: admin123
          </p>
        </form>
      </div>
    </div>
  );
}
