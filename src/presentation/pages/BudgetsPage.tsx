import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  year: number;
  created_by: string;
  created_at: string;
}

interface Expense {
  id: string;
  budget_id: string;
  description: string;
  amount: number;
  date: string;
}

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    year: new Date().getFullYear(),
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadBudgets();
  }, [user]);

  const loadBudgets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
      
      // Load expenses for each budget
      if (data && data.length > 0) {
        const budgetIds = data.map(b => b.id);
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .in('budget_id', budgetIds);
        
        if (expensesError) throw expensesError;
        
        const expensesByBudget: Record<string, Expense[]> = {};
        expensesData?.forEach(expense => {
          if (!expensesByBudget[expense.budget_id]) {
            expensesByBudget[expense.budget_id] = [];
          }
          expensesByBudget[expense.budget_id].push(expense);
        });
        setExpenses(expensesByBudget);
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category: formData.category,
            amount: parseFloat(formData.amount),
            year: formData.year,
          })
          .eq('id', editingBudget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([{
            category: formData.category,
            amount: parseFloat(formData.amount),
            year: formData.year,
            created_by: user.id,
          }]);

        if (error) throw error;
      }

      setFormData({ category: '', amount: '', year: new Date().getFullYear() });
      setShowForm(false);
      setEditingBudget(null);
      await loadBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
      alert('Failed to save budget');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showExpenses) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          budget_id: showExpenses,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          date: expenseForm.date,
          created_by: user.id,
        }]);

      if (error) throw error;

      // Update budget spent amount
      const budget = budgets.find(b => b.id === showExpenses);
      if (budget) {
        const newSpent = budget.spent + parseFloat(expenseForm.amount);
        await supabase
          .from('budgets')
          .update({ spent: newSpent })
          .eq('id', showExpenses);
      }

      setExpenseForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      await loadBudgets();
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      year: budget.year,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Failed to delete budget');
    }
  };

  const getProgressColor = (spent: number, amount: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 100) return 'bg-error-500';
    if (percentage >= 80) return 'bg-warning-500';
    return 'bg-success-500';
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate hover:text-brand-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Budgets</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate">Manage your shared budgets</p>
          <button
            data-testid="new-budget-button"
            onClick={() => {
              setEditingBudget(null);
              setFormData({ category: '', amount: '', year: new Date().getFullYear() });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Budget
          </button>
        </div>

        {/* Budget Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-ink mb-4">
                {editingBudget ? 'Edit Budget' : 'New Budget'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., Groceries, Rent, Entertainment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Budget Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-quiet-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
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
                    className="flex-1 py-2 px-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    {editingBudget ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses Modal */}
        {showExpenses && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink">
                  {budgets.find(b => b.id === showExpenses)?.category} - Expenses
                </h2>
                <button
                  onClick={() => setShowExpenses(null)}
                  className="text-slate hover:text-ink"
                >
                  ✕
                </button>
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-background rounded-lg">
                <h3 className="text-sm font-medium text-ink mb-3">Add Expense</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="px-3 py-2 border border-quiet-border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="px-3 py-2 border border-quiet-border rounded-lg text-sm"
                    required
                  />
                </div>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="mt-3 w-full px-3 py-2 border border-quiet-border rounded-lg text-sm"
                  required
                />
                <button
                  type="submit"
                  className="mt-3 w-full py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm"
                >
                  Add Expense
                </button>
              </form>

              {/* Expenses List */}
              <div className="space-y-2">
                {expenses[showExpenses]?.length === 0 ? (
                  <p className="text-slate text-center py-4">No expenses yet</p>
                ) : (
                  expenses[showExpenses]?.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium text-ink">{expense.description}</p>
                        <p className="text-sm text-slate">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold text-error-600">-${expense.amount.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Budgets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-md p-12 text-center">
            <Wallet className="w-16 h-16 text-quiet-border mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">No budgets yet</h3>
            <p className="text-slate mb-4">Create your first budget to start tracking</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
              const remaining = budget.amount - budget.spent;
              
              return (
                <div key={budget.id} className="bg-surface rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{budget.category}</h3>
                      <p className="text-sm text-slate">{budget.year}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-1 hover:bg-background text-slate rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1 hover:bg-error-50 text-slate hover:text-error-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-ink">
                        ${budget.amount.toFixed(2)}
                      </span>
                      <span className={`text-sm font-medium ${remaining >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {remaining >= 0 ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            ${remaining.toFixed(2)} left
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            ${Math.abs(remaining).toFixed(2)} over
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-background rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(budget.spent, budget.amount)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate">Spent: ${budget.spent.toFixed(2)}</span>
                      <span className="text-slate">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowExpenses(budget.id)}
                    className="w-full py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    View Expenses ({expenses[budget.id]?.length || 0})
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
