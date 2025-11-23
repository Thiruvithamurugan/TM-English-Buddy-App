import React, { useState, useEffect, useRef } from 'react';
import { generateStoryActivity } from '../services/geminiService';
import { Play, Pause, RotateCcw, ArrowRight, BookOpen, Music, CheckCircle, XCircle, Sparkles, Check } from 'lucide-react';

interface StoryTimeProps {
    addXP: (amount: number, description: string) => void;
}

export const StoryTime: React.FC<StoryTimeProps> = ({ addXP }) => {
    const [loading, setLoading] = useState(true);
    const [storyData, setStoryData] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Phase: 'reading' | 'quiz' | 'summary'
    const [phase, setPhase] = useState<'reading' | 'quiz' | 'summary'>('reading');
    
    // Quiz State
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    const loadStory = async () => {
        setLoading(true);
        setPhase('reading');
        setCurrentQIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setIsPlaying(false);
        window.speechSynthesis.cancel();

        try {
            const data = await generateStoryActivity();
            setStoryData(data);
            // Auto play after a moment
            setTimeout(() => {
                if (data.content) playStory(data.content);
            }, 1000);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStory();
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const playStory = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onstart = () => setIsPlaying(true);
        
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const toggleAudio = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else if (storyData?.content) {
            playStory(storyData.content);
        }
    };

    const handleOptionSelect = (opt: string) => {
        if (isAnswerChecked) return;
        setSelectedOption(opt);
    };

    const checkAnswer = () => {
        if (!selectedOption || !storyData) return;
        setIsAnswerChecked(true);
        const currentQ = storyData.questions[currentQIndex];
        
        if (selectedOption === currentQ.answer) {
            setScore(prev => prev + 1);
            addXP(15, "Story Quiz Correct Answer");
        }
    };

    const nextQuestion = () => {
        if (!storyData) return;
        
        if (currentQIndex < storyData.questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerChecked(false);
        } else {
            setPhase('summary');
            addXP(100, "Completed Story Time");
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-indigo-50">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Music className="w-12 h-12 text-indigo-500 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-indigo-900 mb-2">Writing a new story...</h2>
                <p className="text-indigo-600">Creating 10 challenge questions...</p>
            </div>
        );
    }

    if (!storyData) return null;

    // --- SUMMARY PHASE ---
    if (phase === 'summary') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-indigo-50">
                 <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                    <Sparkles className="w-16 h-16 text-yellow-500" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Story Complete!</h2>
                <p className="text-slate-500 text-xl mb-8">
                    You answered <span className="text-indigo-600 font-bold">{score}</span> out of <span className="font-bold">{storyData.questions.length}</span> correctly.
                </p>
                <button 
                    onClick={loadStory}
                    className="bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                    <BookOpen className="w-5 h-5" /> Read Another Story
                </button>
            </div>
        );
    }

    // --- READING PHASE ---
    if (phase === 'reading') {
        return (
            <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
                <div className="flex-1 overflow-y-auto z-10 p-6 md:p-10 max-w-3xl mx-auto w-full">
                    <header className="mb-6 text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mb-3 uppercase tracking-wider">Story Time</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight">{storyData.title}</h2>
                    </header>

                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 mb-8 relative">
                        <button 
                            onClick={toggleAudio}
                            className="absolute -top-6 right-8 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
                        </button>
                        
                        <div className="prose prose-lg text-slate-600 leading-loose max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                            {storyData.content.split('\n').map((para: string, i: number) => (
                                <p key={i} className="mb-4">{para}</p>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto flex justify-center pb-8">
                        <button 
                            onClick={() => {
                                window.speechSynthesis.cancel();
                                setIsPlaying(false);
                                setPhase('quiz');
                            }}
                            className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all flex items-center gap-3 transform hover:-translate-y-1"
                        >
                            <CheckCircle className="w-6 h-6" /> I Read It, Start Quiz!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- QUIZ PHASE ---
    const currentQ = storyData.questions[currentQIndex];
    
    return (
        <div className="h-full flex flex-col max-w-2xl mx-auto p-6 bg-slate-50">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => setPhase('reading')}
                    className="text-slate-400 font-bold hover:text-indigo-500 flex items-center gap-1"
                >
                     Read Story Again
                </button>
                <div className="font-bold text-indigo-400">
                    Question {currentQIndex + 1} / {storyData.questions.length}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-indigo-100 flex-1 flex flex-col">
                 <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8">{currentQ.text}</h3>

                 <div className="space-y-4 mb-8">
                    {currentQ.options.map((opt: string) => {
                        const isSelected = selectedOption === opt;
                        let style = "border-2 border-slate-200 hover:border-indigo-300 bg-white";
                        
                        if (isAnswerChecked) {
                            if (opt === currentQ.answer) {
                                style = "border-green-500 bg-green-50 text-green-800";
                            } else if (isSelected) {
                                style = "border-red-500 bg-red-50 text-red-800 opacity-60";
                            } else {
                                style = "opacity-50";
                            }
                        } else if (isSelected) {
                            style = "border-indigo-500 bg-indigo-50 text-indigo-900 transform scale-[1.02] shadow-md";
                        }

                        return (
                            <button
                                key={opt}
                                onClick={() => handleOptionSelect(opt)}
                                disabled={isAnswerChecked}
                                className={`w-full p-4 rounded-xl text-left font-bold text-lg transition-all ${style} flex justify-between items-center`}
                            >
                                <span>{opt}</span>
                                {isAnswerChecked && opt === currentQ.answer && <CheckCircle className="w-6 h-6 text-green-600" />}
                                {isAnswerChecked && isSelected && opt !== currentQ.answer && <XCircle className="w-6 h-6 text-red-500" />}
                            </button>
                        );
                    })}
                 </div>

                 {isAnswerChecked ? (
                    <div className={`mt-auto p-4 rounded-xl ${selectedOption === currentQ.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="mb-2 font-bold flex items-center gap-2">
                            {selectedOption === currentQ.answer 
                                ? <span className="text-green-700">Correct!</span> 
                                : <span className="text-red-700">Wrong! The answer is: {currentQ.answer}</span>
                            }
                        </div>
                        <p className="text-slate-600 italic text-sm mb-4">
                            {currentQ.explanation}
                        </p>
                        <button 
                            onClick={nextQuestion}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${selectedOption === currentQ.answer ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            {currentQIndex < storyData.questions.length - 1 ? 'Next Question' : 'Finish Story'}
                        </button>
                    </div>
                 ) : (
                    <button 
                        onClick={checkAnswer}
                        disabled={!selectedOption}
                        className="mt-auto w-full bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Check Answer
                    </button>
                 )}
            </div>
        </div>
    );
};