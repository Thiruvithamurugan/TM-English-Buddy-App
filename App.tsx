import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { MobileNav } from './components/MobileNav';
import { AppRoute, UserState } from './types';
import { Dashboard } from './components/Dashboard';
import { LiveTutor } from './components/LiveTutor';
import { SmartChat } from './components/SmartChat';
import { GameArena } from './components/GameArena';
import { GrammarZone } from './components/GrammarZone';
import { StoryTime } from './components/StoryTime';
import { Parents } from './components/Parents';
import { ReadingRoom } from './components/ReadingRoom';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [user, setUser] = useState<UserState>({
    name: 'Student',
    level: 2,
    xp: 450,
    streak: 5,
    badges: [],
    stats: {
        storiesRead: 12,
        quizzesTaken: 8,
        grammarMastered: 45,
        wordsLearned: 150,
        readingTimeMinutes: 5
    },
    tutorFeedback: ["Practiced correct pronunciation of 'th' sounds.", "Great energy when reading stories!"],
    recentActivity: []
  });

  const addXP = (amount: number, description: string = "Completed Activity") => {
    setUser(prev => {
        const now = new Date();
        const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        
        const newActivity = {
            id: Date.now().toString(),
            type: 'XP',
            description: description,
            time: timeString,
            xp: amount
        };
        
        // Update specific stats based on description keywords
        const newStats = { ...prev.stats };
        if (description.includes("Story")) newStats.storiesRead += 1;
        if (description.includes("Quiz") || description.includes("Trivia")) newStats.quizzesTaken += 1;
        if (description.includes("Grammar")) newStats.grammarMastered += 5;
        if (description.includes("Word")) newStats.wordsLearned += 1;

        return { 
            ...prev, 
            xp: prev.xp + amount,
            stats: newStats,
            recentActivity: [...prev.recentActivity, newActivity]
        };
    });
  };

  const updateReadingTime = (minutes: number) => {
      setUser(prev => ({
          ...prev,
          stats: {
              ...prev.stats,
              readingTimeMinutes: prev.stats.readingTimeMinutes + minutes
          },
          recentActivity: [...prev.recentActivity, {
              id: Date.now().toString(),
              type: 'READING',
              description: `Read for ${minutes} minutes`,
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              xp: minutes * 5
          }]
      }));
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <Dashboard user={user} />;
      case AppRoute.TUTOR:
        return <LiveTutor />;
      case AppRoute.READING:
        return <ReadingRoom addXP={addXP} updateReadingTime={updateReadingTime} />;
      case AppRoute.STORY:
        return <StoryTime addXP={addXP} />;
      case AppRoute.CHAT:
        return <SmartChat />;
      case AppRoute.GRAMMAR:
        return <GrammarZone addXP={addXP} />;
      case AppRoute.GAMES:
        return <GameArena addXP={addXP} />;
      case AppRoute.PARENTS:
        return <Parents user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-50 font-sans text-slate-800">
      <Navigation currentRoute={currentRoute} onNavigate={setCurrentRoute} />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>

      <MobileNav currentRoute={currentRoute} onNavigate={setCurrentRoute} />
    </div>
  );
};

export default App;