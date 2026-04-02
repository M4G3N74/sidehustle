'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Repeat, Check, Loader2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, QUERIES, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Recurring {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  isActive: boolean;
}

export default function RecurringPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [recurrings, setRecurrings] = useState<Recurring[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    graphqlRequest<{ recurrings: Recurring[] }>(QUERIES.RECURRINGS)
      .then(result => {
        setRecurrings(result.recurrings);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load recurring income');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setSuccess(false);

    const name = (formData.get('name') as string)?.trim();
    const amount = parseFloat(formData.get('amount') as string);

    if (!name) {
      toast.error('Name is required');
      setSaving(false);
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Amount must be greater than zero');
      setSaving(false);
      return;
    }

    try {
      await graphqlRequest(MUTATIONS.ADD_RECURRING, {
        name,
        amount,
        category: (formData.get('category') as string) || undefined,
      });
      const result = await graphqlRequest<{ recurrings: Recurring[] }>(QUERIES.RECURRINGS);
      setRecurrings(result.recurrings);
      setSuccess(true);
      toast.success('Recurring income added');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to add recurring income');
    }
    setSaving(false);
  };

  const handleToggle = async (id: number, current: boolean) => {
    // Optimistic update
    setRecurrings(recurrings.map(r => 
      r.id === id ? { ...r, isActive: !current } : r
    ));
    try {
      await graphqlRequest(MUTATIONS.TOGGLE_RECURRING, { id, current: current ? 1 : 0 });
      toast.success(current ? 'Recurring income paused' : 'Recurring income activated');
    } catch (error) {
      // Rollback on error
      setRecurrings(recurrings.map(r => 
        r.id === id ? { ...r, isActive: current } : r
      ));
      toast.error('Failed to update recurring income');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await graphqlRequest(MUTATIONS.DELETE_RECURRING, { id });
      setRecurrings(recurrings.filter(r => r.id !== id));
      toast.success('Recurring income deleted');
    } catch (error) {
      toast.error('Failed to delete recurring income');
    }
    setDeletingId(null);
  };

  const activeRecurrings = recurrings.filter(r => r.isActive);
  const totalRecurring = activeRecurrings.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/goals" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to goals">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Recurring Income</h1>
      </div>

      {totalRecurring > 0 && (
        <div className="card bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Repeat className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Monthly Recurring</p>
              <p className="text-2xl font-bold text-green-400 font-tabular">ZMW {totalRecurring.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Add Recurring Income</h2>
        <p className="text-white/50 text-sm mb-4">Add your salary, retainer, or any recurring payments</p>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recurring-name" className="sr-only">Name</label>
            <input
              id="recurring-name"
              type="text"
              name="name"
              className="glass-input"
              placeholder="Name (e.g., Salary, Freelance Retainer)"
              required
            />
          </div>
          <div>
            <label htmlFor="recurring-amount" className="sr-only">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium font-tabular">ZMW</span>
              <input
                id="recurring-amount"
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                className="glass-input pl-8"
                placeholder="Amount per month"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {success ? (
              <>
                <Check className="w-5 h-5" />
                Added!
              </>
            ) : saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Add Recurring
              </>
            )}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Your Recurring Income</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl animate-pulse">
                <div className="w-5 h-5 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-24 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : recurrings.length === 0 ? (
          <div className="text-center py-8">
            <Repeat className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No recurring income added yet</p>
            <p className="text-white/30 text-sm mt-1">Add your salary or retainer above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurrings.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(item.id, item.isActive)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.isActive ? 'bg-green-500 border-green-500' : 'border-white/30'
                    }`}
                    aria-label={`${item.isActive ? 'Deactivate' : 'Activate'} ${item.name}`}
                  >
                    {item.isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                  <div>
                    <p className={`font-medium ${item.isActive ? '' : 'opacity-50 line-through'}`}>{item.name}</p>
                    <p className={`text-sm ${item.isActive ? 'text-green-400' : 'text-white/40'}`}>
                      ZMW {item.amount.toLocaleString()}/month
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={`Delete ${item.name}`}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Recurring Income"
        message="Are you sure you want to delete this recurring income entry?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
