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

interface SourceBreakdown {
  source: string;
  amount: number;
}

interface ExportData {
  incomes: Income[];
  thisMonthIncome: number;
  lastMonthIncome: number;
  allTimeIncome: number;
  incomeBySource: SourceBreakdown[];
  user: { name: string | null; email: string | null } | null;
}

export default function ExportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all_time'>('this_month');

  useEffect(() => {
    graphqlRequest<{ export: ExportData }>(QUERIES.EXPORT)
      .then(result => {
        setData(result.export);
        setLoading(false);
      });
  }, []);

  const generatePDF = async () => {
    if (!data) return;
    setGenerating(true);

    const doc = new jsPDF();
    const now = new Date();

    try {
      const img = new window.Image();
      img.src = '/logo.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      doc.addImage(img, 'PNG', 14, 12, 10, 10);
      
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text('streethustler', 28, 20);
    } catch (e) {
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text('streethustler', 14, 22);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Income Report - ${format(now, 'MMMM yyyy')}`, 14, 32);

    if (data.user) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Prepared for: ${data.user.name || data.user.email || 'User'}`, 14, 42);
      doc.text(`Generated: ${format(now, 'PPpp')}`, 14, 48);
    }

    let filteredIncomes = data.incomes;
    let periodLabel = '';
    let total = 0;

    if (period === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredIncomes = data.incomes.filter(i => new Date(i.date) >= startOfMonth);
      periodLabel = 'This Month';
      total = data.thisMonthIncome;
    } else if (period === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      filteredIncomes = data.incomes.filter(i => {
        const d = new Date(i.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
      periodLabel = 'Last Month';
      total = data.lastMonthIncome;
    } else {
      periodLabel = 'All Time';
      total = data.allTimeIncome;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(periodLabel, 14, data.user ? 60 : 50);

    doc.setFontSize(24);
    doc.text(`ZMW ${total.toLocaleString()}`, 14, data.user ? 70 : 58);

    const incomeRows = filteredIncomes.map(i => [
      format(new Date(i.date), 'MMM dd'),
      i.source,
      i.category || '-',
      i.description || '-',
      `ZMW ${i.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: data.user ? 82 : 70,
      head: [['Date', 'Source', 'Category', 'Description', 'Amount']],
      body: incomeRows,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 9 },
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on ${format(now, 'PPpp')}`, 14, (doc as any).internal.pageSize.height - 10);

    doc.save(`streethustler-${period}-${format(now, 'yyyy-MM-dd')}.pdf`);
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

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
            { value: 'this_month', label: 'This Month', amount: data?.thisMonthIncome },
            { value: 'last_month', label: 'Last Month', amount: data?.lastMonthIncome },
            { value: 'all_time', label: 'All Time', amount: data?.allTimeIncome },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                period === opt.value ? 'bg-purple-500/30 border-purple-500' : 'bg-white/5 border-transparent'
              } border`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="period"
                  value={opt.value}
                  checked={period === opt.value}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 ${
                  period === opt.value ? 'border-purple-500 bg-purple-500' : 'border-white/30'
                }`}>
                  {period === opt.value && <div className="w-full h-full rounded-full bg-white scale-50" />}
                </div>
                <span>{opt.label}</span>
              </div>
              <span className="font-semibold font-tabular">ZMW {(opt.amount || 0).toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Income by Source</h2>
        <div className="space-y-2">
          {data?.incomeBySource.map((source) => (
            <div key={source.source} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-white/70">{source.source}</span>
              <span className="font-medium font-tabular">ZMW {source.amount.toLocaleString()}</span>
            </div>
          ))}
          {data?.incomeBySource.length === 0 && (
            <p className="text-white/40 text-center py-4">No data to export</p>
          )}
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
