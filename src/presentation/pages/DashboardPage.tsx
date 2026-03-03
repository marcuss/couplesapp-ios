import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Target, Wallet, Calendar, CheckSquare, User, Heart, ArrowRight, Plane, Clock } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  color: string;
}

export const DashboardPage: React.FC = () => {
  const { user, partner } = useAuth();
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const menuItems = [
    { icon: Target, label: 'Goals', href: '/goals', color: 'bg-brand-500' },
    { icon: Wallet, label: 'Budgets', href: '/budgets', color: 'bg-teal-500' },
    { icon: Calendar, label: 'Events', href: '/events', color: 'bg-mauve-500' },
    { icon: Plane, label: 'Travel', href: '/travels', color: 'bg-ochre-500' },
    { icon: CheckSquare, label: 'Tasks', href: '/tasks', color: 'bg-success-500' },
  ];

  useEffect(() => {
    loadTodaysEvents();
  }, [user]);

  const loadTodaysEvents = async () => {
    if (!user) return;
    
    try {
      setLoadingEvents(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, date, time, color')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('time', { ascending: true });

      if (error) throw error;
      setTodaysEvents(data || []);
    } catch (err) {
      console.error('Error loading today\'s events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-brand-500" />
            <h1 className="text-2xl font-bold text-ink">CouplePlan</h1>
          </div>
          <Link
            data-testid="profile-link"
            to="/profile"
            className="flex items-center gap-2 text-slate hover:text-brand-500 transition-colors"
          >
            <User className="w-6 h-6" />
            <span className="hidden sm:inline">{user?.name || user?.email}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 data-testid="dashboard-title" className="text-3xl font-bold text-ink mb-2">
            Dashboard
          </h2>
          <p className="text-slate">
            Welcome back, {user?.name || user?.email}!
            {partner && (
              <span className="ml-2 inline-flex items-center gap-1 text-teal-600">
                <Heart className="w-4 h-4" />
                Connected with {partner.name || partner.email}
              </span>
            )}
          </p>
        </div>

        {/* Today's Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-ochre-500" />
              Today's Events
            </h3>
            <Link to="/events" className="text-sm text-brand-500 hover:text-brand-600">
              View All
            </Link>
          </div>
          
          {loadingEvents ? (
            <div className="flex items-center justify-center py-8 bg-surface rounded-xl shadow-md">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
            </div>
          ) : todaysEvents.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-md p-6 text-center">
              <Calendar className="w-10 h-10 text-quiet-border mx-auto mb-2" />
              <p className="text-slate">No events scheduled for today</p>
              <Link to="/events" className="text-brand-500 hover:text-brand-600 text-sm mt-2 inline-block">
                Add an event
              </Link>
            </div>
          ) : (
            <div className="bg-surface rounded-xl shadow-md overflow-hidden">
              {todaysEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-4 ${index !== todaysEvents.length - 1 ? 'border-b border-quiet-border' : ''}`}
                >
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-slate">{event.description}</p>
                    )}
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-1 text-sm text-slate">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              data-testid={`${item.label.toLowerCase()}-link`}
              to={item.href}
              className="group bg-surface rounded-xl shadow-md hover:shadow-lg transition-all p-5"
            >
              <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">
                  {item.label}
                </h3>
                <ArrowRight className="w-4 h-4 text-slate group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Partner Connection CTA */}
        {!partner && (
          <div className="bg-gradient-brand rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect with Your Partner</h3>
                <p className="text-white/80">
                  Invite your partner to start planning goals, budgets, and events together.
                </p>
              </div>
              <Link
                to="/invite"
                className="bg-white text-brand-500 px-6 py-3 rounded-lg font-medium hover:bg-brand-50 transition-colors whitespace-nowrap"
              >
                Invite Partner
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
