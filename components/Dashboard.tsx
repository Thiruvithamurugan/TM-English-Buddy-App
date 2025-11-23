import React from 'react';
import { UserState } from '../types';
import { Flame, Target, Award, Clock, Activity, Book } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: UserState;
}

const data = [
  { name: 'Mon', xp: 40 },
  { name: 'Tue', xp: 30 },
  { name: 'Wed', xp: 60 },
  { name: 'Thu', xp: 45 },
  { name: 'Fri', xp: 80 },
  { name: 'Sat', xp: 55 },
  { name: 'Sun', xp: 75 },
];

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="p-6 md:p-10 space-y-8 overflow-y-auto h-full pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Hello, {user.name}! 👋</h2>
          <p className="text-slate-500 font-medium mt-1">Ready to learn some English today?</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold">
          <Flame className="w-5 h-5 fill-current" />
          <span>{user.streak} Day Streak!</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Target className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{user.level}</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Level</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                <Award className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{user.xp}</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total XP</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-8">
             <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Book className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{user.stats.readingTimeMinutes}m</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reading Time</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-8">
             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{user.stats.quizzesTaken}</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quizzes Ace'd</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* Progress Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Your Learning Curve</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                            cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                        />
                        <Area type="monotone" dataKey="xp" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Live Activity Feed</h3>
            <div className="flex-1 overflow-y-auto space-y-4 max-h-64 pr-2 custom-scrollbar">
                {user.recentActivity.length === 0 ? (
                    <div className="text-center text-slate-400 mt-10">
                        <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Start learning to see your stats here!</p>
                    </div>
                ) : (
                    user.recentActivity.slice().reverse().map(act => (
                        <div key={act.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{act.description}</p>
                                <p className="text-xs text-slate-400">{act.time} • +{act.xp} XP</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
      </div>
    </div>
  );
};