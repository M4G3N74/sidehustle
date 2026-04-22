'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Search, Filter, Edit2, Trash2, Plus, X, Check, DollarSign, Calendar, Tag, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDashboard, type Income } from '@/components/DashboardContext';

const categories = ['Freelance', 'Consulting', 'Sales', 'Salary', 'Investment', 'Rental', 'Other'];

export default function IncomeManagementPage() {
  const toast = useToast();
  const { data, loading, optimisticUpdateIncome, optimisticDeleteIncome } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const incomes = data?.allIncomes || [];

  const filtered = incomes
    .filter(i => {
      const q = searchQuery.toLowerCase();
      return (!searchQuery || i.source.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) &&
        (categoryFilter === 'All' || i.category === categoryFilter);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function handleUpdate(formData: FormData) {
    if (!editingIncome) return;
    setEditLoading(true);
    const updated: Income = {
      ...editingIncome,
      source: (formData.get('source') as string).trim(),
      amount: parseFloat(formData.get('amount') as string),
      category: (formData.get('category') as string) || null,
      description: (formData.get('description') as string).trim() || null,
      date: new Date(formData.get('date') as string).toISOString(),
    };
    try {
      await graphqlRequest(MUTATIONS.UPDATE_INCOME, {
        id: updated.id, source: updated.source, amount: updated.amount,
        category: updated.category, description: updated.description,
        date: (formData.get('date') as string),
      });
      optimisticUpdateIncome(updated);
      toast.success('Income updated');
      setEditingIncome(null);
    } catch {
      toast.error('Failed to update income');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await graphqlRequest(MUTATIONS.DELETE_INCOME, { id: deletingId });
      optimisticDeleteIncome(deletingId);
      toast.success('Income deleted');
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch {
      toast.error('Failed to delete income');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 page-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Manage Income</h1>
        </div>
        <Link href="/dashboard/add" className="btn-primary flex items-center gap-2 justify-center py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Add Record
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Search by source or description..." className="glass-input pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <select className="glass-input pl-10" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-sm font-semibold text-white/60">Source & Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60 text-right">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(income => (
                <tr key={income.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{income.source}</p>
                    <p className="text-xs text-white/40">{income.category || 'Uncategorized'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 whitespace-nowrap">{format(new Date(income.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-right"><span className="text-green-400 font-semibold font-tabular">ZMW {income.amount.toLocaleString()}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingIncome(income)} className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all" aria-label="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setDeletingId(income.id); setShowDeleteDialog(true); }} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-white/40">No income records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingIncome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-0 overflow-hidden shadow-2xl border-purple-500/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit2 className="w-5 h-5 text-purple-400" />Edit Income</h2>
              <button onClick={() => setEditingIncome(null)} className="p-2 text-white/40 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Source *</label>
                  <input type="text" name="source" defaultValue={editingIncome.source} className="glass-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Amount (ZMW) *</label>
                  <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input type="number" step="0.01" name="amount" defaultValue={editingIncome.amount} className="glass-input pl-10" required /></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><select name="category" defaultValue={editingIncome.category || ''} className="glass-input pl-10"><option value="">Select category</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Date *</label>
                  <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input type="date" name="date" defaultValue={new Date(editingIncome.date).toISOString().split('T')[0]} className="glass-input pl-10" style={{ colorScheme: 'dark' }} required /></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <textarea name="description" defaultValue={editingIncome.description || ''} className="glass-input resize-none" rows={3} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingIncome(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all border border-white/5">Cancel</button>
                <button type="submit" disabled={editLoading} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                  {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={showDeleteDialog} title="Delete Income Record" message="Are you sure? This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" variant="danger" loading={isDeleting} onConfirm={handleDelete} onCancel={() => setShowDeleteDialog(false)} />
    </div>
  );
}
