import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import CandidatePage from "./app/candidate/page";
import HomePage from "./app/page";
import LoginPage from "./app/login/page";
import "./app/globals.css";

function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-navy">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-purple underline">
          Return home
        </Link>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/candidate" element={<CandidatePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);