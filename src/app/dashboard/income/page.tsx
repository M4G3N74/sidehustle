'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  X,
  Check,
  DollarSign,
  Calendar,
  Tag,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, QUERIES, MUTATIONS } from '@/lib/graphql';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Income {
  id: number;
  source: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

const categories = [
  'Freelance',
  'Consulting',
  'Sales',
  'Salary',
  'Investment',
  'Rental',
  'Other',
];

export default function IncomeManagementPage() {
  const toast = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Edit state
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete state
  const [deletingIncomeId, setDeletingIncomeId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, []);

  useEffect(() => {
    filterIncomes();
  }, [incomes, searchQuery, categoryFilter]);

  async function fetchIncomes() {
    setLoading(true);
    try {
      const result = await graphqlRequest<{ profile: { incomes: Income[] } }>(QUERIES.PROFILE);
      setIncomes(result.profile.incomes);
    } catch (err) {
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  }

  function filterIncomes() {
    let filtered = [...incomes];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inc => 
        inc.source.toLowerCase().includes(query) || 
        inc.description?.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(inc => inc.category === categoryFilter);
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredIncomes(filtered);
  }

  async function handleUpdate(formData: FormData) {
    if (!editingIncome) return;
    setEditLoading(true);
    
    const source = (formData.get('source') as string).trim();
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const description = (formData.get('description') as string).trim();
    const date = formData.get('date') as string;

    try {
      await graphqlRequest(MUTATIONS.UPDATE_INCOME, {
        id: editingIncome.id,
        source,
        amount,
        category: category || null,
        description: description || null,
        date
      });
      
      toast.success('Income updated successfully');
      setShowEditModal(false);
      setEditingIncome(null);
      fetchIncomes(); // Refresh data
    } catch (err) {
      toast.error('Failed to update income');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingIncomeId) return;
    setIsDeleting(true);
    
    try {
      await graphqlRequest(MUTATIONS.DELETE_INCOME, { id: deletingIncomeId });
      toast.success('Income deleted successfully');
      setIncomes(incomes.filter(i => i.id !== deletingIncomeId));
      setShowDeleteDialog(false);
      setDeletingIncomeId(null);
    } catch (err) {
      toast.error('Failed to delete income');
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditClick = (income: Income) => {
    setEditingIncome(income);
    setShowEditModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingIncomeId(id);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Manage Income</h1>
        </div>
        <Link href="/dashboard/add" className="btn-primary flex items-center gap-2 justify-center py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />
          Add Record
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by source or description..."
            className="glass-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <select
            className="glass-input pl-10"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
              {filteredIncomes.map((income) => (
                <tr key={income.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{income.source}</p>
                      <p className="text-xs text-white/40">{income.category || 'Uncategorized'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 whitespace-nowrap">
                    {format(new Date(income.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-400 font-semibold font-tabular">ZMW {income.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(income)}
                        className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                        aria-label="Edit record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(income.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIncomes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                    No income records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingIncome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card w-full max-w-lg p-0 overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-purple-500/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                Edit Income
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-white/40 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="edit-source" className="block text-sm font-medium text-white/70 mb-2">Source *</label>
                  <div className="relative">
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/50" />
                    <input
                      id="edit-source"
                      type="text"
                      name="source"
                      defaultValue={editingIncome.source}
                      className="glass-input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-amount" className="block text-sm font-medium text-white/70 mb-2">Amount (ZMW) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      name="amount"
                      defaultValue={editingIncome.amount}
                      className="glass-input pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <select
                      id="edit-category"
                      name="category"
                      defaultValue={editingIncome.category || ''}
                      className="glass-input pl-10"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-white/70 mb-2">Date *</label>
                  <div className="relative text-white">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="edit-date"
                      type="date"
                      name="date"
                      defaultValue={new Date(editingIncome.date).toISOString().split('T')[0]}
                      className="glass-input pl-10"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingIncome.description || ''}
                  className="glass-input resize-none"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/60 font-medium hover:bg-white/20 transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-[2] btn-primary flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Income Record"
        message="Are you sure you want to delete this income record? This action cannot be undone and will update your financial reports immediately."
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
