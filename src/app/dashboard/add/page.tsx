'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';

const categories = [
  'Freelance',
  'Consulting',
  'Sales',
  'Salary',
  'Investment',
  'Rental',
  'Other',
];

export default function AddIncomePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const source = (formData.get('source') as string)?.trim();
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;

    if (!source) {
      toast.error('Source is required');
      setLoading(false);
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Amount must be greater than zero');
      setLoading(false);
      return;
    }
    if (!date) {
      toast.error('Date is required');
      setLoading(false);
      return;
    }

    try {
      await graphqlRequest(MUTATIONS.ADD_INCOME, {
        source,
        amount,
        category: (formData.get('category') as string) || undefined,
        description: (formData.get('description') as string)?.trim() || undefined,
        date,
      });
      setSuccess(true);
      toast.success('Income saved successfully');
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1000);
    } catch (error) {
      toast.error('Failed to save income');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 page-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Add Income</h1>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="income-source" className="block text-sm font-medium text-white/70 mb-2">Source *</label>
          <input
            id="income-source"
            type="text"
            name="source"
            className="glass-input"
            placeholder="e.g., Upwork, Fiverr, Salary"
            required
          />
        </div>

        <div>
          <label htmlFor="income-amount" className="block text-sm font-medium text-white/70 mb-2">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium font-tabular">ZMW</span>
            <input
              id="income-amount"
              type="number"
              step="0.01"
              min="0.01"
              name="amount"
              className="glass-input pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="income-category" className="block text-sm font-medium text-white/70 mb-2">Category</label>
          <select id="income-category" name="category" className="glass-input">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="income-date" className="block text-sm font-medium text-white/70 mb-2">Date *</label>
          <input
            id="income-date"
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="glass-input"
            style={{ colorScheme: 'dark' }}
            required
          />
        </div>

        <div>
          <label htmlFor="income-description" className="block text-sm font-medium text-white/70 mb-2">Description</label>
          <textarea
            id="income-description"
            name="description"
            className="glass-input resize-none"
            rows={3}
            placeholder="Optional notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
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
            <>
              <DollarSign className="w-5 h-5" />
              Save Income
            </>
          )}
        </button>
      </form>
    </div>
  );
}
