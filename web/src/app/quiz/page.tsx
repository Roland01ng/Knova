// web/src/app/quiz/page.tsx
import { supabase } from '@/lib/supabase';
import QuizClient from './quiz-client';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  // 1) Get questions
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, prompt, created_at')
    .order('created_at', { ascending: true });

  if (qErr) {
    return (
      <main style={{ padding: 24 }}>
        <h1>KNOVA Quiz</h1>
        <p style={{ color: 'crimson' }}>Failed to load questions: {qErr.message}</p>
      </main>
    );
  }

  // 2) Get choices (no is_correct here)
  const { data: choices, error: cErr } = await supabase
    .from('choices')
    .select('id, label, question_id');

  if (cErr) {
    return (
      <main style={{ padding: 24 }}>
        <h1>KNOVA Quiz</h1>
        <p style={{ color: 'crimson' }}>Failed to load choices: {cErr.message}</p>
      </main>
    );
  }

  // 3) Group choices by question_id
  const byQ = new Map<string, { id: string; label: string }[]>();
  for (const c of choices ?? []) {
    const arr = byQ.get(c.question_id) ?? [];
    arr.push({ id: c.id, label: c.label });
    byQ.set(c.question_id, arr);
  }

  // 4) Shape data for client
  const shaped = (questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: byQ.get(q.id) ?? [],
  }));

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 16 }}>KNOVA Quiz</h1>
      <p style={{ marginBottom: 24 }}>Pick one answer for each question.</p>
      <QuizClient questions={shaped} />
    </main>
  );
}
