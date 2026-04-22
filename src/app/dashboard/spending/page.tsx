'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Search, Filter, Edit2, Trash2, Plus, X, Check, ShoppingCart, Calendar, Tag, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, QUERIES, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Spending {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

const categories = ['Food & Drink', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];

export default function SpendingPage() {
  const toast = useToast();
  const [spendings, setSpendings] = useState<Spending[]>([]);
  const [filtered, setFiltered] = useState<Spending[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingSpending, setEditingSpending] = useState<Spending | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchSpendings(); }, []);

  useEffect(() => {
    let result = [...spendings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'All') result = result.filter(s => s.category === categoryFilter);
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFiltered(result);
  }, [spendings, searchQuery, categoryFilter]);

  async function fetchSpendings() {
    setLoading(true);
    try {
      const result = await graphqlRequest<{ spending: { recentSpendings: Spending[] } }>(QUERIES.SPENDING);
      setSpendings(result.spending.recentSpendings);
    } catch {
      toast.error('Failed to load spending data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingSpending) return;
    setEditLoading(true);
    try {
      await graphqlRequest(MUTATIONS.UPDATE_SPENDING, {
        id: editingSpending.id,
        name: (formData.get('name') as string).trim(),
        amount: parseFloat(formData.get('amount') as string),
        category: (formData.get('category') as string) || null,
        description: (formData.get('description') as string).trim() || null,
        date: formData.get('date') as string,
      });
      toast.success('Spending updated');
      setEditingSpending(null);
      fetchSpendings();
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
      toast.success('Spending deleted');
      setSpendings(spendings.filter(s => s.id !== deletingId));
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch {
      toast.error('Failed to delete spending');
    } finally {
      setIsDeleting(false);
    }
  }

  const totalFiltered = filtered.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-red-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 page-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Spending</h1>
        </div>
        <Link href="/dashboard/add-spending" className="btn-primary flex items-center gap-2 justify-center py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Add Spending
        </Link>
      </div>

      {filtered.length > 0 && (
        <div className="card bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <ShoppingCart className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
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
              {filtered.map(spending => (
                <tr key={spending.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{spending.name}</p>
                    <p className="text-xs text-white/40">{spending.category || 'Uncategorized'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 whitespace-nowrap">{format(new Date(spending.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-red-400 font-semibold font-tabular">-K {spending.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingSpending(spending)} className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all" aria-label="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeletingId(spending.id); setShowDeleteDialog(true); }} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                    No spending records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSpending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card w-full max-w-lg p-0 overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-red-500/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-red-400" />Edit Spending
              </h2>
              <button onClick={() => setEditingSpending(null)} className="p-2 text-white/40 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Name *</label>
                  <input type="text" name="name" defaultValue={editingSpending.name} className="glass-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Amount (ZMW) *</label>
                  <input type="number" step="0.01" name="amount" defaultValue={editingSpending.amount} className="glass-input" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <select name="category" defaultValue={editingSpending.category || ''} className="glass-input">
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Date *</label>
                  <input type="date" name="date" defaultValue={new Date(editingSpending.date).toISOString().split('T')[0]} className="glass-input" style={{ colorScheme: 'dark' }} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <textarea name="description" defaultValue={editingSpending.description || ''} className="glass-input resize-none" rows={3} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingSpending(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/60 font-medium hover:bg-white/20 transition-all border border-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                  {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Spending Record"
        message="Are you sure you want to delete this spending record? This action cannot be undone."
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
