/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckSquare, 
  BookOpen, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { cn } from './lib/utils';
import { Task, StudySession, Homework, CalendarEvent } from './types';
import { generateDailyWisdom } from './services/wisdomService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'study' | 'homework'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [wisdom, setWisdom] = useState<string>("Progress is quiet. Consistency is loud.");
  const [isWisdomLoading, setIsWisdomLoading] = useState(false);
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('academia_tasks');
    const savedSessions = localStorage.getItem('academia_sessions');
    const savedHomework = localStorage.getItem('academia_homework');
    const savedEvents = localStorage.getItem('academia_events');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSessions) setStudySessions(JSON.parse(savedSessions));
    if (savedHomework) setHomework(JSON.parse(savedHomework));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('academia_tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('academia_sessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('academia_homework', JSON.stringify(homework));
  }, [homework]);

  useEffect(() => {
    localStorage.setItem('academia_events', JSON.stringify(events));
  }, [events]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySessions = studySessions.filter(s => s.timestamp.startsWith(today));
    const totalTodayStudy = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    
    const pendingHomework = homework.filter(h => h.status !== 'completed').length;
    const completedTasksToday = tasks.filter(t => t.completed && t.dueDate === today).length;
    
    return {
      todayStudyTime: totalTodayStudy,
      pendingHomework,
      completedTasksToday
    };
  }, [studySessions, homework, tasks]);

  const addTask = (task: Task) => setTasks([...tasks, task]);
  const addSession = (session: StudySession) => setStudySessions([...studySessions, session]);
  const addHomework = (hw: Homework) => setHomework([...homework, hw]);

  // Daily Wisdom logic
  useEffect(() => {
    const fetchWisdom = async () => {
      setIsWisdomLoading(true);
      const newWisdom = await generateDailyWisdom(stats);
      setWisdom(newWisdom);
      setIsWisdomLoading(false);
    };

    const lastStatsRef = localStorage.getItem('academia_wisdom_stats_ref');
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('academia_wisdom_date');
    
    // Refresh milestones (25, 50, 75, 100%)
    const progress = Math.min(Math.round((stats.todayStudyTime / 120) * 100), 100);
    const milestone = Math.floor(progress / 25);
    
    if (lastDate !== today || lastStatsRef !== milestone.toString()) {
      fetchWisdom();
      localStorage.setItem('academia_wisdom_stats_ref', milestone.toString());
    } else {
      const cached = localStorage.getItem('academia_daily_wisdom');
      if (cached) setWisdom(cached);
    }
  }, [stats.todayStudyTime, stats.pendingHomework, stats.completedTasksToday]);

  return (
    <div className="flex min-h-screen bg-bg-base text-text-main antialiased selection:bg-accent-soft">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[#D3D0C7] bg-[#FDFCF9] flex flex-col sticky top-0 h-screen p-8">
        <div className="mb-12">
          <h1 className="text-2xl font-bold tracking-[0.1em] italic font-serif uppercase">Scrutinize.</h1>
        </div>
        
        <nav className="flex-1 space-y-6">
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            label="Dashboard"
          />
          <SidebarItem 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            label="Calendar"
          />
          <SidebarItem 
            active={activeTab === 'study'} 
            onClick={() => setActiveTab('study')} 
            label="Study Log"
          />
          <SidebarItem 
            active={activeTab === 'homework'} 
            onClick={() => setActiveTab('homework')} 
            label="Homework"
          />
        </nav>

        <div className="mb-6 bg-accent-soft/20 rounded-sm p-4 border border-[#D3D0C7] relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Daily Goal</p>
            <p className={cn(
              "text-[10px] font-bold transition-colors duration-500",
              stats.todayStudyTime < 24 ? "text-accent-earth font-black" : "opacity-40"
            )}>
              {Math.min(Math.round((stats.todayStudyTime / 120) * 100), 100)}%
            </p>
          </div>
          <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              className={cn(
                "h-full transition-colors duration-1000",
                stats.todayStudyTime < 24 ? "bg-accent-earth/80" : "bg-accent-earth"
              )}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((stats.todayStudyTime / 120) * 100, 100)}%`,
                opacity: stats.todayStudyTime < 24 ? [0.4, 1, 0.4] : 1,
                x: stats.todayStudyTime < 24 ? [-1, 1, -1] : 0
              }}
              transition={{ 
                width: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 0.1, repeat: stats.todayStudyTime < 12 ? Infinity : 0 }
              }}
            />
          </div>
          {stats.todayStudyTime < 24 && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[8px] mt-2 text-accent-earth font-bold uppercase tracking-tight"
            >
              • {stats.todayStudyTime === 0 ? "Begin Focus" : "Keep Going"}
            </motion.p>
          )}
        </div>

        <div className="bg-accent-soft/40 rounded-sm p-4 border border-[#D3D0C7] relative">
          <p className="text-[10px] font-bold uppercase mb-2 opacity-60 tracking-widest flex justify-between items-center">
            Daily Wisdom
            {isWisdomLoading && (
              <motion.span 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 border-b-2 border-accent-deep rounded-full block"
              />
            )}
          </p>
          <AnimatePresence mode="wait">
            <motion.p 
              key={wisdom}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm italic font-serif leading-relaxed"
            >
              "{wisdom}"
            </motion.p>
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView key="dashboard" stats={stats} tasks={tasks} setTasks={setTasks} homework={homework} sessions={studySessions} events={events} />
          )}
          {activeTab === 'calendar' && (
            <CalendarView key="calendar" tasks={tasks} sessions={studySessions} homework={homework} events={events} setEvents={setEvents} />
          )}
          {activeTab === 'study' && (
            <StudyLogView key="study" sessions={studySessions} onAddSession={addSession} />
          )}
          {activeTab === 'homework' && (
            <HomeworkView key="homework" homework={homework} setHomework={setHomework} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 text-sm font-semibold transition-all text-left group",
        active ? "opacity-100" : "opacity-40 hover:opacity-100"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full transition-all",
        active ? "bg-accent-earth scale-125" : "bg-transparent group-hover:bg-accent-soft"
      )} />
      {label}
    </button>
  );
}

// --- VIEW COMPONENTS ---

function DashboardView({ stats, tasks, setTasks, homework, sessions, events }: any) {
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e: any) => parseISO(e.date) >= today)
      .sort((a: any, b: any) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 3);
  }, [events]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      <header className="flex justify-between items-end border-b border-black/[0.03] pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-50 mb-2">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h2 className="text-5xl font-serif tracking-tight text-text-main">Welcome back.</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1.5">Daily Intensity</p>
          <p className="text-2xl font-bold font-serif text-accent-deep">
            {stats.todayStudyTime / 60 >= 1 ? `${Math.floor(stats.todayStudyTime / 60)}h ` : ""}{stats.todayStudyTime % 60}m 
            <span className="text-sm font-normal opacity-40 ml-1 font-sans">logged</span>
          </p>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Study Progress" 
          value={`${stats.todayStudyTime}m`} 
          subValue="Active focus time"
        />
        <StatCard 
          label="Assignments" 
          value={stats.pendingHomework} 
          subValue="Items in the queue"
        />
        <StatCard 
          label="Completion" 
          value={stats.completedTasksToday} 
          subValue="Daily goals hit"
        />
        <div className="card-natural flex flex-col justify-center px-6 border-b-2 border-transparent hover:border-accent-earth/10 transition-all">
          <div className="flex justify-between items-center mb-3">
             <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Progress Bar</p>
             <p className={cn(
               "text-xs font-bold transition-colors",
               stats.todayStudyTime < 24 ? "text-accent-earth" : "text-accent-deep"
             )}>{Math.min(Math.round((stats.todayStudyTime / 120) * 100), 100)}%</p>
          </div>
          <div className="h-6 bg-bg-base rounded-lg border border-black/[0.03] overflow-hidden p-1 relative">
             <motion.div 
               className={cn(
                 "h-full rounded-sm transition-colors",
                 stats.todayStudyTime < 24 ? "bg-accent-earth/80 shadow-[0_0_10px_rgba(217,125,84,0.3)]" : "bg-accent-earth"
               )}
               initial={{ width: 0 }}
               animate={{ 
                 width: `${Math.min((stats.todayStudyTime / 120) * 100, 100)}%`,
                 opacity: stats.todayStudyTime < 24 ? [0.7, 1, 0.7] : 1,
               }}
               transition={{ 
                 width: { duration: 1, ease: "anticipate" },
                 opacity: { duration: 2, repeat: Infinity }
               }}
             />
             {stats.todayStudyTime < 12 && (
               <motion.div 
                 animate={{ left: ["0%", "100%", "0%"] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="absolute top-0 bottom-0 w-8 bg-white/20 blur-md pointer-events-none"
               />
             )}
          </div>
          <p className="text-[9px] mt-3 opacity-30 italic text-center">Daily 2h Goal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* The Queue (Tasks) */}
        <section className="card-natural lg:col-span-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl">The Queue 
              <span className="text-xs font-normal opacity-40 ml-3 font-sans uppercase tracking-[0.2em]">Daily Priorities</span>
            </h3>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Quick add task..." 
              onKeyDown={(e: any) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newTask: Task = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: e.target.value.trim(),
                    completed: false,
                    category: 'other',
                    dueDate: format(new Date(), 'yyyy-MM-dd'),
                    priority: 'medium'
                  };
                  setTasks((prev: Task[]) => [...prev, newTask]);
                  e.target.value = '';
                }
              }}
              className="flex-1 px-5 py-3 bg-bg-base/50 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-1 focus:ring-accent-deep/10 transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            {/* Filter homework and tasks for today */}
            {(() => {
              const today = format(new Date(), 'yyyy-MM-dd');
              const todayTasks = tasks.filter((t: any) => t.dueDate === today);
              const todayHw = homework.filter((h: any) => h.dueDate === today);
              
              if (todayTasks.length === 0 && todayHw.length === 0) {
                return <p className="text-text-main/40 text-center py-12 text-sm italic serif">Your daily queue is clear.</p>;
              }

              return (
                <>
                  {todayHw.map((hw: any) => (
                    <div key={hw.id} className="flex items-center gap-4 py-3 border-b border-bg-base last:border-0 group opacity-80">
                      <div className="w-4 h-4 rounded-full border-2 border-accent-earth bg-accent-earth/10 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent-earth" />
                      </div>
                      <span className="text-sm flex-1 font-bold font-serif text-text-main">
                        [HW] {hw.assignment}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-accent-soft text-accent-deep">
                        {hw.subject}
                      </span>
                    </div>
                  ))}
                  {todayTasks.map((task: Task) => (
                    <motion.div 
                      key={task.id} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 py-3 border-b border-bg-base last:border-0 group"
                    >
                      <div 
                        onClick={() => {
                          setTasks((prev: Task[]) => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                        }}
                        className={cn(
                          "w-4 h-4 rounded-full border-2 border-accent-soft cursor-pointer flex items-center justify-center transition-all",
                          task.completed ? "bg-accent-deep border-accent-deep" : "bg-transparent hover:border-accent-deep/40"
                        )}
                      >
                        <AnimatePresence>
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 45 }}
                            >
                              <CheckSquare className="w-2.5 h-2.5 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className={cn(
                        "text-sm flex-1 font-medium transition-all font-sans", 
                        task.completed ? "opacity-30 line-through" : "opacity-90"
                      )}>
                        {task.title}
                      </span>
                      {!task.completed && (
                        <motion.div
                          animate={{ 
                            scale: task.priority === 'high' ? [1, 1.2, 1] : 1,
                            backgroundColor: task.priority === 'high' ? '#D97D54' : '#E2E8D5'
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'high' ? "shadow-[0_0_8px_rgba(217,125,84,0.5)]" : "opacity-40"
                          )}
                        />
                      )}
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                        task.priority === 'high' ? "bg-accent-earth text-white" : 
                        "bg-accent-soft text-accent-deep"
                      )}>
                        {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </>
              );
            })()}
          </div>
        </section>

        {/* Reality Check */}
        <section className="card-natural lg:col-span-3">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl">Analytics</h3>
            <p className="text-[10px] font-bold bg-accent-soft px-3 py-1 rounded-full uppercase tracking-widest text-accent-deep opacity-80">Reality Check</p>
          </div>
          
          <div className="space-y-10">
            <div className="h-32 flex items-end gap-3 px-4">
              <div className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className="w-full bg-accent-soft rounded-t-xl transition-all duration-700 shadow-sm" 
                  style={{ height: `${Math.min((stats.todayStudyTime / 300) * 100, 100)}%` }}
                />
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Effort</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className="w-full bg-accent-deep rounded-t-xl transition-all duration-700 shadow-sm" 
                  style={{ height: `${Math.min(((stats.pendingHomework + tasks.filter((t: any) => !t.completed).length) / 10) * 100, 100)}%` }}
                />
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Load</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F9F7F2] p-5 rounded-sm border border-[#D3D0C7]">
                <p className="text-2xl font-bold font-serif text-text-main">{Math.round((stats.todayStudyTime / 120) * 100)}%</p>
                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Focus Score</p>
              </div>
              <div className="bg-[#F9F7F2] p-5 rounded-sm border border-[#D3D0C7]">
                <p className="text-2xl font-bold font-serif text-text-main">{Math.max(120 - stats.todayStudyTime, 0)}m</p>
                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Goal Delta</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Upcoming Events */}
      <section className="card-natural">
        <h3 className="text-xl mb-6">Important Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.length === 0 && (
            <div className="col-span-3 py-8 text-center opacity-30 italic text-sm">No upcoming events scheduled. Click on any date in the Calendar to add one.</div>
          )}
          {upcomingEvents.map((event: any) => (
            <div key={event.id} className="bg-[#FDFCF9] p-6 rounded-sm border border-[#D3D0C7] hover:bg-white transition-all cursor-default shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "text-[8px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest border border-black/5 shadow-sm",
                  event.category === 'exam' ? "bg-accent-earth text-white" : "bg-accent-soft text-accent-deep"
                )}>
                  {event.category}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{format(parseISO(event.date), 'MMM d')}</span>
              </div>
              <h4 className="font-bold text-lg font-serif text-text-main line-clamp-1">{event.title}</h4>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function StatCard({ label, value, subValue }: { label: string, value: string | number, subValue: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card-natural flex flex-col items-center text-center py-10 group hover:shadow-lg transition-all border-transparent hover:border-black/5"
    >
      <p className="text-[10px] font-bold text-text-main opacity-30 uppercase tracking-[0.25em] mb-4 group-hover:opacity-50 transition-opacity">{label}</p>
      <motion.p 
        key={value}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.9 }}
        className="text-5xl font-bold font-serif text-accent-deep mb-3"
      >
        {value}
      </motion.p>
      <p className="text-xs italic text-text-main/40 font-serif">{subValue}</p>
    </motion.div>
  );
}

function StudyLogView({ sessions, onAddSession }: any) {
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState('25');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <header>
        <h2 className="text-4xl mb-3 text-text-main">Focus Session</h2>
        <p className="text-text-main/40 italic font-serif">Deep work tracking and effort logs.</p>
      </header>

      <div className="card-natural p-12">
        <h3 className="text-xl mb-10">Log Individual Session</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Subject Area</label>
                <input 
                  type="text" 
                  placeholder="e.g. Organic Chemistry" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#D3D0C7] rounded-sm focus:bg-white transition-all font-sans text-sm font-medium outline-none"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#D3D0C7] rounded-sm focus:bg-white transition-all font-sans text-sm font-medium outline-none"
                />
              </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            if (subject.trim() && parseInt(minutes) > 0) {
              onAddSession({
                id: Math.random().toString(36).substr(2, 9),
                subject: subject.trim(),
                durationMinutes: parseInt(minutes),
                timestamp: new Date().toISOString()
              });
              setSubject('');
            } else {
              alert('Please enter a valid subject and duration greater than 0.');
            }
          }}
          className="mt-12 w-full bg-accent-deep text-white font-bold py-6 rounded-sm hover:bg-accent-deep/95 transition-all uppercase text-xs tracking-[0.4em] shadow-md border border-accent-deep"
        >
          Track Session
        </motion.button>
      </div>

      <div className="space-y-8">
        <h3 className="text-xl px-2 opacity-80">History</h3>
        <div className="space-y-4">
          {sessions.length === 0 && <p className="text-text-main/30 text-sm italic serif px-2">No focus sessions recorded yet.</p>}
          {sessions.slice().reverse().map((session: any) => (
            <div key={session.id} className="bg-[#FDFCF9] px-10 py-6 rounded-sm border border-[#D3D0C7] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-full bg-accent-soft/30 flex items-center justify-center border border-[#D3D0C7] group-hover:bg-accent-soft/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-accent-earth" />
                </div>
                <div>
                  <p className="font-bold text-text-main text-sm uppercase tracking-[0.15em]">{session.subject}</p>
                  <p className="text-[10px] text-text-main/40 font-bold uppercase tracking-widest mt-1.5">{format(parseISO(session.timestamp), 'MMM d, h:mm a')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-serif text-accent-earth">{session.durationMinutes}m</p>
                <p className="text-[9px] text-text-main/30 font-bold uppercase tracking-widest mt-1">Session</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HomeworkView({ homework, setHomework }: any) {
  const [hwSubject, setHwSubject] = useState('');
  const [hwAssignment, setHwAssignment] = useState('');
  const [hwDate, setHwDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  const addHw = () => {
    if (hwSubject && hwAssignment) {
      const newHw: Homework = {
        id: Math.random().toString(36).substr(2, 9),
        subject: hwSubject,
        assignment: hwAssignment,
        dueDate: hwDate,
        status: 'pending'
      };
      setHomework([...homework, newHw]);
      setHwSubject('');
      setHwAssignment('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12"
    >
      <div className="lg:col-span-4 space-y-10">
        <header>
          <h2 className="text-4xl mb-3 text-text-main">Assignments</h2>
          <p className="text-text-main/40 italic font-serif">Maintain your academic trajectory.</p>
        </header>

        <div className="card-natural p-10 space-y-8">
          <h3 className="text-lg opacity-80">New Item</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Subject</label>
              <input 
                type="text" 
                placeholder="Subject area" 
                value={hwSubject}
                onChange={(e) => setHwSubject(e.target.value)}
                className="w-full px-6 py-4 bg-bg-base/80 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-1 focus:ring-accent-deep/10 transition-all font-sans"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Assignment</label>
              <input 
                type="text" 
                placeholder="Description" 
                value={hwAssignment}
                onChange={(e) => setHwAssignment(e.target.value)}
                className="w-full px-6 py-4 bg-bg-base/80 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-1 focus:ring-accent-deep/10 transition-all font-sans"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Deadline</label>
              <input 
                type="date" 
                value={hwDate}
                onChange={(e) => setHwDate(e.target.value)}
                className="w-full px-6 py-4 bg-bg-base/80 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-1 focus:ring-accent-deep/10 transition-all font-sans"
              />
            </div>
            <button 
              onClick={addHw}
              className="w-full bg-accent-deep text-white font-bold py-5 rounded-2xl hover:bg-accent-deep/95 transition-all uppercase text-[11px] tracking-[0.25em] mt-6 shadow-lg shadow-accent-deep/10"
            >
              Add to Queue
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <div className="flex gap-8 mb-2 border-b border-black/[0.03] pb-1">
          {['Pending', 'Completed'].map(f => (
            <button key={f} className="text-[10px] font-bold text-text-main/40 uppercase tracking-[0.25em] px-1 py-4 hover:text-accent-deep transition-all relative group">
              {f}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-deep group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>
        
        {homework.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
             <BookOpen className="w-12 h-12 mb-4" />
             <p className="italic font-serif">No assignments recorded.</p>
          </div>
        )}
        
        <div className="grid gap-5">
          {homework.slice().sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((hw: any) => (
            <div key={hw.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-[32px] border border-black/[0.03] flex items-center justify-between group hover:border-black/5 hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-8">
                <div onClick={() => {
                  setHomework((prev: any) => prev.map((h: any) => h.id === hw.id ? { ...h, status: h.status === 'completed' ? 'pending' : 'completed' } : h));
                }} className={cn(
                  "w-6 h-6 rounded-full border-2 border-accent-soft cursor-pointer flex items-center justify-center transition-all overflow-hidden",
                  hw.status === 'completed' ? "bg-accent-deep border-accent-deep shadow-lg shadow-accent-deep/20" : "bg-transparent hover:border-accent-deep/40"
                )}>
                  <AnimatePresence mode="wait">
                    {hw.status === 'completed' && (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ duration: 0.2, ease: "backOut" }}
                      >
                        <CheckSquare className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <h4 className={cn("text-lg font-bold font-serif text-text-main transition-opacity", hw.status === 'completed' && "opacity-25 line-through")}>{hw.assignment}</h4>
                  <p className="text-[10px] font-bold text-accent-earth uppercase tracking-[0.2em] mt-1.5 opacity-80">{hw.subject}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-text-main/30 uppercase tracking-[0.2em] mb-1.5">Deadline</p>
                <p className={cn(
                  "text-sm font-bold font-serif transition-colors",
                  new Date(hw.dueDate).getTime() < new Date().getTime() && hw.status !== 'completed' ? "text-accent-earth" : "text-text-main/60"
                )}>
                  {format(parseISO(hw.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CalendarView({ tasks, sessions, homework, events, setEvents }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const addEvent = (dateStr: string) => {
    const title = prompt('Event title?');
    if (title && title.trim()) {
      const category = prompt('Category? (exam, meeting, social, deadline, other)') as any;
      const validCategories = ['exam', 'meeting', 'social', 'deadline', 'other'];
      const finalCategory = validCategories.includes(category) ? category : 'other';
      
      const newEvent: CalendarEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        date: dateStr,
        category: finalCategory
      };
      setEvents([...events, newEvent]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl italic serif tracking-tight text-text-main">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-text-main/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Monthly Academic Roadmap</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 bg-white/50 hover:bg-accent-soft/30 rounded-full transition-all border border-black/5 hover:scale-105 active:scale-95 shadow-sm">
            <ChevronLeft className="w-5 h-5 text-text-main/60" />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 bg-white/50 hover:bg-accent-soft/30 rounded-full transition-all border border-black/5 hover:scale-105 active:scale-95 shadow-sm">
            <ChevronRight className="w-5 h-5 text-text-main/60" />
          </button>
        </div>
      </header>

      <div className="card-natural p-0 overflow-hidden border-black/[0.03]">
        <div className="grid grid-cols-7 border-b border-bg-base bg-bg-base/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="py-4 text-[10px] font-bold text-text-main/40 uppercase tracking-[0.25em] text-center border-r border-bg-base/50 last:border-0 italic">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 text-left">
          {days.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const daySessions = sessions.filter((s: any) => s.timestamp.startsWith(dateStr));
            const dayHw = homework.filter((h: any) => h.dueDate === dateStr);
            const dayTasks = tasks.filter((t: any) => t.dueDate === dateStr);
            const dayEvents = events.filter((e: any) => e.date === dateStr);
            
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div 
                key={i} 
                onClick={() => addEvent(dateStr)}
                className={cn(
                  "min-h-[140px] p-5 border-r border-b border-bg-base/50 last:border-r-0 relative transition-all group cursor-pointer",
                  !isCurrentMonth ? "bg-bg-base/10" : "bg-white",
                  "hover:bg-accent-soft/10"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isToday ? "bg-accent-earth text-white shadow-xl shadow-accent-earth/30 scale-110" : 
                    !isCurrentMonth ? "text-text-main/15" : "text-text-main/40"
                  )}>
                    {format(day, "d")}
                  </span>
                  <Plus className="w-3 h-3 opacity-0 group-hover:opacity-20 transition-opacity" />
                </div>
                
                <div className="space-y-1.5">
                  {dayEvents.map((event: any) => (
                    <div key={event.id} className={cn(
                      "text-[8px] font-bold px-2 py-1 rounded-lg truncate uppercase tracking-widest border shadow-sm leading-tight",
                      event.category === 'exam' ? "bg-accent-earth text-white border-accent-earth/20" :
                      event.category === 'meeting' ? "bg-accent-deep text-white border-accent-deep/20" :
                      "bg-accent-soft text-accent-deep border-accent-soft/30"
                    )}>
                       {event.title}
                    </div>
                  ))}
                  {dayHw.slice(0, 2).map((hw: any) => (
                    <div key={hw.id} className="text-[8px] font-bold px-2 py-1 bg-accent-soft/40 text-accent-deep rounded-lg truncate opacity-80 uppercase tracking-widest border border-accent-soft/20 shadow-sm leading-tight">
                       HW: {hw.assignment}
                    </div>
                  ))}
                  {daySessions.length > 0 && (
                    <div className="text-[8px] font-bold px-2 py-1 bg-accent-earth/10 text-accent-earth rounded-lg truncate opacity-90 uppercase tracking-widest border border-accent-earth/10 shadow-sm leading-tight">
                      Effort: {daySessions.reduce((acc: any, c: any) => acc + c.durationMinutes, 0)}m
                    </div>
                  )}
                  {dayTasks.filter((t: any) => !t.completed).map((t: any) => (
                    <div key={t.id} className="text-[8px] font-bold px-2 py-1 bg-bg-base text-text-main/40 rounded-lg truncate opacity-70 uppercase tracking-widest border border-text-main/5 leading-tight">
                      {t.title}
                    </div>
                  ))}
                  {(dayEvents.length + Math.min(dayHw.length, 2) + (daySessions.length > 0 ? 1 : 0) + dayTasks.filter((t: any) => !t.completed).length) > 4 && (
                    <div className="text-[8px] font-black text-text-main/20 text-center mt-2 group-hover:text-text-main/40 transition-colors">
                      +{ (dayEvents.length + dayHw.length + (daySessions.length > 0 ? 1 : 0) + dayTasks.filter((t: any) => !t.completed).length) - 4 } more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

