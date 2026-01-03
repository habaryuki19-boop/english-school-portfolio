// src/app/App.tsx
import { useEffect, useMemo, useState } from "react";

type VocabItem = {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  createdAt: number;
};

type QuizMode = "meaning" | "word";

type QuizQuestion = {
  id: string;
  prompt: string;     // 出題文（英単語 or 意味）
  answer: string;     // 正解（意味 or 英単語）
  mode: QuizMode;
};

const STORAGE_KEY = "ryuki_english_tool_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function App() {
  // ====== Vocabulary ======
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");

  // ====== Quiz ======
  const [quizMode, setQuizMode] = useState<QuizMode>("meaning");
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null);

  // ====== Stats ======
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  // ====== Load / Save ======
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        vocab?: VocabItem[];
        attempts?: number;
        correct?: number;
      };

      if (Array.isArray(parsed.vocab)) setVocab(parsed.vocab);
      if (typeof parsed.attempts === "number") setAttempts(parsed.attempts);
      if (typeof parsed.correct === "number") setCorrect(parsed.correct);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ vocab, attempts, correct })
    );
  }, [vocab, attempts, correct]);

  const accuracy = useMemo(() => {
    if (attempts === 0) return 0;
    return Math.round((correct / attempts) * 100);
  }, [attempts, correct]);

  // ====== Helpers ======
  function addVocab() {
    const w = word.trim();
    const m = meaning.trim();
    const e = example.trim();

    if (!w || !m) return;

    const item: VocabItem = {
      id: uid(),
      word: w,
      meaning: m,
      example: e ? e : undefined,
      createdAt: Date.now(),
    };

    setVocab((prev) => [item, ...prev]);
    setWord("");
    setMeaning("");
    setExample("");
  }

  function removeVocab(id: string) {
    setVocab((prev) => prev.filter((v) => v.id !== id));
  }

  function resetStats() {
    setAttempts(0);
    setCorrect(0);
  }

  function makeQuestion(items: VocabItem[], mode: QuizMode): QuizQuestion | null {
    if (items.length === 0) return null;

    const pick = items[Math.floor(Math.random() * items.length)];
    if (mode === "meaning") {
      return {
        id: pick.id,
        mode,
        prompt: `「${pick.word}」の意味は？`,
        answer: pick.meaning,
      };
    }
    return {
      id: pick.id,
      mode,
      prompt: `「${pick.meaning}」に対応する英単語は？`,
      answer: pick.word,
    };
  }

  function startQuiz() {
    if (vocab.length === 0) {
      setFeedback({ ok: false, msg: "単語を1つ以上登録してからクイズ開始してね。" });
      return;
    }
    setIsQuizRunning(true);
    setUserAnswer("");
    setFeedback(null);
    setQuestion(makeQuestion(vocab, quizMode));
  }

  function stopQuiz() {
    setIsQuizRunning(false);
    setQuestion(null);
    setUserAnswer("");
    setFeedback(null);
  }

  function nextQuestion() {
    setUserAnswer("");
    setFeedback(null);
    setQuestion(makeQuestion(vocab, quizMode));
  }

  function submitAnswer() {
    if (!question) return;

    const ok = normalize(userAnswer) === normalize(question.answer);

    setAttempts((n) => n + 1);
    if (ok) setCorrect((n) => n + 1);

    setFeedback({
      ok,
      msg: ok ? "正解！🔥" : `不正解。正解は「${question.answer}」`,
    });
  }

  // ====== UI ======
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>English Study Tool</h1>
            <p style={styles.sub}>
              留学×英語×開発：自分の学習を “プロダクト化” するミニアプリ
            </p>
          </div>

          <div style={styles.statsCard}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Attempts</span>
              <span style={styles.statValue}>{attempts}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Correct</span>
              <span style={styles.statValue}>{correct}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Accuracy</span>
              <span style={styles.statValue}>{accuracy}%</span>
            </div>

            <button style={styles.resetBtn} onClick={resetStats}>
              Reset Stats
            </button>
          </div>
        </header>

        <main style={styles.grid}>
          {/* ===== Vocabulary Register ===== */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>単語登録</h2>
            <p style={styles.cardHelp}>英単語・意味・例文（任意）を追加。保存は自動。</p>

            <div style={styles.formRow}>
              <label style={styles.label}>
                Word
                <input
                  style={styles.input}
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="e.g. resilient"
                />
              </label>

              <label style={styles.label}>
                Meaning
                <input
                  style={styles.input}
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="e.g. 回復力がある"
                />
              </label>
            </div>

            <label style={styles.label}>
              Example (optional)
              <input
                style={styles.input}
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="e.g. She is resilient even under pressure."
              />
            </label>

            <div style={styles.btnRow}>
              <button style={styles.primaryBtn} onClick={addVocab}>
                Add
              </button>
              <button style={styles.ghostBtn} onClick={() => {
                setWord(""); setMeaning(""); setExample("");
              }}>
                Clear
              </button>
            </div>

            <hr style={styles.hr} />

            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>登録済み（{vocab.length}）</h3>
              <small style={styles.muted}>上に新しいものが来る</small>
            </div>

            {vocab.length === 0 ? (
              <p style={styles.muted}>まだ単語がないよ。まず1個追加しよう。</p>
            ) : (
              <ul style={styles.list}>
                {vocab.map((v) => (
                  <li key={v.id} style={styles.listItem}>
                    <div style={styles.listMain}>
                      <div style={styles.wordLine}>
                        <span style={styles.word}>{v.word}</span>
                        <span style={styles.meaning}>— {v.meaning}</span>
                      </div>
                      {v.example ? (
                        <div style={styles.example}>例文: {v.example}</div>
                      ) : null}
                    </div>
                    <button style={styles.deleteBtn} onClick={() => removeVocab(v.id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ===== Quiz ===== */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>クイズ</h2>
            <p style={styles.cardHelp}>
              「英単語→意味」か「意味→英単語」を選んで学習。正答率も表示。
            </p>

            <div style={styles.btnRow}>
              <button
                style={quizMode === "meaning" ? styles.toggleBtnActive : styles.toggleBtn}
                onClick={() => setQuizMode("meaning")}
                disabled={isQuizRunning}
              >
                Word → Meaning
              </button>
              <button
                style={quizMode === "word" ? styles.toggleBtnActive : styles.toggleBtn}
                onClick={() => setQuizMode("word")}
                disabled={isQuizRunning}
              >
                Meaning → Word
              </button>
            </div>

            {!isQuizRunning ? (
              <div style={{ marginTop: 16 }}>
                <button style={styles.primaryBtn} onClick={startQuiz}>
                  Start Quiz
                </button>
                {feedback ? (
                  <p style={{ marginTop: 12, color: feedback.ok ? "#16a34a" : "#dc2626" }}>
                    {feedback.msg}
                  </p>
                ) : null}
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <div style={styles.quizBox}>
                  <div style={styles.quizPrompt}>
                    {question ? question.prompt : "Loading..."}
                  </div>

                  <input
                    style={styles.input}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="答えを入力"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitAnswer();
                    }}
                  />

                  <div style={styles.btnRow}>
                    <button style={styles.primaryBtn} onClick={submitAnswer} disabled={!question}>
                      Submit
                    </button>
                    <button style={styles.ghostBtn} onClick={nextQuestion}>
                      Next
                    </button>
                    <button style={styles.dangerBtn} onClick={stopQuiz}>
                      Stop
                    </button>
                  </div>

                  {feedback ? (
                    <p style={{ marginTop: 10, color: feedback.ok ? "#16a34a" : "#dc2626" }}>
                      {feedback.msg}
                    </p>
                  ) : (
                    <p style={{ marginTop: 10, color: "#6b7280" }}>
                      Enter で Submit
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 16, color: "#6b7280", fontSize: 13 }}>
                  ヒント：正答判定は大小文字や前後スペースを無視してるよ。
                </div>
              </div>
            )}
          </section>
        </main>

        <footer style={styles.footer}>
          <small style={styles.muted}>
            ※ データはブラウザに保存（localStorage）。別PC/別ブラウザでは引き継がれない。
          </small>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e5e7eb",
    padding: "32px 16px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 0.2,
  },
  sub: {
    margin: "8px 0 0",
    color: "#9ca3af",
  },
  statsCard: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
    minWidth: 220,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 14,
  },
  statLabel: { color: "#9ca3af" },
  statValue: { fontWeight: 700 },
  resetBtn: {
    width: "100%",
    marginTop: 10,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  card: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
  },
  cardHelp: {
    margin: "8px 0 14px",
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 1.5,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 10,
  },
  input: {
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b1220",
    color: "#e5e7eb",
    padding: "10px 12px",
    outline: "none",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },
  primaryBtn: {
    background: "#2563eb",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "white",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e5e7eb",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
  dangerBtn: {
    background: "transparent",
    border: "1px solid rgba(220,38,38,0.55)",
    color: "#fecaca",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
  toggleBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e5e7eb",
    padding: "8px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 13,
  },
  toggleBtnActive: {
    background: "rgba(37,99,235,0.20)",
    border: "1px solid rgba(37,99,235,0.70)",
    color: "#dbeafe",
    padding: "8px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  hr: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    margin: "14px 0",
  },
  listHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  listTitle: {
    margin: 0,
    fontSize: 14,
    color: "#e5e7eb",
  },
  muted: {
    color: "#9ca3af",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  listItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  listMain: { flex: 1 },
  wordLine: { display: "flex", gap: 10, flexWrap: "wrap" },
  word: { fontWeight: 800, fontSize: 16 },
  meaning: { color: "#cbd5e1" },
  example: { marginTop: 6, color: "#9ca3af", fontSize: 13 },
  deleteBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    height: 36,
  },
  quizBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b1220",
  },
  quizPrompt: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 10,
  },
  footer: {
    marginTop: 16,
    textAlign: "center",
  },
};

