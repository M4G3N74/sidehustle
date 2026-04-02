'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, Download, Trash2, Wallet, Target, Calendar, FileSpreadsheet, FileText, Save, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { graphqlRequest, QUERIES, MUTATIONS } from '@/lib/graphql';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastContext';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface UserData {
  name: string | null;
  email: string;
}

interface Income {
  id: number;
  source: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  month: number;
  year: number;
}

interface Recurring {
  id: number;
  name: string;
  amount: number;
  isActive: boolean;
}

interface ProfileData {
  user: UserData;
  totalIncome: number;
  totalRecurring: number;
  incomes: Income[];
  goals: Goal[];
  recurrings: Recurring[];
}

export default function ProfilePage() {
  const toast = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    graphqlRequest<{ profile: ProfileData }>(QUERIES.PROFILE)
      .then(result => {
        setData(result.profile);
        setName(result.profile.user?.name || '');
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load profile');
        setLoading(false);
      });
  }, []);

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      await graphqlRequest(MUTATIONS.UPDATE_PROFILE, { name: name.trim() });
      setEditingName(false);
      toast.success('Name updated successfully');
    } catch (err) {
      toast.error('Failed to update name');
    }
    setSavingName(false);
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await graphqlRequest(MUTATIONS.UPDATE_PASSWORD, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      toast.success('Password updated successfully');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    }
    setSavingPassword(false);
  };

  const handleExportZip = async () => {
    if (!data) return;
    setExporting(true);

    try {
      const result = await graphqlRequest<{ export: any }>(QUERIES.EXPORT);
      const exportData = result.export;
      const now = new Date();

      const zip = new JSZip();

      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.setTextColor(124, 58, 237);
      pdf.text('HustleTrack - Complete Report', 14, 22);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${format(now, 'PPpp')}`, 14, 30);
      pdf.text(`User: ${exportData.user?.name || exportData.user?.email}`, 14, 36);

      const summaryY = 45;
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.text('Summary', 14, summaryY);
      pdf.setFontSize(12);
      pdf.text(`Total Income: ZMW ${exportData.allTimeIncome.toLocaleString()}`, 14, summaryY + 8);
      pdf.text(`Monthly Recurring: ZMW ${data.totalRecurring.toLocaleString()}`, 14, summaryY + 16);
      pdf.text(`Total Entries: ${exportData.incomes.length}`, 14, summaryY + 24);

      const incomeRows = exportData.incomes.map((i: Income) => [
        format(new Date(i.date), 'MMM dd, yyyy'),
        i.source,
        i.category || '-',
        i.description || '-',
        `ZMW ${i.amount.toLocaleString()}`
      ]);

      autoTable(pdf, {
        startY: summaryY + 35,
        head: [['Date', 'Source', 'Category', 'Description', 'Amount']],
        body: incomeRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] },
        styles: { fontSize: 9 },
      });

      zip.file('report.pdf', pdf.output('blob'));

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'HustleTrack';
      workbook.created = now;

      const incomeSheet = workbook.addWorksheet('Income');
      incomeSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount', key: 'amount', width: 12 },
      ];
      exportData.incomes.forEach((i: Income) => {
        incomeSheet.addRow({
          date: format(new Date(i.date), 'yyyy-MM-dd'),
          source: i.source,
          category: i.category || '',
          description: i.description || '',
          amount: i.amount,
        });
      });

      const goalSheet = workbook.addWorksheet('Goals');
      goalSheet.columns = [
        { header: 'Title', key: 'title', width: 25 },
        { header: 'Target Amount', key: 'targetAmount', width: 15 },
        { header: 'Month', key: 'month', width: 10 },
        { header: 'Year', key: 'year', width: 10 },
      ];
      data.goals.forEach(g => {
        goalSheet.addRow({
          title: g.title,
          targetAmount: g.targetAmount,
          month: g.month,
          year: g.year,
        });
      });

      const recurringSheet = workbook.addWorksheet('Recurring');
      recurringSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Active', key: 'isActive', width: 10 },
      ];
      data.recurrings.forEach(r => {
        recurringSheet.addRow({
          name: r.name,
          amount: r.amount,
          isActive: r.isActive ? 'Yes' : 'No',
        });
      });

      const excelBuffer = await workbook.xlsx.writeBuffer();
      zip.file('data.xlsx', Buffer.from(excelBuffer));

      const zipBuffer = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBuffer);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hustletrack-export-${format(now, 'yyyy-MM-dd')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate export');
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await graphqlRequest(MUTATIONS.DELETE_ACCOUNT);
      await signOut({ callbackUrl: '/login' });
    } catch (err) {
      toast.error('Failed to delete account');
      setDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="card animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10" />
            <div>
              <div className="h-6 w-32 bg-white/10 rounded mb-2" />
              <div className="h-4 w-48 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input text-lg font-bold"
                  placeholder="Your name"
                  aria-label="Edit name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                  aria-label="Save name"
                >
                  {savingName ? (
                    <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => { setEditingName(false); setName(data?.user.name || ''); }}
                  className="p-2 text-white/60 hover:text-white"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{data?.user.name || 'User'}</h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-white/60">{data?.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <Wallet className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-white/60 text-sm">Total Earned</p>
            <p className="text-xl font-bold font-tabular">ZMW {data?.totalIncome.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <Target className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-white/60 text-sm">Goals Set</p>
            <p className="text-xl font-bold">{data?.goals.length}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-white/60 text-sm">Income Entries</p>
            <p className="text-xl font-bold">{data?.incomes.length}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400 mb-2" />
            <p className="text-white/60 text-sm">Monthly Recurring</p>
            <p className="text-xl font-bold font-tabular">ZMW {data?.totalRecurring.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" />
          Change Password
        </h3>
        {showPasswordForm ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-white/70 mb-2">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="glass-input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-white/70 mb-2">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-white/70 mb-2">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {passwordError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSavePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
              <button
                onClick={() => { setShowPasswordForm(false); setPasswordError(''); }}
                className="px-4 py-3 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left flex items-center gap-2"
          >
            <Lock className="w-5 h-5 text-white/60" />
            <span>Change your password</span>
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-400" />
          Export Data
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Download all your data as a ZIP file containing PDF report and Excel spreadsheet.
        </p>
        <button
          onClick={handleExportZip}
          disabled={exporting}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Export All Data (ZIP)
            </>
          )}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-red-400" />
          Danger Zone
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full py-3 px-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Account"
        message="This will permanently delete your account and all associated data including income records, goals, and recurring entries. This action cannot be undone."
        confirmLabel="Delete Everything"
        cancelLabel="Keep Account"
        variant="danger"
        loading={deletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
