import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockUsers } from "@/data/mockUsers";
import { Role } from "@/types/user";

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("CANDIDATE");

  function handleLogin() {
    const user = mockUsers.find((u) => u.role === role);
    if (!user) return;
    localStorage.setItem("currentUser", JSON.stringify(user));
    navigate(role === "CANDIDATE" ? "/candidate" : "/facilitator");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-navy mb-1">CAPACITI</h1>
        <p className="text-sm text-gray-500 mb-6">Online Register &amp; WFH Management</p>

        <label className="block text-sm font-medium text-navy mb-2">Sign in as</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full border border-gray-300 rounded-md p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-purple"
        >
          <option value="CANDIDATE">Candidate</option>
          <option value="TECH_CHAMP">Tech Champion</option>
        </select>

        <button
          onClick={handleLogin}
          className="w-full bg-purple text-white rounded-md py-2 font-medium hover:opacity-90 transition"
        >
          Continue
        </button>
      </div>
    </main>
  );
}