// web/src/app/results/page.tsx
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  // latest 10 attempts
  const { data: attempts, error: aErr } = await supabase
    .from('attempts')
    .select('id, created_at, score, total')
    .order('created_at', { ascending: false })
    .limit(10);

  if (aErr) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Recent Results</h1>
        <p style={{ color: 'crimson' }}>Failed to load attempts: {aErr.message}</p>
      </main>
    );
  }

  // fetch responses for those attempts
  const ids = (attempts ?? []).map(a => a.id);
  let responsesByAttempt = new Map<string, { question: string; choice: string; correct: boolean }[]>();

  if (ids.length) {
    // join responses -> questions/choices (no is_correct leak from client; we’re on server)
    const { data: rows, error: rErr } = await supabase
      .from('responses')
      .select(`
        attempt_id,
        is_correct,
        questions:question_id ( prompt ),
        choices:choice_id ( label )
      `)
      .in('attempt_id', ids);

    if (!rErr && rows) {
      for (const row of rows as any[]) {
        const arr = responsesByAttempt.get(row.attempt_id) ?? [];
        arr.push({
          question: row.questions?.prompt ?? '',
          choice: row.choices?.label ?? '',
          correct: !!row.is_correct
        });
        responsesByAttempt.set(row.attempt_id, arr);
      }
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 16 }}>Recent Results</h1>
      {!attempts?.length ? (
        <p>No attempts yet. Play the <a href="/quiz">quiz</a> first.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {attempts.map(a => (
            <div key={a.id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600 }}>
                {new Date(a.created_at).toLocaleString()} — Score {a.score}/{a.total}
              </div>
              <ul style={{ marginTop: 8 }}>
                {(responsesByAttempt.get(a.id) ?? []).map((r, i) => (
                  <li key={i}>
                    Q{i + 1}: {r.question} → <em>{r.choice}</em>{' '}
                    {r.correct ? '✅' : '❌'}
                  </li>
                ))}
              </ul>
              <div style={{ opacity: 0.6, marginTop: 6 }}>
                Attempt ID: {a.id.slice(0, 8)}…
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 20 }}>
        ← <a href="/quiz">Back to Quiz</a>
      </p>
    </main>
  );
}
