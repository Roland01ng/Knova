'use client';

import { useEffect, useMemo, useState } from 'react';

type Choice = { id: string; label: string; is_correct: boolean };
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
  // Start with the server-provided order to match SSR
  const [viewQs, setViewQs] = useState<Question[]>(questions);
  const [mounted, setMounted] = useState(false);

  // After the component mounts on the client, do the shuffle once
  useEffect(() => {
    setMounted(true);
    setViewQs(qs => qs.map(q => ({ ...q, choices: shuffle(q.choices) })));
  }, []);

  // (Optional) If you want to avoid any tiny flicker, render nothing until mounted.
  if (!mounted) return null;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const correctCount = useMemo(() => {
    if (!submitted) return 0;
    return viewQs.reduce((acc, q) => {
      const chosenId = answers[q.id];
      const choice = q.choices.find(c => c.id === chosenId);
      return acc + (choice?.is_correct ? 1 : 0);
    }, 0);
  }, [submitted, viewQs, answers]);

  return (
    <div>
      {viewQs.map((q, idx) => {
        const chosen = answers[q.id];
        const showFeedback = submitted && chosen;
        return (
          <div key={q.id} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {idx + 1}. {q.prompt}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {q.choices.map((c) => {
                const isChosen = chosen === c.id;
                const isRight = submitted && c.is_correct;
                const isWrongChosen = submitted && isChosen && !c.is_correct;
                return (
                  <button
                    key={c.id}
                    onClick={() => !submitted && setAnswers(a => ({ ...a, [q.id]: c.id }))}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      background:
                        isRight ? '#eaffea' :
                        isWrongChosen ? '#ffecec' :
                        isChosen ? '#f5f5f5' : 'white',
                      cursor: submitted ? 'default' : 'pointer'
                    }}
                  >
                    {c.label}
                    {showFeedback && (
                      <span style={{ marginLeft: 10, opacity: 0.8 }}>
                        {isRight ? '✅' : isWrongChosen ? '❌' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #333',
            background: '#111',
            color: 'white'
          }}
        >
          Submit answers
        </button>
      ) : (
        <div style={{ marginTop: 16, fontWeight: 600 }}>
          Score: {correctCount} / {viewQs.length}
        </div>
      )}
    </div>
  );
}
