import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Edit2, Trash2, Clock, X } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  type: 'personal' | 'shared';
  color: string;
  user_id: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  personal: 'Personal',
  shared: 'Shared',
};

const colorOptions = [
  { value: '#2B3A55', label: 'Brand' },
  { value: '#2A7F7B', label: 'Teal' },
  { value: '#C49A3A', label: 'Ochre' },
  { value: '#8E7A8A', label: 'Mauve' },
  { value: '#2E7D32', label: 'Green' },
  { value: '#9B2C2C', label: 'Red' },
];

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'personal' as Event['type'],
    color: '#2B3A55',
  });

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({
            title: formData.title,
            description: formData.description || null,
            date: formData.date,
            time: formData.time || null,
            type: formData.type,
            color: formData.color,
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{
            title: formData.title,
            description: formData.description || null,
            date: formData.date,
            time: formData.time || null,
            type: formData.type,
            color: formData.color,
            user_id: user.id,
          }]);

        if (error) throw error;
      }

      setFormData({ title: '', description: '', date: '', time: '', type: 'personal', color: '#2B3A55' });
      setShowForm(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      type: event.type,
      color: event.color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const getFilteredEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return events.filter(e => e.date === today);
      case 'upcoming':
        return events.filter(e => e.date > today);
      case 'past':
        return events.filter(e => e.date < today);
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate hover:text-brand-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Events</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-slate">Plan and track your special events</p>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 border border-quiet-border rounded-lg text-sm"
            >
              <option value="all">All Events</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <button
              data-testid="new-event-button"
              onClick={() => {
                setEditingEvent(null);
                setFormData({ title: '', description: '', date: '', time: '', type: 'personal', color: '#2B3A55' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-mauve-500 text-white px-4 py-2 rounded-lg hover:bg-mauve-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Event
            </button>
          </div>
        </div>

        {/* Event Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-mauve-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-mauve-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-mauve-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-mauve-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-mauve-500 focus:border-transparent"
                  >
                    <option value="personal">Personal</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 ${formData.color === color.value ? 'border-ink' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 px-4 border border-quiet-border text-ink rounded-lg hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-mauve-500 text-white rounded-lg hover:bg-mauve-600 transition-colors"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mauve-500"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-quiet-border mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">No events yet</h3>
            <p className="text-slate mb-4">Create your first event to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-mauve-500 text-white px-6 py-2 rounded-lg hover:bg-mauve-600 transition-colors"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isToday = event.date === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={event.id}
                  data-testid={`event-${event.id}`}
                  className="bg-surface rounded-xl shadow-md p-4 flex items-start gap-4"
                >
                  <div
                    className="w-2 h-full min-h-[60px] rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-ink">{event.title}</h3>
                          {isToday && (
                            <span className="px-2 py-0.5 bg-ochre-100 text-ochre-700 text-xs rounded-full font-medium">
                              Today
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-slate text-sm mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${event.type === 'shared' ? 'bg-teal-100 text-teal-700' : 'bg-brand-100 text-brand-700'}`}>
                            {typeLabels[event.type]}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-1 hover:bg-background text-slate rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1 hover:bg-error-50 text-slate hover:text-error-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
