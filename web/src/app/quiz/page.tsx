// web/src/app/quiz/page.tsx (SERVER COMPONENT)
import { supabase } from '@/lib/supabase';
import QuizClient from './quiz-client';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, prompt, choices:id(question_id, label, is_correct, id)')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>KNOVA Quiz</h1>
        <p style={{ color: 'crimson' }}>Failed to load questions: {error.message}</p>
      </main>
    );
  }

  const shaped = (questions ?? []).map((q: any) => ({
    id: q.id,
    prompt: q.prompt,
    choices: (q.choices ?? []).map((c: any) => ({
      id: c.id,
      label: c.label,
      is_correct: c.is_correct,
    })),
  }));

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 16 }}>KNOVA Quiz</h1>
      <p style={{ marginBottom: 24 }}>Pick one answer for each question.</p>
      <QuizClient questions={shaped} />
    </main>
  );
}
