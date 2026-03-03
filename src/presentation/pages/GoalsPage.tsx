import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Plus, Edit2, Trash2, Check, X, Calendar } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: 'travel' | 'financial' | 'personal' | 'home' | 'other';
  target_date: string | null;
  completed: boolean;
  created_by: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  travel: 'Travel',
  financial: 'Financial',
  personal: 'Personal',
  home: 'Home',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  travel: 'bg-teal-100 text-teal-700',
  financial: 'bg-ochre-100 text-ochre-700',
  personal: 'bg-mauve-100 text-mauve-700',
  home: 'bg-brand-100 text-brand-700',
  other: 'bg-slate-100 text-slate-700',
};

export const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as Goal['category'],
    target_date: '',
  });

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            target_date: formData.target_date || null,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([{
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            target_date: formData.target_date || null,
            created_by: user.id,
          }]);

        if (error) throw error;
      }

      setFormData({ title: '', description: '', category: 'personal', target_date: '' });
      setShowForm(false);
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      console.error('Error saving goal:', err);
      alert('Failed to save goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_date: goal.target_date || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal');
    }
  };

  const toggleComplete = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ completed: !goal.completed })
        .eq('id', goal.id);

      if (error) throw error;
      await loadGoals();
    } catch (err) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate hover:text-brand-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Goals</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate">Track and achieve your shared goals</p>
          <button
            data-testid="new-goal-button"
            onClick={() => {
              setEditingGoal(null);
              setFormData({ title: '', description: '', category: 'personal', target_date: '' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </button>
        </div>

        {/* Goal Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink">
                  {editingGoal ? 'Edit Goal' : 'New Goal'}
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
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Goal['category'] })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="travel">Travel</option>
                    <option value="financial">Financial</option>
                    <option value="personal">Personal</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
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
                    className="flex-1 py-2 px-4 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    {editingGoal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-md p-12 text-center">
            <Target className="w-16 h-16 text-quiet-border mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">No goals yet</h3>
            <p className="text-slate mb-4">Create your first goal to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                data-testid={`goal-${goal.id}`}
                className={`bg-surface rounded-xl shadow-md p-6 ${goal.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[goal.category]}`}>
                    {categoryLabels[goal.category]}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleComplete(goal)}
                      className={`p-1 rounded ${goal.completed ? 'bg-success-100 text-success-600' : 'hover:bg-background text-slate'}`}
                      title={goal.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 hover:bg-background text-slate rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 hover:bg-error-50 text-slate hover:text-error-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${goal.completed ? 'line-through text-slate' : 'text-ink'}`}>
                  {goal.title}
                </h3>

                {goal.description && (
                  <p className="text-slate text-sm mb-3">{goal.description}</p>
                )}

                {goal.target_date && (
                  <div className="flex items-center gap-1 text-sm text-slate">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
