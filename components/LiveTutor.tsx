import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, Wifi, WifiOff } from 'lucide-react';
import { getLiveClient, base64ToUint8Array, arrayBufferToBase64 } from '../services/geminiService';
import { Modality, LiveServerMessage } from "@google/genai";

export const LiveTutor: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<string>("Tap the microphone to start talking!");
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputSourceRef = useRef<AudioBufferSourceNode | null>(null); // To stop playback if needed
  
  // Live API Session
  const sessionRef = useRef<any>(null); // Using any to avoid complex type casting in this snippet for LiveSession
  const nextStartTimeRef = useRef<number>(0);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000 // Gemini output rate
        });
    }
    return audioContextRef.current;
  }, []);

  const connectToLiveAPI = async () => {
    setStatus('connecting');
    const ctx = initAudio();
    
    // Connect to mic
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true
        } });
        mediaStreamRef.current = stream;
        
        const client = getLiveClient();
        
        // Establish connection
        const sessionPromise = client.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are a friendly, encouraging English tutor for children named Buddy. Keep sentences short. Correct grammar gently. Be enthusiastic. If the user speaks another language, translate it and teach the English words.",
            },
            callbacks: {
                onopen: () => {
                    setStatus('connected');
                    setTranscript("I'm listening...");
                    
                    // Setup Input Stream
                    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = inputCtx.createMediaStreamSource(stream);
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        // Convert float32 to int16 PCM
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        
                        const base64Data = arrayBufferToBase64(int16.buffer);
                        
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: {
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: base64Data
                                }
                            });
                        });
                        
                        // Simple volume visualization
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        setVolume(Math.sqrt(sum/inputData.length) * 5); 
                    };

                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                    
                    sourceRef.current = source as any; // Type workaround for different contexts
                    processorRef.current = processor;
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Handle Audio Output
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                         const audioBytes = base64ToUint8Array(audioData);
                         
                         // Decode manually (simplification: strictly assuming 24k PCM from Gemini)
                         // For true robustness we normally construct a WAV header or use raw decoding logic
                         // But standard decodeAudioData often fails on raw PCM chunks without headers.
                         // Here we map raw PCM to buffer manually for playback.
                         
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
                         
                         // Visual feedback
                         setTranscript("Buddy is speaking...");
                    }
                    
                    if (msg.serverContent?.turnComplete) {
                        setTranscript("Your turn!");
                        nextStartTimeRef.current = 0; // Reset drift sync on turn end
                    }
                },
                onclose: () => {
                    setStatus('disconnected');
                    setActive(false);
                },
                onerror: (e) => {
                    console.error("Live API Error", e);
                    setStatus('disconnected');
                    setTranscript("Connection error. Try again.");
                    setActive(false);
                }
            }
        });
        
        sessionRef.current = sessionPromise;
        
    } catch (err) {
        console.error("Access denied or API error", err);
        setStatus('disconnected');
        setTranscript("Please allow microphone access.");
        setActive(false);
    }
  };

  const disconnect = async () => {
     if (sessionRef.current) {
         // sessionRef.current.close() not directly available on promise, wait for resolve or handled in cleanup
         // The SDK doesn't expose a clean sync close method on the promise easily without keeping the session object.
         // We rely on component cleanup.
     }
     
     if (mediaStreamRef.current) {
         mediaStreamRef.current.getTracks().forEach(track => track.stop());
         mediaStreamRef.current = null;
     }
     if (processorRef.current) {
         processorRef.current.disconnect();
         processorRef.current = null;
     }
     if (audioContextRef.current) {
         await audioContextRef.current.close();
         audioContextRef.current = null;
     }
     setStatus('disconnected');
     setActive(false);
     setTranscript("Tap microphone to start.");
  };
  
  const toggleSession = () => {
      if (active) {
          disconnect();
      } else {
          setActive(true);
          connectToLiveAPI();
      }
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent-yellow opacity-20 rounded-full blur-3xl animate-bounce-slow"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-purple opacity-20 rounded-full blur-3xl animate-bounce-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <header className="p-6 pb-2 z-10">
        <h2 className="text-3xl font-extrabold text-slate-800">AI Tutor <span className="text-brand-500">Live</span></h2>
        <p className="text-slate-500 font-medium">Practice speaking in real-time!</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
        {/* Avatar / Visualizer */}
        <div className={`relative w-64 h-64 mb-8 transition-all duration-500 ${active ? 'scale-100' : 'scale-90 opacity-70'}`}>
             <div className={`absolute inset-0 bg-brand-400 rounded-full blur-xl opacity-30 transition-all duration-200 ${status === 'connected' ? 'animate-pulse' : ''}`} style={{ transform: `scale(${1 + volume})`}}></div>
             <div className="w-full h-full bg-white rounded-full border-8 border-brand-100 shadow-2xl flex items-center justify-center overflow-hidden relative">
                 <img src="https://picsum.photos/seed/buddy/400/400" alt="Tutor" className="w-full h-full object-cover opacity-90" />
                 {status === 'connecting' && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                     </div>
                 )}
             </div>
             {/* Status Badge */}
             <div className={`absolute bottom-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-md ${status === 'connected' ? 'bg-accent-green' : status === 'connecting' ? 'bg-accent-yellow' : 'bg-slate-400'}`}>
                 {status === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                 {status === 'connected' ? 'Online' : status === 'connecting' ? 'Connecting...' : 'Offline'}
             </div>
        </div>

        <div className="text-center space-y-2 mb-10 h-16">
            <p className="text-xl font-bold text-slate-700 animate-fade-in">{transcript}</p>
        </div>

        {/* Controls */}
        <button 
            onClick={toggleSession}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${active ? 'bg-accent-red hover:bg-red-600 shadow-red-200' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-200'}`}
        >
            {active ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
        </button>
        <p className="mt-4 text-slate-400 font-bold text-sm uppercase tracking-wider">
            {active ? 'Tap to End Call' : 'Tap to Call Tutor'}
        </p>
      </div>
    </div>
  );
};
