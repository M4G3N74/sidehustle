'use client';

import { useState } from 'react';
import { ArrowLeft, Target, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDashboard, type Goal } from '@/components/DashboardContext';

export default function GoalsPage() {
  const toast = useToast();
  const { data, loading, optimisticSetGoal, optimisticDeleteGoal } = useDashboard();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const goals = data?.goals || [];
  const thisMonthGoals = goals.filter(g => g.month === new Date().getMonth() + 1 && g.year === new Date().getFullYear());

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setSuccess(false);
    const title = (formData.get('title') as string)?.trim();
    const targetAmount = parseFloat(formData.get('targetAmount') as string);

    if (!title) { toast.error('Goal name is required'); setSaving(false); return; }
    if (!targetAmount || targetAmount <= 0) { toast.error('Target amount must be greater than zero'); setSaving(false); return; }

    try {
      const result = await graphqlRequest<{ setGoal: { success: boolean } }>(MUTATIONS.SET_GOAL, { title, targetAmount });
      const now = new Date();
      const tempGoal: Goal = {
        id: thisMonthGoals[0]?.id || Date.now(),
        title, targetAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
      optimisticSetGoal(tempGoal);
      setSuccess(true);
      toast.success('Goal saved');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      toast.error('Failed to save goal');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await graphqlRequest(MUTATIONS.DELETE_GOAL, { id });
      optimisticDeleteGoal(id);
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    }
    setDeletingId(null);
  };

  if (loading) return (
    <div className="card animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-4" />
      <div className="h-16 bg-white/5 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-semibold">Goals</h1>
      </div>

      {thisMonthGoals.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-purple-400" />Current Goal - {currentMonth}</h2>
          <div className="space-y-3">
            {thisMonthGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-lg">{goal.title}</p>
                  <p className="text-purple-400 font-semibold font-tabular">ZMW {goal.targetAmount.toLocaleString()}</p>
                </div>
                <button onClick={() => setConfirmDeleteId(goal.id)} disabled={deletingId === goal.id} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50" aria-label={`Delete ${goal.title}`}>
                  {deletingId === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-purple-400" /><h2 className="font-semibold">{thisMonthGoals.length > 0 ? 'Update Goal' : 'Set Monthly Goal'}</h2></div>
        <p className="text-white/60 text-sm mb-4">Target for {currentMonth}</p>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-white/70 mb-2">Goal Name</label>
            <input id="goal-title" type="text" name="title" className="glass-input" placeholder="e.g., Side Hustle Goal" required />
          </div>
          <div>
            <label htmlFor="goal-amount" className="block text-sm font-medium text-white/70 mb-2">Target Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium font-tabular">ZMW</span>
              <input id="goal-amount" type="number" step="0.01" min="0.01" name="targetAmount" className="glass-input pl-14" placeholder="0.00" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
            {success ? <><Check className="w-5 h-5" />Saved!</> : saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : (thisMonthGoals.length > 0 ? 'Update Goal' : 'Set Goal')}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-2">Recurring Income</h3>
        <p className="text-white/50 text-sm mb-4">Set up your salary and recurring payments</p>
        <Link href="/dashboard/recurring" className="block w-full py-3 text-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">Manage Recurring</Link>
      </div>

      <ConfirmDialog isOpen={confirmDeleteId !== null} title="Delete Goal" message="Are you sure you want to delete this goal?" confirmLabel="Delete" variant="danger" onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
