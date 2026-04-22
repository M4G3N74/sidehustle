'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Search, Filter, Edit2, Trash2, Plus, X, ShoppingCart, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDashboard, type Spending } from '@/components/DashboardContext';

const categories = ['Food & Drink', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];

export default function SpendingPage() {
  const toast = useToast();
  const { data, loading, optimisticUpdateSpending, optimisticDeleteSpending } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingSpending, setEditingSpending] = useState<Spending | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const spendings = data?.allSpendings || [];

  const filtered = spendings
    .filter(s => {
      const q = searchQuery.toLowerCase();
      return (!searchQuery || s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) &&
        (categoryFilter === 'All' || s.category === categoryFilter);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltered = filtered.reduce((sum, s) => sum + s.amount, 0);

  async function handleUpdate(formData: FormData) {
    if (!editingSpending) return;
    setEditLoading(true);
    const dateStr = formData.get('date') as string;
    const updated: Spending = {
      ...editingSpending,
      name: (formData.get('name') as string).trim(),
      amount: parseFloat(formData.get('amount') as string),
      category: (formData.get('category') as string) || null,
      description: (formData.get('description') as string).trim() || null,
      date: new Date(dateStr).toISOString(),
    };
    try {
      await graphqlRequest(MUTATIONS.UPDATE_SPENDING, {
        id: updated.id, name: updated.name, amount: updated.amount,
        category: updated.category, description: updated.description, date: dateStr,
      });
      optimisticUpdateSpending(updated);
      toast.success('Spending updated');
      setEditingSpending(null);
    } catch {
      toast.error('Failed to update spending');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await graphqlRequest(MUTATIONS.DELETE_SPENDING, { id: deletingId });
      optimisticDeleteSpending(deletingId);
      toast.success('Spending deleted');
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch {
      toast.error('Failed to delete spending');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-red-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 page-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-semibold">Spending</h1>
        </div>
        <Link href="/dashboard/add-spending" className="btn-primary flex items-center gap-2 justify-center py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Add Spending
        </Link>
      </div>

      {filtered.length > 0 && (
        <div className="card bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20"><ShoppingCart className="w-5 h-5 text-red-400" /></div>
            <div>
              <p className="text-white/60 text-sm">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
              <p className="text-2xl font-bold text-red-400 font-tabular">-K {totalFiltered.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Search by name or description..." className="glass-input pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
                <th className="px-6 py-4 text-sm font-semibold text-white/60">Name & Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60 text-right">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-white/60 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4"><p className="font-medium text-white">{s.name}</p><p className="text-xs text-white/40">{s.category || 'Uncategorized'}</p></td>
                  <td className="px-6 py-4 text-sm text-white/60 whitespace-nowrap">{format(new Date(s.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-right"><span className="text-red-400 font-semibold font-tabular">-K {s.amount.toLocaleString()}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingSpending(s)} className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all" aria-label="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setDeletingId(s.id); setShowDeleteDialog(true); }} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-white/40">No spending records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editingSpending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-0 overflow-hidden shadow-2xl border-red-500/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit2 className="w-5 h-5 text-red-400" />Edit Spending</h2>
              <button onClick={() => setEditingSpending(null)} className="p-2 text-white/40 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-white/70 mb-2">Name *</label><input type="text" name="name" defaultValue={editingSpending.name} className="glass-input" required /></div>
                <div><label className="block text-sm font-medium text-white/70 mb-2">Amount (ZMW) *</label><input type="number" step="0.01" name="amount" defaultValue={editingSpending.amount} className="glass-input" required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-white/70 mb-2">Category</label><select name="category" defaultValue={editingSpending.category || ''} className="glass-input"><option value="">Select category</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-white/70 mb-2">Date *</label><input type="date" name="date" defaultValue={new Date(editingSpending.date).toISOString().split('T')[0]} className="glass-input" style={{ colorScheme: 'dark' }} required /></div>
              </div>
              <div><label className="block text-sm font-medium text-white/70 mb-2">Description</label><textarea name="description" defaultValue={editingSpending.description || ''} className="glass-input resize-none" rows={3} placeholder="Optional notes..." /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingSpending(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all border border-white/5">Cancel</button>
                <button type="submit" disabled={editLoading} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                  {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={showDeleteDialog} title="Delete Spending Record" message="Are you sure? This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" variant="danger" loading={isDeleting} onConfirm={handleDelete} onCancel={() => setShowDeleteDialog(false)} />
    </div>
  );
}
