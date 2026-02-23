import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-6">Resident Event Ideas</h1>
        <p className="text-xl mb-8">Share and discover community event ideas</p>
        <Link
          href="/events"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          View Events
        </Link>
      </main>
    </div>
  );
}
