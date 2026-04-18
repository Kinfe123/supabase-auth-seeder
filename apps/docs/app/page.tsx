import Link from "next/link";

const title = "Supabase Auth Seeder";
const description = "A CLI for seeding auth users into Supabase.";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/docs">Open docs</Link>
    </main>
  );
}
