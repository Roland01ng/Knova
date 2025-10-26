// web/src/app/page.tsx (server component)
import { supabase } from "@/lib/supabase";

export default async function Home() {
  // fetch rows from "facts"
  const { data, error } = await supabase
    .from("facts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>KNOVA</h1>
        <p style={{ color: "crimson" }}>Failed to load facts:</p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>KNOVA</h1>
      <p>Facts loaded from Supabase:</p>

      {(!data || data.length === 0) && <p>No facts yet.</p>}

      <ul style={{ marginTop: 12 }}>
        {data?.map((row) => (
          <li key={row.id} style={{ marginBottom: 8 }}>
            <code>{row.text}</code>{" "}
            <small style={{ opacity: 0.7 }}>
              — {new Date(row.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
