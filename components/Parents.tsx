import React from 'react';
import { UserState } from '../types';
import { Award, BarChart2, BookOpen, Brain, Clock, MessageSquare } from 'lucide-react';

interface ParentsProps {
    user: UserState;
}

export const Parents: React.FC<ParentsProps> = ({ user }) => {
    
    // Calculated grades based on mock stats
    const getGrade = (score: number) => {
        if (score > 100) return 'A+';
        if (score > 50) return 'A';
        if (score > 20) return 'B';
        return 'C';
    };

    return (
        <div className="h-full p-6 md:p-10 overflow-y-auto bg-slate-50">
            <header className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-800">Parent Dashboard</h2>
                <p className="text-slate-500">Monitor your child's progress and achievements.</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* REPORT CARD */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-400" /> Report Card
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Student: {user.name}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-yellow-400">Level {user.level}</div>
                            <div className="text-xs text-slate-400 uppercase font-bold">Current Standing</div>
                        </div>
                    </div>

                    <div className="p-8 grid md:grid-cols-2 gap-8">
                        {/* Grades Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">Academic Performance</h4>
                            
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><BookOpen className="w-5 h-5" /></div>
                                    <span className="font-bold text-slate-600">Grammar</span>
                                </div>
                                <span className="font-black text-xl text-green-600">{getGrade(user.stats.grammarMastered)}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-100 p-2 rounded-lg text-pink-600"><Brain className="w-5 h-5" /></div>
                                    <span className="font-bold text-slate-600">Vocabulary</span>
                                </div>
                                <span className="font-black text-xl text-green-600">{getGrade(user.stats.wordsLearned / 2)}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Clock className="w-5 h-5" /></div>
                                    <span className="font-bold text-slate-600">Reading Time</span>
                                </div>
                                <span className="font-black text-xl text-blue-600">{user.stats.readingTimeMinutes > 30 ? 'A' : user.stats.readingTimeMinutes > 15 ? 'B' : 'C'}</span>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">Activity Breakdown</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-slate-800">{user.stats.storiesRead}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Stories Read</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-slate-800">{user.stats.quizzesTaken}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Quizzes Taken</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-slate-800">{user.stats.readingTimeMinutes}m</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Total Reading</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-slate-800">{user.xp}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Total XP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TUTOR FEEDBACK */}
                <div>
                     <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Tutor Feedback & Suggestions
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        {user.tutorFeedback.length === 0 ? (
                            <p className="text-slate-400 italic">No feedback available yet. Encourage your child to complete more reading sessions.</p>
                        ) : (
                            <ul className="space-y-3">
                                {user.tutorFeedback.map((fb, i) => (
                                    <li key={i} className="flex gap-3 items-start bg-blue-50 p-4 rounded-xl text-slate-700">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <span>{fb}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                            <strong>Tip for Parents:</strong> Try asking your child to read the "Story Time" stories aloud to you to reinforce their confidence.
                        </div>
                    </div>
                </div>

                {/* ACTIVITY LOG */}
                <div>
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" /> Recent Activity Log
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                        {user.recentActivity.length === 0 ? (
                            <p className="text-slate-400 text-center italic py-4">No activity recorded yet today.</p>
                        ) : (
                            user.recentActivity.slice().reverse().map((act) => (
                                <div key={act.id} className="flex items-center gap-4 border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {act.time}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800">{act.description}</div>
                                        <div className="text-xs text-slate-400">{act.type}</div>
                                    </div>
                                    <div className="font-bold text-green-500">+{act.xp} XP</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};