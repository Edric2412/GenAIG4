'use client';

import React, { useState } from 'react';
import LayoutWrapper, { useSubject } from '../../components/LayoutWrapper';

export default function QuizPage() {
  return (
    <LayoutWrapper>
      <QuizUI />
    </LayoutWrapper>
  );
}

function QuizUI() {
  const { selectedSubject } = useSubject();

  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const res = await fetch('http://localhost:8000/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('atlas_token')}`,
        },
        body: JSON.stringify({
          topic,
          subject: selectedSubject,
          num_questions: 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to generate quiz');

      setQuiz(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, option) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIndex]: option });
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });
    return score;
  };

  const handleQuizSubmit = async () => {
    const score = calculateScore();
    setSubmitted(true);

    try {
      await fetch('http://localhost:8000/quiz/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('atlas_token')}`,
        },
        body: JSON.stringify({
          topic: quiz.topic,
          score: score,
          total_questions: quiz.questions.length,
          difficulty: quiz.difficulty,
        }),
      });
      console.log("Quiz result saved successfully");
    } catch (err) {
      console.error("Failed to save quiz result:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* HEADER */}
      <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md">
        <h1 className="font-headline text-4xl text-on-surface tracking-tight">
          Adaptive Quiz
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Generate context-aware quizzes from your study materials
        </p>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto ethereal-scrollbar px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">

          {/* INPUT PANEL */}
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/15">
            <div className="flex gap-3 items-center">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Neural Networks, Thermodynamics...)"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary"
              />

              <button
                onClick={generateQuiz}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-label text-sm transition-all
                ${loading
                  ? 'bg-surface-container text-on-surface-variant'
                  : 'bg-primary text-on-primary hover:scale-105 shadow-lg shadow-primary/20'
                }`}
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-error text-sm">
                {error}
              </div>
            )}
          </div>

          {/* QUIZ SECTION */}
          {quiz && (
            <div className="flex flex-col gap-6">
              
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Topic: <span className="text-primary">{quiz.topic}</span>
                </span>
                <span className={`text-[10px] font-label font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded border
                  ${quiz.difficulty === 'Hard' ? 'text-red-400 border-red-400/30' : 
                    quiz.difficulty === 'Easy' ? 'text-green-400 border-green-400/30' : 
                    'text-blue-400 border-blue-400/30'}
                `}>
                  {quiz.difficulty}
                </span>
              </div>

              {quiz.questions.map((q, i) => (
                <div
                  key={i}
                  className="glass-panel p-6 rounded-2xl border border-outline-variant/10"
                >
                  <h3 className="font-headline text-lg text-primary mb-4">
                    Q{i + 1}. {q.question}
                  </h3>

                  <div className="flex flex-col gap-3">
                    {q.options.map((opt, idx) => {
                      const isSelected = answers[i] === opt;
                      const isCorrect = submitted && opt === q.answer;
                      const isWrong = submitted && isSelected && opt !== q.answer;

                      return (
                        <button
                          key={idx}
                          onClick={() => selectAnswer(i, opt)}
                          disabled={submitted}
                          className={`text-left px-4 py-3 rounded-xl border transition-all
                            ${isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant/20'}
                            ${isCorrect ? 'bg-green-500/10 border-green-400' : ''}
                            ${isWrong ? 'bg-red-500/10 border-red-400' : ''}
                            ${submitted ? 'cursor-default' : 'hover:border-primary/50'}
                          `}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* REVIEW */}
                  {submitted && (
                    <div className="mt-4 text-sm text-on-surface-variant">
                      <p className="text-green-400 font-medium">
                        Correct Answer: {q.answer}
                      </p>
                      <p className="mt-1 italic">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* SUBMIT BUTTON */}
              {!submitted ? (
                <button
                  onClick={handleQuizSubmit}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  Submit Quiz
                </button>
              ) : (
                <div className="text-center">
                  <div className="text-xl font-headline text-primary">
                    Score: {calculateScore()} / {quiz.questions.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mt-2">
                    Difficulty: {quiz.difficulty} • Result Recorded
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
