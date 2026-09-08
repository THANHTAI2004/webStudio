"use client";

import Link from "next/link";
import { LocationForm } from "@/components/locations/location-form";

export default function NewLocationPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/locations"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Locations
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          New Location
        </h1>
      </header>

      <div className="mt-8">
        <LocationForm />
      </div>
    </section>
  );
}
