'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, QUERIES, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  month: number;
  year: number;
}

export default function GoalsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    graphqlRequest<{ goals: Goal[] }>(QUERIES.GOALS)
      .then(result => {
        setGoals(result.goals);
        setLoadingGoals(false);
      })
      .catch(() => {
        toast.error('Failed to load goals');
        setLoadingGoals(false);
      });
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setSuccess(false);

    const title = (formData.get('title') as string)?.trim();
    const targetAmount = parseFloat(formData.get('targetAmount') as string);

    if (!title) {
      toast.error('Goal name is required');
      setLoading(false);
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      toast.error('Target amount must be greater than zero');
      setLoading(false);
      return;
    }

    try {
      await graphqlRequest(MUTATIONS.SET_GOAL, { title, targetAmount });
      const result = await graphqlRequest<{ goals: Goal[] }>(QUERIES.GOALS);
      setGoals(result.goals);
      setSuccess(true);
      toast.success('Goal saved successfully');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to save goal');
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await graphqlRequest(MUTATIONS.DELETE_GOAL, { id });
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch (error) {
      toast.error('Failed to delete goal');
    }
    setDeletingId(null);
  };

  const thisMonthGoals = goals.filter(g => 
    g.month === new Date().getMonth() + 1 && g.year === new Date().getFullYear()
  );

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Goals</h1>
      </div>

      {loadingGoals ? (
        <div className="card animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded mb-4" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      ) : thisMonthGoals.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Current Goal - {currentMonth}
          </h2>
          <div className="space-y-3">
            {thisMonthGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-lg">{goal.title}</p>
                  <p className="text-purple-400 font-semibold font-tabular">ZMW {goal.targetAmount.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setConfirmDeleteId(goal.id)}
                  disabled={deletingId === goal.id}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={`Delete goal: ${goal.title}`}
                >
                  {deletingId === goal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">{thisMonthGoals.length > 0 ? 'Update Goal' : 'Set Monthly Goal'}</h2>
        </div>
        <p className="text-white/60 text-sm mb-4">Target for {currentMonth}</p>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-white/70 mb-2">Goal Name</label>
            <input
              id="goal-title"
              type="text"
              name="title"
              className="glass-input"
              placeholder="e.g., Side Hustle Goal"
              required
            />
          </div>

          <div>
            <label htmlFor="goal-amount" className="block text-sm font-medium text-white/70 mb-2">Target Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium font-tabular">ZMW</span>
              <input
                id="goal-amount"
                type="number"
                step="0.01"
                min="0.01"
                name="targetAmount"
                className="glass-input pl-8"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              thisMonthGoals.length > 0 ? 'Update Goal' : 'Set Goal'
            )}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-2">Recurring Income</h3>
        <p className="text-white/50 text-sm mb-4">Set up your salary and recurring payments</p>
        
        <Link 
          href="/dashboard/recurring" 
          className="block w-full py-3 text-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          Manage Recurring
        </Link>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
