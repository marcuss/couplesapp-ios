import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plane, Plus, Edit2, Trash2, Calendar, MapPin, DollarSign, X } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Travel {
  id: string;
  destination: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_budget: number | null;
  status: 'planning' | 'booked' | 'completed';
  created_by: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  booked: 'Booked',
  completed: 'Completed',
};

const statusColors: Record<string, string> = {
  planning: 'bg-brand-100 text-brand-700',
  booked: 'bg-teal-100 text-teal-700',
  completed: 'bg-success-100 text-success-700',
};

export const TravelsPage: React.FC = () => {
  const { user } = useAuth();
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [formData, setFormData] = useState({
    destination: '',
    description: '',
    start_date: '',
    end_date: '',
    estimated_budget: '',
    status: 'planning' as Travel['status'],
  });

  useEffect(() => {
    loadTravels();
  }, [user]);

  const loadTravels = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('travels')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTravels(data || []);
    } catch (err) {
      console.error('Error loading travels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTravel) {
        const { error } = await supabase
          .from('travels')
          .update({
            destination: formData.destination,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
            status: formData.status,
          })
          .eq('id', editingTravel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('travels')
          .insert([{
            destination: formData.destination,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
            status: formData.status,
            created_by: user.id,
          }]);

        if (error) throw error;
      }

      setFormData({ destination: '', description: '', start_date: '', end_date: '', estimated_budget: '', status: 'planning' });
      setShowForm(false);
      setEditingTravel(null);
      await loadTravels();
    } catch (err) {
      console.error('Error saving travel:', err);
      alert('Failed to save travel plan');
    }
  };

  const handleEdit = (travel: Travel) => {
    setEditingTravel(travel);
    setFormData({
      destination: travel.destination,
      description: travel.description || '',
      start_date: travel.start_date || '',
      end_date: travel.end_date || '',
      estimated_budget: travel.estimated_budget?.toString() || '',
      status: travel.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this travel plan?')) return;

    try {
      const { error } = await supabase
        .from('travels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTravels();
    } catch (err) {
      console.error('Error deleting travel:', err);
      alert('Failed to delete travel plan');
    }
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Dates not set';
    if (start && !end) return new Date(start).toLocaleDateString();
    if (!start && end) return `Until ${new Date(end).toLocaleDateString()}`;
    return `${new Date(start!).toLocaleDateString()} - ${new Date(end!).toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate hover:text-brand-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Travel Plans</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate">Plan your adventures together</p>
          <button
            data-testid="new-travel-button"
            onClick={() => {
              setEditingTravel(null);
              setFormData({ destination: '', description: '', start_date: '', end_date: '', estimated_budget: '', status: 'planning' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-ochre-500 text-white px-4 py-2 rounded-lg hover:bg-ochre-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </button>
        </div>

        {/* Travel Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink">
                  {editingTravel ? 'Edit Trip' : 'New Trip'}
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
                  <label className="block text-sm font-medium text-ink mb-1">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                      placeholder="e.g., Paris, France"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                    rows={2}
                    placeholder="Notes, plans, ideas..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Estimated Budget</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_budget}
                      onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Travel['status'] })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-ochre-500 focus:border-transparent"
                  >
                    <option value="planning">Planning</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                  </select>
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
                    className="flex-1 py-2 px-4 bg-ochre-500 text-white rounded-lg hover:bg-ochre-600 transition-colors"
                  >
                    {editingTravel ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Travels List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ochre-500"></div>
          </div>
        ) : travels.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-md p-12 text-center">
            <Plane className="w-16 h-16 text-quiet-border mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">No travel plans yet</h3>
            <p className="text-slate mb-4">Start planning your next adventure</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-ochre-500 text-white px-6 py-2 rounded-lg hover:bg-ochre-600 transition-colors"
            >
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travels.map((travel) => (
              <div key={travel.id} className="bg-surface rounded-xl shadow-md overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-ochre-400 to-ochre-500 flex items-center justify-center">
                  <Plane className="w-12 h-12 text-white" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{travel.destination}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[travel.status]}`}>
                        {statusLabels[travel.status]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(travel)}
                        className="p-1 hover:bg-background text-slate rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(travel.id)}
                        className="p-1 hover:bg-error-50 text-slate hover:text-error-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {travel.description && (
                    <p className="text-slate text-sm mb-3 line-clamp-2">{travel.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateRange(travel.start_date, travel.end_date)}</span>
                    </div>
                    
                    {travel.estimated_budget && (
                      <div className="flex items-center gap-2 text-slate">
                        <DollarSign className="w-4 h-4" />
                        <span>Budget: ${travel.estimated_budget.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
