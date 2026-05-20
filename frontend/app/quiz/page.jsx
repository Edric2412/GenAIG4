'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper, { useSubject } from '../../components/LayoutWrapper';

export default function QuizPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('atlas_role') === 'admin') {
      router.push('/chat');
    }
  }, [router]);

  return (
    <LayoutWrapper>
      <QuizUI />
    </LayoutWrapper>
  );
}

function QuizUI() {
  const { selectedSubject } = useSubject();

  const [topic, setTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchTopics = async () => {
      setTopicsLoading(true);
      try {
        const url = new URL('http://localhost:8000/quiz/topics');
        if (selectedSubject && selectedSubject !== 'all') {
          url.searchParams.append('subject', selectedSubject);
        }
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('atlas_token')}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableTopics(data);
          
          if (topic && !data.find(t => t.name === topic) && !isCustomTopic) {
            setTopic('');
          }
        }
      } catch (err) {
        console.error("Failed to fetch topics:", err);
      } finally {
        setTopicsLoading(false);
      }
    };
    fetchTopics();
  }, [selectedSubject, isCustomTopic, refreshTrigger]); // re-fetch when refreshTrigger changes

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
      <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md shrink-0">
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

          {/* TOPICS PANEL */}
          {!quiz && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="font-headline text-xl text-on-surface">Suggested Topics</h2>
                <button 
                  onClick={() => { setIsCustomTopic(!isCustomTopic); setTopic(''); }}
                  className="text-sm font-label text-primary hover:text-primary/80 transition-colors"
                >
                  {isCustomTopic ? "Pick from suggestions" : "+ Enter custom topic"}
                </button>
              </div>

              {isCustomTopic ? (
                <div className="glass-panel p-6 rounded-2xl border border-outline-variant/15 flex gap-3 items-center">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter custom topic (e.g., Backpropagation, Entropy...)"
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={generateQuiz}
                    disabled={loading || !topic.trim()}
                    className={`px-6 py-3 rounded-xl font-label text-sm transition-all
                    ${loading || !topic.trim()
                      ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                      : 'bg-primary text-on-primary hover:scale-105 shadow-lg shadow-primary/20'
                    }`}
                  >
                    {loading ? 'Generating...' : 'Start Custom Quiz'}
                  </button>
                </div>
              ) : (
                <>
                  {topicsLoading ? (
                    <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm animate-pulse">
                      Analyzing study materials...
                    </div>
                  ) : availableTopics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableTopics.map((t, idx) => {
                        const isSelected = topic === t.name;
                        return (
                          <div
                            key={idx}
                            onClick={() => setTopic(t.name)}
                            className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]
                              ${isSelected 
                                ? 'border-primary ring-1 ring-primary bg-primary/5 scale-[1.02]' 
                                : 'border-outline-variant/20 hover:border-primary/50 hover:-translate-y-1'
                              }
                            `}
                          >
                            <div>
                              <h3 className="font-headline text-lg text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors">
                                {t.name}
                              </h3>
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`text-[10px] font-label font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border
                                  ${t.difficulty === 'Hard' ? 'text-red-400 border-red-400/30 bg-red-400/10' : 
                                    t.difficulty === 'Easy' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 
                                    'text-blue-400 border-blue-400/30 bg-blue-400/10'}
                                `}>
                                  Next: {t.difficulty}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-outline-variant/10 flex justify-between items-center">
                              {t.latest_score !== null ? (
                                <span className="text-xs text-on-surface-variant font-medium">
                                  Last Score: <span className="text-on-surface">{t.latest_score}/{t.total_questions}</span> {t.latest_difficulty && <span className="text-[10px] text-on-surface-variant/70 uppercase">({t.latest_difficulty})</span>}
                                </span>
                              ) : (
                                <span className="text-xs text-on-surface-variant/60 italic">
                                  Not attempted yet
                                </span>
                              )}
                              
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse"></span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass-panel p-8 rounded-2xl border border-outline-variant/15 text-center">
                      <p className="text-on-surface-variant text-sm mb-4">No specific topics found in materials, or no materials uploaded.</p>
                      <button 
                        onClick={() => setIsCustomTopic(true)}
                        className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-sm text-on-surface"
                      >
                        Enter a custom topic
                      </button>
                    </div>
                  )}

                  {/* Start Quiz Action Bar */}
                  {availableTopics.length > 0 && !isCustomTopic && (
                    <div className="flex items-center justify-between mt-6 p-4 glass-panel rounded-xl border border-outline-variant/10">
                      <span className="text-sm text-on-surface-variant">
                        {topic ? `Selected: ` : 'Please select a topic to begin'}
                        {topic && <span className="font-bold text-primary">{topic}</span>}
                      </span>
                      <button
                        onClick={generateQuiz}
                        disabled={loading || !topic}
                        className={`px-8 py-3 rounded-xl font-label text-sm transition-all
                        ${loading || !topic
                          ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-50'
                          : 'bg-primary text-on-primary hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]'
                        }`}
                      >
                        {loading ? 'Generating...' : 'Start Quiz'}
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}
            </div>
          )}



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
                <div className="flex flex-col items-center gap-6 p-6 glass-panel rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="text-center">
                    <div className="text-3xl font-headline text-primary mb-2">
                      Score: {calculateScore()} / {quiz.questions.length}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      Difficulty: {quiz.difficulty} • Result Recorded
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={generateQuiz}
                      className="px-6 py-3 rounded-xl font-label text-sm bg-primary text-on-primary hover:scale-105 shadow-lg shadow-primary/20 transition-all"
                    >
                      Try Another {quiz.topic} Quiz
                    </button>
                    <button
                      onClick={() => {
                        setQuiz(null);
                        setTopic('');
                        setRefreshTrigger(prev => prev + 1);
                      }}
                      className="px-6 py-3 rounded-xl font-label text-sm border border-outline-variant/30 hover:border-primary/50 text-on-surface hover:bg-surface-container transition-all"
                    >
                      Back to Topics
                    </button>
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
