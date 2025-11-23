import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { generateCorrection } from '../services/geminiService';
import { ChatMessage } from '../types';

export const SmartChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: "Hi! I'm your English Buddy. Tell me about your day! If you make a mistake, I'll help you fix it." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = { id: userMsgId, role: 'user', text: inputText };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await generateCorrection(inputText);
      
      // Add correction feedback if necessary
      if (result.original && result.corrected && result.original.toLowerCase().trim() !== result.corrected.toLowerCase().trim()) {
         const correctionMsg: ChatMessage = {
             id: userMsgId + '_corr',
             role: 'model',
             text: "Let's polish that!",
             correction: {
                 original: result.original,
                 corrected: result.corrected,
                 explanation: result.explanation
             }
         };
         setMessages(prev => [...prev, correctionMsg]);
      }

      // Add Model Reply
      const replyMsg: ChatMessage = {
          id: Date.now().toString() + '_reply',
          role: 'model',
          text: result.reply || "That's interesting!"
      };
      setMessages(prev => [...prev, replyMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Oops, my brain froze. Try saying that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
        <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Smart Chat</h2>
            <p className="text-sm text-slate-500">I correct your grammar instantly!</p>
        </div>
        <div className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold">
            Gemini Powered
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Main Message Bubble */}
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-lg leading-relaxed relative ${
                msg.role === 'user' 
                ? 'bg-brand-500 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none'
            }`}>
               {msg.text}
            </div>

            {/* Correction Card (Only for model correction messages) */}
            {msg.correction && (
                <div className="mt-2 w-full max-w-md bg-white border-2 border-accent-yellow/30 rounded-xl p-3 shadow-lg transform translate-x-2">
                    <div className="flex items-center gap-2 mb-2 text-accent-yellow font-bold text-sm uppercase">
                        <Sparkles className="w-4 h-4" />
                        <span>Better Way To Say It</span>
                    </div>
                    <div className="text-slate-400 line-through text-sm mb-1">{msg.correction.original}</div>
                    <div className="text-accent-green font-bold text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {msg.correction.corrected}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold">Why?</span> {msg.correction.explanation}
                    </div>
                </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm ml-4">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-200"></div>
                Thinking...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 p-4 pb-20 md:pb-4">
        <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 transition-all">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type anything (even in your language)..."
                className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 px-2"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !inputText.trim()}
                className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};
