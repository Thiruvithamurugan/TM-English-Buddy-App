import React from 'react';
import { AppRoute } from '../types';
import { Home, Mic, MessageCircle, Gamepad2, BarChart2, BookOpen, GraduationCap, Headphones, Book } from 'lucide-react';

interface NavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: AppRoute.HOME, label: 'Dashboard', icon: Home, color: 'text-blue-500' },
    { id: AppRoute.TUTOR, label: 'AI Tutor', icon: Mic, color: 'text-accent-purple' },
    { id: AppRoute.READING, label: 'Reading Room', icon: Book, color: 'text-orange-500' },
    { id: AppRoute.STORY, label: 'Story Time', icon: Headphones, color: 'text-pink-500' },
    { id: AppRoute.CHAT, label: 'Smart Chat', icon: MessageCircle, color: 'text-accent-green' },
    { id: AppRoute.GRAMMAR, label: 'Grammar Dojo', icon: GraduationCap, color: 'text-accent-red' },
    { id: AppRoute.GAMES, label: 'Playground', icon: Gamepad2, color: 'text-accent-yellow' },
    { id: AppRoute.PARENTS, label: 'Parents', icon: BarChart2, color: 'text-slate-500' },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 bg-white h-screen border-r border-slate-200 p-4 sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
          <BookOpen className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          English<span className="text-brand-500">Buddy</span>
        </h1>
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-bold ${
              currentRoute === item.id
                ? 'bg-brand-50 text-brand-600 shadow-sm translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentRoute === item.id ? item.color : 'text-current'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
        <p className="text-sm font-bold text-brand-600 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI Connected
        </p>
      </div>
    </nav>
  );
};