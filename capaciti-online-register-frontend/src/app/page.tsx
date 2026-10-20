import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="min-h-screen grid md:grid-cols-[1.2fr_0.8fr]">
      <div className="relative hidden min-h-[420px] items-center justify-center overflow-hidden bg-pink p-12 md:flex">
        <div className="absolute -left-20 -top-20 h-64 w-64 rotate-45 border-[30px] border-salmon/20" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rotate-12 bg-primary-600/20" />
        <img
          src="/images/capaciti-logo1.png"
          alt="CAPACITI logo"
          className="relative w-full max-w-md drop-shadow-2xl"
        />
      </div>

      <div className="flex flex-col items-center justify-center bg-navy text-white px-6 py-16">
        <div className="w-full max-w-md text-left">
          <p className="text-pink text-sm font-bold uppercase tracking-[0.25em]">
            A Division of UVU Africa
          </p>

          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight">
            Online Register &amp; WFH Management System
          </h2>
          <p className="text-gray-300 text-sm mb-10">
            Track attendance, manage breaks, and submit or review
            work-from-home requests — all in one place.
          </p>

          <Link
            to="/login"
            className="inline-block bg-purple text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}