import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Plus, Edit2, Trash2, Check, X, Calendar } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: 'home' | 'work' | 'personal' | 'shared';
  assigned_to: string | null;
  due_date: string | null;
  completed: boolean;
  created_by: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  home: 'Home',
  work: 'Work',
  personal: 'Personal',
  shared: 'Shared',
};

const categoryColors: Record<string, string> = {
  home: 'bg-brand-100 text-brand-700',
  work: 'bg-teal-100 text-teal-700',
  personal: 'bg-mauve-100 text-mauve-700',
  shared: 'bg-ochre-100 text-ochre-700',
};

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'shared' as Task['category'],
    due_date: '',
  });

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            due_date: formData.due_date || null,
          })
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            due_date: formData.due_date || null,
            created_by: user.id,
          }]);

        if (error) throw error;
      }

      setFormData({ title: '', description: '', category: 'shared', due_date: '' });
      setShowForm(false);
      setEditingTask(null);
      await loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      due_date: task.due_date || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'pending':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate hover:text-brand-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Tasks</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-slate">Manage your shared tasks</p>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 border border-quiet-border rounded-lg text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <button
              data-testid="new-task-button"
              onClick={() => {
                setEditingTask(null);
                setFormData({ title: '', description: '', category: 'shared', due_date: '' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-success-500 text-white px-4 py-2 rounded-lg hover:bg-success-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Task Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink">
                  {editingTask ? 'Edit Task' : 'New Task'}
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
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Task['category'] })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
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
                    className="flex-1 py-2 px-4 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                  >
                    {editingTask ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success-500"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-md p-12 text-center">
            <CheckSquare className="w-16 h-16 text-quiet-border mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">No tasks yet</h3>
            <p className="text-slate mb-4">Create your first task to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-success-500 text-white px-6 py-2 rounded-lg hover:bg-success-600 transition-colors"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                data-testid={`task-${task.id}`}
                className={`bg-surface rounded-xl shadow-md p-4 flex items-start gap-4 ${task.completed ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => toggleComplete(task)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-success-500 border-success-500 text-white'
                      : 'border-quiet-border hover:border-success-500'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-slate' : 'text-ink'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-slate mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[task.category]}`}>
                          {categoryLabels[task.category]}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-xs text-slate">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-1 hover:bg-background text-slate rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1 hover:bg-error-50 text-slate hover:text-error-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
