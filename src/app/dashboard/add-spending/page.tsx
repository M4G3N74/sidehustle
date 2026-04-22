'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { useDashboard } from '@/components/DashboardContext';

const categories = [
  'Food & Drink',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Education',
  'Other',
];

export default function AddSpendingPage() {
  const router = useRouter();
  const toast = useToast();
  const { optimisticAddSpending } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const name = (formData.get('name') as string)?.trim();
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;

    if (!name) { toast.error('Name is required'); setLoading(false); return; }
    if (!amount || amount <= 0) { toast.error('Amount must be greater than zero'); setLoading(false); return; }
    if (!date) { toast.error('Date is required'); setLoading(false); return; }

    try {
      await graphqlRequest(MUTATIONS.ADD_SPENDING, {
        name,
        amount,
        category: (formData.get('category') as string) || undefined,
        description: (formData.get('description') as string)?.trim() || undefined,
        date,
      });
      optimisticAddSpending({ id: Date.now(), name, amount, category: (formData.get('category') as string) || null, description: (formData.get('description') as string)?.trim() || null, date: new Date(date).toISOString() });
      setSuccess(true);
      toast.success('Spending saved successfully');
      setTimeout(() => { router.push('/dashboard/spending'); router.refresh(); }, 1000);
    } catch {
      toast.error('Failed to save spending');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 page-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/spending" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Add Spending</h1>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="spending-name" className="block text-sm font-medium text-white/70 mb-2">Name *</label>
          <input id="spending-name" type="text" name="name" className="glass-input" placeholder="e.g., Groceries, Rent" required />
        </div>

        <div>
          <label htmlFor="spending-amount" className="block text-sm font-medium text-white/70 mb-2">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium font-tabular">ZMW</span>
            <input id="spending-amount" type="number" step="0.01" min="0.01" name="amount" className="glass-input pl-14" placeholder="0.00" required />
          </div>
        </div>

        <div>
          <label htmlFor="spending-category" className="block text-sm font-medium text-white/70 mb-2">Category</label>
          <select id="spending-category" name="category" className="glass-input">
            <option value="">Select category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="spending-date" className="block text-sm font-medium text-white/70 mb-2">Date *</label>
          <input id="spending-date" type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="glass-input" style={{ colorScheme: 'dark' }} required />
        </div>

        <div>
          <label htmlFor="spending-description" className="block text-sm font-medium text-white/70 mb-2">Description</label>
          <textarea id="spending-description" name="description" className="glass-input resize-none" rows={3} placeholder="Optional notes..." />
        </div>

        <button type="submit" disabled={loading || success} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
          {success ? (
            <><Check className="w-5 h-5" />Saved!</>
          ) : loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
          ) : (
            <><ShoppingCart className="w-5 h-5" />Save Spending</>
          )}
        </button>
      </form>
    </div>
  );
}
