import React, { useState, useEffect, useRef } from 'react';
import { generateGrammarActivity } from '../services/geminiService';
import { BookOpen, CheckCircle, ChevronRight, GraduationCap, School, Sparkles, User, ArrowRight, XCircle, Play, RotateCcw, List, Volume2, Pause } from 'lucide-react';

interface GrammarZoneProps {
    addXP: (amount: number, description: string) => void;
}

type Level = 'Explorer (Grades 1-5)' | 'Scholar (Grades 6-10)' | 'Master (HS & College)';
type ViewPhase = 'modules' | 'loading' | 'lesson' | 'quiz' | 'summary';

const LEVELS: { id: Level; icon: any; color: string; desc: string }[] = [
    { id: 'Explorer (Grades 1-5)', icon: User, color: 'bg-green-500', desc: 'Basics & Simple Tenses' },
    { id: 'Scholar (Grades 6-10)', icon: School, color: 'bg-blue-500', desc: 'Intermediate Structures' },
    { id: 'Master (HS & College)', icon: GraduationCap, color: 'bg-purple-600', desc: 'Advanced Grammar' }
];

const TOPICS: Record<Level, string[]> = {
    'Explorer (Grades 1-5)': [
        'Nouns: Common vs Proper',
        'Singular and Plural Nouns',
        'Countable vs Uncountable Nouns',
        'Pronouns: Subject and Object',
        'Possessive Adjectives (My, Your)',
        'Articles: A, An, The',
        'Adjectives: Describing Things',
        'Prepositions of Place (In, On, Under)',
        'Verb To Be (Am, Is, Are)',
        'Present Simple: Habits & Facts',
        'Present Continuous: Happening Now',
        'Have vs Have Got',
        'Can and Can\'t (Ability)',
        'Past Simple: Regular Verbs',
        'Past Simple: Irregular Verbs',
        'Past Simple: Was and Were',
        'Future Simple: Will',
        'Be Going To: Future Plans',
        'Imperatives (Commands)',
        'Question Words (Who, What, Where)'
    ],
    'Scholar (Grades 6-10)': [
        'Past Continuous',
        'Past Simple vs Past Continuous',
        'Present Perfect Simple',
        'Present Perfect: For vs Since',
        'Present Perfect: Just, Yet, Already',
        'Present Perfect vs Past Simple',
        'Past Perfect Simple',
        'Future Continuous',
        'Passive Voice: Present Simple',
        'Passive Voice: Past Simple',
        'Modals: Should, Must, Have to',
        'Modals of Possibility (Might, Could)',
        'Comparatives and Superlatives',
        'First Conditional',
        'Second Conditional',
        'Zero Conditional',
        'Gerunds (Verb+ing)',
        'Infinitives (To+Verb)',
        'Relative Clauses (Who, Which, That)',
        'Used To vs Would'
    ],
    'Master (HS & College)': [
        'Present Perfect Continuous',
        'Past Perfect Continuous',
        'Future Perfect Simple',
        'Future Perfect Continuous',
        'Third Conditional',
        'Mixed Conditionals',
        'Wishes and Regrets',
        'Reported Speech: Statements',
        'Reported Speech: Questions',
        'Advanced Passive Structures',
        'Causative Verbs (Have something done)',
        'Subjunctive Mood',
        'Inversion (Rarely did he...)',
        'Participle Clauses',
        'Cleft Sentences',
        'Discourse Markers & Linking Words',
        'Advanced Prepositions',
        'Phrasal Verbs (Inseparable)',
        'Phrasal Verbs (Separable)',
        'Ellipsis and Substitution'
    ]
};

export const GrammarZone: React.FC<GrammarZoneProps> = ({ addXP }) => {
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [phase, setPhase] = useState<ViewPhase>('modules');
    
    // Activity State
    const [currentTopic, setCurrentTopic] = useState<string>('');
    const [lessonData, setLessonData] = useState<any>(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    
    // Quiz Interaction State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (phase !== 'lesson') {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    }, [phase]);

    const playLessonAudio = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.9; 
        utterance.onend = () => setIsPlaying(false);
        utterance.onstart = () => setIsPlaying(true);
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const toggleAudio = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else if (lessonData?.lesson?.content) {
            playLessonAudio(lessonData.lesson.content);
        }
    };

    const startTopic = async (topic: string) => {
        setPhase('loading');
        setCurrentTopic(topic);
        try {
            const lvl = selectedLevel || 'Explorer (Grades 1-5)';
            const data = await generateGrammarActivity(lvl, topic);
            setLessonData(data);
            setCurrentQIndex(0);
            setScore(0);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            setPhase('lesson');
            
            setTimeout(() => {
                if (data.lesson?.content) {
                   playLessonAudio(data.lesson.content);
                }
            }, 1000);
            
        } catch (error) {
            console.error(error);
            setPhase('modules');
        }
    };

    const handleOptionSelect = (opt: string) => {
        if (isAnswerChecked) return;
        setSelectedOption(opt);
    };

    const checkAnswer = () => {
        if (!selectedOption || !lessonData) return;
        
        setIsAnswerChecked(true);
        const currentQ = lessonData.quiz[currentQIndex];
        
        if (selectedOption === currentQ.answer) {
            setScore(prev => prev + 1);
            addXP(10, "Grammar Quiz Question");
        }
    };

    const nextQuestion = () => {
        if (!lessonData) return;
        
        if (currentQIndex < lessonData.quiz.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerChecked(false);
        } else {
            setPhase('summary');
            addXP(150, "Grammar Quiz Completion");
        }
    };

    const startQuiz = () => {
        window.speechSynthesis.cancel();
        setPhase('quiz');
    };

    const resetToLevel = () => {
        window.speechSynthesis.cancel();
        setPhase('modules');
        setLessonData(null);
    };

    // 1. LEVEL SELECTION
    if (!selectedLevel) {
        return (
            <div className="h-full p-6 overflow-y-auto">
                <header className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Grammar <span className="text-brand-500">Zone</span></h2>
                    <p className="text-slate-500 text-lg mt-2 max-w-2xl">Master English from A to Z. Choose your level.</p>
                </header>
                
                <div className="grid gap-6 max-w-4xl mx-auto">
                    {LEVELS.map((lvl) => (
                        <button
                            key={lvl.id}
                            onClick={() => setSelectedLevel(lvl.id)}
                            className="bg-white group border-2 border-slate-100 p-8 rounded-3xl hover:border-brand-400 hover:shadow-xl transition-all relative overflow-hidden text-left"
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 ${lvl.color} opacity-5 rounded-bl-[100px] transition-transform group-hover:scale-110`}></div>
                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className={`w-20 h-20 ${lvl.color} rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:-rotate-6 transition-transform`}>
                                    <lvl.icon className="w-10 h-10" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-1">{lvl.id}</h3>
                                    <p className="text-slate-500 font-medium text-lg">{lvl.desc}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-full group-hover:bg-brand-50 transition-colors">
                                    <ChevronRight className="w-8 h-8 text-slate-300 group-hover:text-brand-500" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // 2. TOPIC SELECTION
    if (phase === 'modules') {
        return (
            <div className="h-full p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-brand-50 z-20 pb-4 pt-2">
                     <button 
                        onClick={() => setSelectedLevel(null)} 
                        className="flex items-center gap-2 text-slate-400 font-bold hover:text-brand-500 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Levels
                    </button>
                    <div className="bg-brand-100 text-brand-700 px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                        {selectedLevel}
                    </div>
                </div>
                
                <header className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-800">Select a Lesson</h2>
                    <p className="text-slate-500 text-lg">Choose a topic to start your teacher-led session.</p>
                </header>

                <div className="max-w-3xl mx-auto pb-12 space-y-3">
                    {TOPICS[selectedLevel].map((topic, index) => (
                        <button
                            key={topic}
                            onClick={() => startTopic(topic)}
                            className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all flex items-center justify-between group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                                    {index + 1}
                                </span>
                                <span className="font-bold text-slate-700 text-lg group-hover:text-brand-700">{topic}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-full group-hover:bg-brand-50 transition-colors">
                                <Play className="w-5 h-5 text-slate-300 group-hover:text-brand-500 fill-current" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // 3. LOADING
    if (phase === 'loading') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Sparkles className="w-12 h-12 text-brand-500 animate-spin-slow" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparing your lesson...</h2>
                <p className="text-slate-500">Our AI teacher is writing a custom guide on <span className="font-bold text-brand-600">{currentTopic}</span></p>
            </div>
        );
    }

    // 4. LESSON PHASE (Scrollable text + Mark Read button)
    if (phase === 'lesson' && lessonData) {
        return (
            <div className="h-full flex flex-col max-w-3xl mx-auto p-6 overflow-hidden">
                 <button onClick={resetToLevel} className="self-start text-slate-400 hover:text-slate-600 font-bold mb-4">Close Lesson</button>
                 
                 <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="bg-brand-500 p-8 text-white relative flex-shrink-0">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2 opacity-90">
                                <BookOpen className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-widest text-sm">Lesson Time</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">{lessonData.lesson.title || currentTopic}</h2>
                            
                            <button 
                                onClick={toggleAudio}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold transition-all backdrop-blur-sm"
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                {isPlaying ? 'Pause Teacher' : 'Listen to Teacher'}
                            </button>
                        </div>
                    </div>
                    
                    {/* SCROLLABLE CONTENT AREA */}
                    <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="prose prose-lg prose-slate max-w-none">
                            <p className="text-lg leading-relaxed text-slate-700 font-medium whitespace-pre-line">
                                {lessonData.lesson.content}
                            </p>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                            <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5" /> Examples
                            </h3>
                            <ul className="space-y-3">
                                {lessonData.lesson.examples.map((ex: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 bg-white p-3 rounded-xl shadow-sm">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span>{ex}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="h-4"></div> {/* Spacer for scroll padding */}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
                        <button 
                            onClick={startQuiz}
                            className="w-full bg-brand-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-600 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            <CheckCircle className="w-6 h-6" />
                            <span>Mark as Read & Start Quiz (15 Qs)</span>
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    // 5. QUIZ PHASE
    if (phase === 'quiz' && lessonData) {
        const currentQ = lessonData.quiz[currentQIndex];
        const progress = ((currentQIndex) / lessonData.quiz.length) * 100;

        return (
            <div className="h-full flex flex-col max-w-2xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={resetToLevel} className="text-slate-400 font-bold hover:text-slate-600">Quit</button>
                    <div className="flex-1 mx-6 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand-500 transition-all duration-500 rounded-full" 
                            style={{width: `${progress}%`}}
                        ></div>
                    </div>
                    <div className="font-bold text-slate-400 text-sm">
                        {currentQIndex + 1} / {lessonData.quiz.length}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 leading-snug">{currentQ.question}</h3>
                        
                        <div className="space-y-3">
                            {currentQ.options.map((option: string) => {
                                let style = "bg-white border-2 border-slate-200 hover:border-brand-300";
                                const isSelected = selectedOption === option;
                                
                                if (isAnswerChecked) {
                                    if (option === currentQ.answer) {
                                        style = "bg-green-100 border-green-500 text-green-800";
                                    } else if (isSelected && option !== currentQ.answer) {
                                        style = "bg-red-100 border-red-500 text-red-800 opacity-60";
                                    } else {
                                        style = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                                    }
                                } else if (isSelected) {
                                    style = "bg-brand-50 border-brand-500 text-brand-700 shadow-md transform scale-[1.02]";
                                }

                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionSelect(option)}
                                        disabled={isAnswerChecked}
                                        className={`w-full p-5 rounded-2xl text-left font-bold text-lg transition-all ${style}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            {option}
                                            {isAnswerChecked && option === currentQ.answer && <CheckCircle className="w-6 h-6 text-green-600" />}
                                            {isAnswerChecked && isSelected && option !== currentQ.answer && <XCircle className="w-6 h-6 text-red-500" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isAnswerChecked ? (
                        <div className={`mt-auto p-6 rounded-2xl animate-fade-in mb-4 border-2 ${selectedOption === currentQ.answer ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex flex-col gap-2">
                                <div className={`font-extrabold text-xl ${selectedOption === currentQ.answer ? 'text-green-800' : 'text-red-800'}`}>
                                    {selectedOption === currentQ.answer ? 'Correct!' : 'Not Quite!'}
                                </div>
                                
                                {selectedOption !== currentQ.answer && (
                                    <div className="text-red-700 font-bold">
                                        Answer: {currentQ.answer}
                                    </div>
                                )}
                                
                                <p className="text-slate-600 leading-relaxed text-sm bg-white/60 p-3 rounded-lg mt-2">
                                    <span className="font-bold">Explanation:</span> {currentQ.explanation}
                                </p>
                            </div>
                            <button 
                                onClick={nextQuestion}
                                className={`mt-4 w-full py-4 rounded-xl font-bold text-white transition-colors text-lg ${selectedOption === currentQ.answer ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {currentQIndex < lessonData.quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={checkAnswer}
                            disabled={!selectedOption}
                            className="mt-auto w-full py-4 bg-brand-500 text-white font-extrabold text-xl rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
                        >
                            Check Answer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 6. SUMMARY
    if (phase === 'summary' && lessonData) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                    <Sparkles className="w-16 h-16 text-yellow-500" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Lesson Complete!</h2>
                <p className="text-slate-500 text-xl mb-8">You scored <span className="text-brand-600 font-bold">{score}</span> out of <span className="font-bold">{lessonData.quiz.length}</span></p>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => startTopic(currentTopic)}
                        className="flex items-center gap-2 bg-white border-2 border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" /> Practice Again
                    </button>
                    <button 
                        onClick={resetToLevel}
                        className="flex items-center gap-2 bg-brand-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-600 transition-colors"
                    >
                        Next Lesson <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};