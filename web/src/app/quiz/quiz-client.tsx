'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Choice = { id: string; label: string };
type Question = { id: string; prompt: string; choices: Choice[] };

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizClient({ questions }: { questions: Question[] }) {
  // 🔒 All hooks first (never inside/after a conditional)
  const [viewQs, setViewQs] = useState<Question[]>(questions);
  const [mounted, setMounted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] =
    useState<{ attempt_id: string; score: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydration-safe shuffle after mount
  useEffect(() => {
    setMounted(true);
    setViewQs(qs => qs.map(q => ({ ...q, choices: shuffle(q.choices) })));
  }, []);

  const allAnswered = useMemo(
    () => viewQs.every(q => answers[q.id]),
    [viewQs, answers]
  );

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers).map(([question_id, choice_id]) => ({
        question_id,
        choice_id,
      }));

      const { data, error } = await supabase.rpc('grade_and_record', { _answers: payload });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      setResult({ attempt_id: row.attempt_id, score: row.score, total: row.total });
    } catch (e: any) {
      setError(e.message ?? 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Only the render is conditional, not the hooks
  if (!mounted) return null;

  return (
    <div>
      {viewQs.map((q, idx) => {
        const chosen = answers[q.id];
        return (
          <div key={q.id} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {idx + 1}. {q.prompt}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {q.choices.map((c) => {
                const isChosen = chosen === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => !result && setAnswers(a => ({ ...a, [q.id]: c.id }))}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      background: isChosen ? '#f5f5f5' : 'white',
                      cursor: result ? 'default' : 'pointer'
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #333',
            background: allAnswered && !submitting ? '#111' : '#888',
            color: 'white'
          }}
        >
          {submitting ? 'Submitting…' : 'Submit answers'}
        </button>
      ) : (
        <div style={{ marginTop: 16, fontWeight: 600 }}>
          Score: {result.score} / {result.total} (Attempt ID: {result.attempt_id.slice(0,8)}…)
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: 'crimson' }}>
          {error}
        </div>
      )}
    </div>
  );
}
