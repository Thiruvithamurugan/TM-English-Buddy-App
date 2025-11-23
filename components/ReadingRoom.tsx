import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateReadingLesson, getLiveClient, base64ToUint8Array, arrayBufferToBase64 } from '../services/geminiService';
import { BookOpen, Mic, Volume2, ArrowRight, Play, CheckCircle, Book, StopCircle, MicOff } from 'lucide-react';
import { Modality, LiveServerMessage } from "@google/genai";

interface ReadingRoomProps {
    addXP: (amount: number, description: string) => void;
    updateReadingTime: (minutes: number) => void;
}

type Mode = 'menu' | 'loading' | 'phonics' | 'practice' | 'summary';

export const ReadingRoom: React.FC<ReadingRoomProps> = ({ addXP, updateReadingTime }) => {
    const [mode, setMode] = useState<Mode>('menu');
    const [lessonData, setLessonData] = useState<any>(null);
    
    // Live Session State
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [tutorMessage, setTutorMessage] = useState("Tap microphone to start reading aloud.");
    
    // Timer State
    const [secondsRead, setSecondsRead] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Safety Ref
    const isMounted = useRef(true);

    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<Promise<any> | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const outputSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cleanupResources();
        };
    }, []);

    const cleanupResources = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        window.speechSynthesis.cancel();

        // Cleanup Media Stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }

        // Cleanup Processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Cleanup Audio Context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        // Attempt to close session if it exists
        if (sessionRef.current) {
            sessionRef.current.then((session: any) => {
                if (session && typeof session.close === 'function') {
                     session.close();
                }
            }).catch(() => {}); // Ignore errors on cleanup
            sessionRef.current = null;
        }
    }, []);

    const startLesson = async () => {
        setMode('loading');
        try {
            const data = await generateReadingLesson();
            if (isMounted.current) {
                setLessonData(data);
                setMode('phonics'); // Start with phonics/instruction
            }
        } catch (e) {
            console.error(e);
            if (isMounted.current) setMode('menu');
        }
    };

    const startTimer = () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            if (isMounted.current) {
                setSecondsRead(prev => prev + 1);
            }
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // Update global reading stats
        const minutes = Math.floor(secondsRead / 60);
        if (minutes > 0) {
            updateReadingTime(minutes);
        }
    };

    // --- TTS Helper for Phonics ---
    const speakWord = (text: string) => {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.rate = 0.8;
        window.speechSynthesis.speak(ut);
    };

    // --- LIVE API LOGIC (READING COACH) ---
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000
            });
        }
        return audioContextRef.current;
    }, []);

    const startLiveSession = async () => {
        if (!lessonData?.story?.content) return;
        
        setLiveStatus('connecting');
        const ctx = initAudio();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true } 
            });
            mediaStreamRef.current = stream;
            
            const client = getLiveClient();

            // Construct prompt with the story text
            const storyText = lessonData.story.content;
            const systemPrompt = `You are a strict but helpful Reading Coach. 
            The user is reading the following story aloud: 
            "${storyText}"
            
            Your Job:
            1. Listen silently as they read.
            2. If they pronounce a word INCORRECTLY, interrupt immediately.
            3. Say "Stop." then repeat the correct pronunciation of that specific word 3 times. Example: "Stop. The word is 'Create'. Create. Create. Please continue."
            4. Do not correct grammar. Do not have a conversation. ONLY correct pronunciation of the target text.
            5. If they stop reading for a long time, encourage them to continue.`;

            const sessionPromise = client.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: systemPrompt
                },
                callbacks: {
                    onopen: () => {
                        if (!isMounted.current) return;
                        setLiveStatus('connected');
                        setTutorMessage("I'm listening. Start reading!");
                        setIsLiveActive(true);
                        startTimer();

                        // Audio Input Setup
                        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            if (!isMounted.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const base64Data = arrayBufferToBase64(int16.buffer);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                                });
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                        processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!isMounted.current) return;
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            // Interrupting user visual cue
                            setTutorMessage("Correcting...");
                            
                            const audioBytes = base64ToUint8Array(audioData);
                            const dataInt16 = new Int16Array(audioBytes.buffer);
                            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for(let i=0; i<dataInt16.length; i++) {
                                channelData[i] = dataInt16[i] / 32768.0;
                            }

                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            
                            const currentTime = ctx.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            outputSourceRef.current = source;
                        }
                        if (msg.serverContent?.turnComplete) {
                            setTutorMessage("Please continue reading...");
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        if (isMounted.current) {
                            setLiveStatus('disconnected');
                            setIsLiveActive(false);
                            stopTimer();
                        }
                    },
                    onerror: (e) => {
                         console.error(e);
                         if (isMounted.current) {
                             setLiveStatus('disconnected');
                             setTutorMessage("Connection Error.");
                             setIsLiveActive(false);
                             stopTimer();
                         }
                    }
                }
            });
            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error(err);
            if (isMounted.current) {
                setLiveStatus('disconnected');
            }
        }
    };

    const stopLiveSession = async () => {
        cleanupResources();
        if (isMounted.current) {
            setLiveStatus('disconnected');
            setIsLiveActive(false);
            stopTimer();
        }
    };

    const finishPractice = () => {
        stopLiveSession();
        addXP(50 + Math.floor(secondsRead / 10), "Completed Reading Session");
        if (isMounted.current) setMode('summary');
    };

    // --- RENDER ---

    if (mode === 'menu') {
        return (
            <div className="h-full p-6 flex flex-col items-center justify-center bg-orange-50">
                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 -rotate-6">
                    <Book className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Reading Room</h2>
                <p className="text-slate-500 text-lg mb-8 text-center max-w-md">Improve your pronunciation and reading speed with your AI Coach.</p>
                <button 
                    onClick={startLesson}
                    className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-orange-600 transition-transform hover:scale-105 flex items-center gap-3"
                >
                    <Play className="w-6 h-6 fill-current" /> Start New Session
                </button>
            </div>
        );
    }

    if (mode === 'loading') {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                 <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                 <p className="font-bold text-slate-500">Preparing your reading materials...</p>
            </div>
        );
    }

    if (mode === 'phonics' && lessonData) {
        return (
            <div className="h-full p-6 overflow-y-auto">
                <header className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-slate-800">Part 1: How to Read</h2>
                    <span className="text-orange-500 font-bold bg-orange-50 px-3 py-1 rounded-full text-sm">Step 1/2</span>
                </header>

                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-blue-500" /> Pronunciation Rules for Today
                        </h3>
                        <div className="grid gap-4">
                            {lessonData.phonicsRules.map((rule: any, i: number) => (
                                <div key={i} className="bg-slate-50 p-4 rounded-2xl flex items-start gap-4">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{rule.ruleName}</h4>
                                        <p className="text-slate-600 text-sm mb-2">{rule.explanation}</p>
                                        <button 
                                            onClick={() => speakWord(rule.exampleWord)}
                                            className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-white px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-50"
                                        >
                                            Example: "{rule.exampleWord}" <Volume2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                        <p className="text-slate-700 font-bold mb-4">Ready to read the story?</p>
                        <button 
                            onClick={() => setMode('practice')}
                            className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all flex items-center gap-2 mx-auto"
                        >
                            Go to Reading Practice <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'practice' && lessonData) {
        return (
            <div className="h-full flex flex-col bg-white">
                {/* Header / Controls */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-20 shadow-sm">
                     <div className="flex items-center gap-4">
                         <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${liveStatus === 'connected' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                             {liveStatus === 'connected' ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                             {liveStatus === 'connected' ? 'Listening...' : 'Mic Off'}
                         </div>
                         <div className="text-slate-600 font-bold font-mono bg-slate-50 px-2 py-1 rounded-lg">
                             {Math.floor(secondsRead / 60)}:{(secondsRead % 60).toString().padStart(2, '0')}
                         </div>
                     </div>
                     <button 
                        onClick={isLiveActive ? stopLiveSession : startLiveSession}
                        className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${isLiveActive ? 'bg-slate-200 text-slate-700' : 'bg-green-500 text-white'}`}
                     >
                         {isLiveActive ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                         {isLiveActive ? 'Stop Session' : 'Start Reading'}
                     </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl mx-auto w-full relative">
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-6 text-center">{lessonData.story.title}</h2>
                    
                    {/* Story Text */}
                    <div className="prose prose-lg prose-slate leading-loose text-slate-700">
                        {lessonData.story.content.split('\n').map((p: string, i: number) => (
                            <p key={i} className="mb-4">{p}</p>
                        ))}
                    </div>

                    {/* Finish Button */}
                    <div className="mt-12 text-center pb-8">
                        <button 
                            onClick={finishPractice}
                            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                        >
                            I'm Done Reading
                        </button>
                    </div>
                </div>

                {/* Live Feedback Overlay */}
                <div className="bg-slate-900 text-white p-4 text-center">
                    <p className="font-bold animate-pulse">{tutorMessage}</p>
                </div>
            </div>
        );
    }

    if (mode === 'summary') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-green-50">
                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Reading Complete!</h2>
                <p className="text-slate-500 mb-8">
                    You practiced for <span className="font-bold text-green-600">{Math.floor(secondsRead / 60)} minutes</span> and <span className="font-bold text-green-600">{secondsRead % 60} seconds</span>.
                </p>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full mb-8">
                    <h4 className="font-bold text-slate-700 mb-2">Tutor's Note:</h4>
                    <p className="text-slate-500 italic">"Great job practicing today! Keep focusing on the pronunciation rules we learned. Regular reading is the key to fluency!"</p>
                </div>

                <button 
                    onClick={() => setMode('menu')}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors"
                >
                    Back to Menu
                </button>
            </div>
        );
    }

    return null;
};