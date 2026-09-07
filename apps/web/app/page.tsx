import { getHealth } from "@/lib/api/client";

function formatStatus(value: boolean): string {
  return value ? "Connected" : "Disconnected";
}

function formatDatabase(database?: string): string {
  return database === "connected" ? "Connected" : "Disconnected";
}

export default async function Home() {
  const health = await getHealth();
  const apiConnected = health?.success === true;

  return (
    <main className="flex min-h-screen flex-col justify-center bg-white px-6 py-16 text-zinc-950">
      <section className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-normal text-zinc-500">
          Studio Foundation
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">
          Studio Website
        </h1>
        <dl className="mt-8 grid gap-4 text-lg sm:grid-cols-2">
          <div className="border border-zinc-200 p-5">
            <dt className="text-sm font-medium text-zinc-500">API Status</dt>
            <dd className="mt-2 font-semibold">{formatStatus(apiConnected)}</dd>
          </div>
          <div className="border border-zinc-200 p-5">
            <dt className="text-sm font-medium text-zinc-500">Database</dt>
            <dd className="mt-2 font-semibold">
              {formatDatabase(health?.database)}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
