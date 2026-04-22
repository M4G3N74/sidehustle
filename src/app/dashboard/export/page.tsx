'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { graphqlRequest, QUERIES } from '@/lib/graphql';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Income {
  id: number;
  source: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

interface Spending {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

interface ExportData {
  incomes: Income[];
  spendings: Spending[];
  thisMonthIncome: number;
  lastMonthIncome: number;
  allTimeIncome: number;
  thisMonthSpending: number;
  lastMonthSpending: number;
  allTimeSpending: number;
  incomeBySource: { source: string; amount: number }[];
  user: { name: string | null; email: string | null } | null;
}

export default function ExportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all_time'>('this_month');

  useEffect(() => {
    graphqlRequest<{ export: ExportData }>(QUERIES.EXPORT)
      .then(result => { setData(result.export); setLoading(false); });
  }, []);

  const generatePDF = async () => {
    if (!data) return;
    setGenerating(true);

    const doc = new jsPDF();
    const now = new Date();

    try {
      const img = new window.Image();
      img.src = '/logo.png';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      doc.addImage(img, 'PNG', 14, 12, 10, 10);
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text('streethustler', 28, 20);
    } catch {
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text('streethustler', 14, 22);
    }

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Financial Report - ${format(now, 'MMMM yyyy')}`, 14, 32);

    if (data.user) {
      doc.setFontSize(10);
      doc.text(`Prepared for: ${data.user.name || data.user.email || 'User'}`, 14, 42);
      doc.text(`Generated: ${format(now, 'PPpp')}`, 14, 48);
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let filteredIncomes = data.incomes;
    let filteredSpendings = data.spendings;
    let periodLabel = '';
    let totalIncome = 0;
    let totalSpending = 0;

    if (period === 'this_month') {
      filteredIncomes = data.incomes.filter(i => new Date(i.date) >= startOfMonth);
      filteredSpendings = data.spendings.filter(s => new Date(s.date) >= startOfMonth);
      periodLabel = 'This Month';
      totalIncome = data.thisMonthIncome;
      totalSpending = data.thisMonthSpending;
    } else if (period === 'last_month') {
      filteredIncomes = data.incomes.filter(i => { const d = new Date(i.date); return d >= startOfLastMonth && d <= endOfLastMonth; });
      filteredSpendings = data.spendings.filter(s => { const d = new Date(s.date); return d >= startOfLastMonth && d <= endOfLastMonth; });
      periodLabel = 'Last Month';
      totalIncome = data.lastMonthIncome;
      totalSpending = data.lastMonthSpending;
    } else {
      periodLabel = 'All Time';
      totalIncome = data.allTimeIncome;
      totalSpending = data.allTimeSpending;
    }

    const net = totalIncome - totalSpending;
    const baseY = data.user ? 60 : 50;

    // Summary section
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(`${periodLabel} Summary`, 14, baseY);

    autoTable(doc, {
      startY: baseY + 4,
      body: [
        ['Total Income', `ZMW ${totalIncome.toLocaleString()}`],
        ['Total Spending', `ZMW ${totalSpending.toLocaleString()}`],
        ['Net Income', `ZMW ${net.toLocaleString()}`],
      ],
      theme: 'plain',
      styles: { fontSize: 11 },
      columnStyles: {
        0: { textColor: [100, 100, 100] },
        1: { fontStyle: 'bold', halign: 'right' },
      },
    });

    const afterSummary = (doc as any).lastAutoTable.finalY + 8;

    // Income table
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Income', 14, afterSummary);

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['Date', 'Source', 'Category', 'Description', 'Amount']],
      body: filteredIncomes.map(i => [
        format(new Date(i.date), 'MMM dd'),
        i.source,
        i.category || '-',
        i.description || '-',
        `ZMW ${i.amount.toLocaleString()}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 9 },
      foot: [['', '', '', 'Total', `ZMW ${totalIncome.toLocaleString()}`]],
      footStyles: { fontStyle: 'bold', fillColor: [240, 240, 255] },
    });

    const afterIncome = (doc as any).lastAutoTable.finalY + 8;

    // Spending table
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Spending', 14, afterIncome);

    autoTable(doc, {
      startY: afterIncome + 4,
      head: [['Date', 'Name', 'Category', 'Description', 'Amount']],
      body: filteredSpendings.map(s => [
        format(new Date(s.date), 'MMM dd'),
        s.name,
        s.category || '-',
        s.description || '-',
        `ZMW ${s.amount.toLocaleString()}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 9 },
      foot: [['', '', '', 'Total', `ZMW ${totalSpending.toLocaleString()}`]],
      footStyles: { fontStyle: 'bold', fillColor: [255, 240, 240] },
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on ${format(now, 'PPpp')}`, 14, (doc as any).internal.pageSize.height - 10);

    doc.save(`${data.user?.name || data.user?.email || 'report'}-${format(now, 'yyyy-MM-dd-HHmm')}.pdf`);
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const incomeAmt = period === 'this_month' ? data?.thisMonthIncome : period === 'last_month' ? data?.lastMonthIncome : data?.allTimeIncome;
  const spendingAmt = period === 'this_month' ? data?.thisMonthSpending : period === 'last_month' ? data?.lastMonthSpending : data?.allTimeSpending;
  const net = (incomeAmt || 0) - (spendingAmt || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Export Report</h1>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Select Period</h2>
        <div className="space-y-3">
          {[
            { value: 'this_month', label: 'This Month', income: data?.thisMonthIncome, spending: data?.thisMonthSpending },
            { value: 'last_month', label: 'Last Month', income: data?.lastMonthIncome, spending: data?.lastMonthSpending },
            { value: 'all_time', label: 'All Time', income: data?.allTimeIncome, spending: data?.allTimeSpending },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                period === opt.value ? 'bg-purple-500/30 border-purple-500' : 'bg-white/5 border-transparent'
              } border`}
            >
              <div className="flex items-center gap-3">
                <input type="radio" name="period" value={opt.value} checked={period === opt.value} onChange={e => setPeriod(e.target.value as any)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${period === opt.value ? 'border-purple-500 bg-purple-500' : 'border-white/30'}`}>
                  {period === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span>{opt.label}</span>
              </div>
              <div className="text-right">
                <p className="text-green-400 text-sm font-tabular">+ZMW {(opt.income || 0).toLocaleString()}</p>
                <p className="text-red-400 text-sm font-tabular">-ZMW {(opt.spending || 0).toLocaleString()}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-white/50 text-xs mb-1">Income</p>
          <p className="text-green-400 font-bold font-tabular">ZMW {(incomeAmt || 0).toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-white/50 text-xs mb-1">Spending</p>
          <p className="text-red-400 font-bold font-tabular">ZMW {(spendingAmt || 0).toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-white/50 text-xs mb-1">Net Income</p>
          <p className={`font-bold font-tabular ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>ZMW {net.toLocaleString()}</p>
        </div>
      </div>

      <button
        onClick={generatePDF}
        disabled={generating || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {generating ? 'Generating PDF...' : 'Download PDF Report'}
      </button>
    </div>
  );
}
