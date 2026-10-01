import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen grid md:grid-cols-[1.2fr_0.8fr]">
      {/* Left: Image */}
      <div className="relative hidden md:block min-h-[420px] h-full overflow-hidden">
        <Image
          src="/images/capaciti-logo1.png"
          alt="CAPACITI candidates working"
          fill
          priority
          sizes="(max-width: 768px) 0px, 60vw"
          className="object-cover object-center scale-[1.05]"
        />
        <div className="absolute inset-0 bg-navy/40" />
      </div>

      {/* Right: Content */}
      <div className="flex flex-col items-center justify-center bg-navy text-white px-6 py-16">
        <div className="w-full max-w-md text-left">
          <h1 className="text-3xl font-bold mb-2">CAPACITI</h1>
          <p className="text-pink text-sm font-medium mb-8 uppercase tracking-wide">
            A Division of UVU Africa
          </p>

          <h2 className="text-xl font-semibold mb-3">
            Online Register &amp; WFH Management System
          </h2>
          <p className="text-gray-300 text-sm mb-10">
            Track attendance, manage breaks, and submit or review
            work-from-home requests — all in one place.
          </p>

          <Link
            href="/login"
            className="inline-block bg-purple text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}