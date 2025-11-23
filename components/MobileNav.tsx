import React from 'react';
import { AppRoute } from '../types';
import { Home, Mic, MessageCircle, Gamepad2, BarChart2, GraduationCap, Headphones, Book } from 'lucide-react';

interface MobileNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, onNavigate }) => {
    const navItems = [
        { id: AppRoute.HOME, icon: Home },
        { id: AppRoute.TUTOR, icon: Mic },
        { id: AppRoute.READING, icon: Book },
        { id: AppRoute.STORY, icon: Headphones },
        { id: AppRoute.CHAT, icon: MessageCircle },
        { id: AppRoute.GRAMMAR, icon: GraduationCap },
        { id: AppRoute.GAMES, icon: Gamepad2 },
      ];
    
      return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 pb-6 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`p-2 rounded-xl transition-all ${
                        currentRoute === item.id 
                        ? 'bg-brand-50 text-brand-500 scale-110' 
                        : 'text-slate-400'
                    }`}
                >
                    <item.icon className="w-6 h-6" />
                </button>
            ))}
        </div>
      );
};