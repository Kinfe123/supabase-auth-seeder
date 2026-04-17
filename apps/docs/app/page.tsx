import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Docs App</h1>
      <p>This app was scaffolded by @farming-labs/docs Cloud.</p>
      <Link href="/docs">Open docs</Link>
    </main>
  );
}
