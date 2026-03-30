import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Upload,
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Train, 
  Bus, 
  Car, 
  Navigation, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  MapPin,
  JapaneseYen,
  Route,
  Bed,
  ArrowRight,
  Tag,
  FileText,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, TransportationMethod } from './types';
import { TRANSPORTATION_METHODS, STORAGE_KEY, CAR_REIMBURSEMENT_RATE } from './constants';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [method, setMethod] = useState<TransportationMethod>('電車');
  const [distance, setDistance] = useState('');
  const [cost, setCost] = useState('');
  const [tagId, setTagId] = useState('');
  const [note, setNote] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-calculate cost for Mileage
  useEffect(() => {
    if (method === '走行距離' && distance) {
      const calculated = Math.round(parseFloat(distance) * CAR_REIMBURSEMENT_RATE);
      setCost(calculated.toString());
    }
  }, [method, distance]);

  // Clear distance for methods that don't require it
  useEffect(() => {
    if (['電車', 'バス', 'タクシー', '宿泊費'].includes(method)) {
      setDistance('');
    }
  }, [method]);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load expenses', e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const monthMatch = d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      const tagMatch = filterTag ? e.tagId === filterTag : true;
      return monthMatch && tagMatch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, currentMonth, filterTag]);

  const totalCost = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.cost, 0);
  }, [filteredExpenses]);

  const totalDistance = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.distance, 0);
  }, [filteredExpenses]);

  const tagSummaries = useMemo(() => {
    const summaries: Record<string, { cost: number; distance: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      const tag = e.tagId || '未分類';
      if (!summaries[tag]) {
        summaries[tag] = { cost: 0, distance: 0, count: 0 };
      }
      summaries[tag].cost += e.cost;
      summaries[tag].distance += e.distance;
      summaries[tag].count += 1;
    });
    return Object.entries(summaries).map(([tag, data]) => ({ tag, ...data }));
  }, [filteredExpenses]);

  const dateSummaries = useMemo(() => {
    const summaries: Record<string, { cost: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      if (!summaries[e.date]) {
        summaries[e.date] = { cost: 0, count: 0 };
      }
      summaries[e.date].cost += e.cost;
      summaries[e.date].count += 1;
    });
    return Object.entries(summaries).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredExpenses]);

  const monthlySummaries = useMemo(() => {
    const summaries: Record<string, { cost: number; count: number }> = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
      if (!summaries[key]) {
        summaries[key] = { cost: 0, count: 0 };
      }
      summaries[key].cost += e.cost;
      summaries[key].count += 1;
    });
    return Object.entries(summaries).sort((a, b) => {
      // Sort by year and month descending
      const [yearA, monthA] = a[0].split('年 ').map(s => parseInt(s));
      const [yearB, monthB] = b[0].split('年 ').map(s => parseInt(s));
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });
  }, [expenses]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    expenses.forEach(e => {
      if (e.tagId) tags.add(e.tagId);
    });
    return Array.from(tags).sort();
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof expenses> = {};
    filteredExpenses.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date,
      departure,
      destination,
      method,
      distance: parseFloat(distance) || 0,
      cost: parseInt(cost) || 0,
      tagId,
      note
    };
    setExpenses([...expenses, newExpense]);
    setIsFormOpen(false);
    // Reset form
    setDeparture('');
    setDestination('');
    setDistance('');
    setCost('');
    setTagId('');
    setNote('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleClearAll = () => {
    setExpenses([]);
    setIsClearModalOpen(false);
  };

  const RECEIPT_REQUIRED_METHODS: TransportationMethod[] = ['タクシー', '高速道路利用料金', '宿泊費', 'その他'];

  const exportToCSV = () => {
    const headers = ['日付', '出発地', '目的地', '移動手段', '距離 (km)', '金額 (円)', 'タグID', '備考', '領収書'];
    const rows = filteredExpenses.map(e => [
      e.date,
      `"${e.departure}"`,
      `"${e.destination}"`,
      e.method,
      `${e.distance} km`,
      `${e.cost} 円`,
      `"${e.tagId || ''}"`,
      `"${e.note || ''}"`,
      RECEIPT_REQUIRED_METHODS.includes(e.method as TransportationMethod) ? '要' : '不要'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `交通費精算_${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const lines = content.split('\n');
      if (lines.length < 2) return;

      const newExpenses: Expense[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser that handles quotes
        const parts: string[] = [];
        let currentPart = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(currentPart);
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        parts.push(currentPart);

        if (parts.length >= 6) {
          const [date, departure, destination, method, distance, cost, tagId, note] = parts;
          newExpenses.push({
            id: Math.random().toString(36).substr(2, 9),
            date: date.trim(),
            departure: departure.trim(),
            destination: destination.trim(),
            method: method.trim() as TransportationMethod,
            distance: parseFloat(distance) || 0,
            cost: parseInt(cost) || 0,
            tagId: tagId?.trim() || undefined,
            note: note?.trim() || undefined
          });
        }
      }

      if (newExpenses.length > 0) {
        setExpenses(prev => [...prev, ...newExpenses]);
        alert(`${newExpenses.length}件のデータをインポートしました。`);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + offset);
    setCurrentMonth(next);
  };

  const copySummaryToClipboard = () => {
    const monthStr = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;
    
    // Filter only expenses with tags
    const expensesWithTags = filteredExpenses.filter(e => e.tagId);
    
    if (expensesWithTags.length === 0) {
      alert('タグに紐づいたデータがありません。');
      return;
    }

    const taggedTotalCost = expensesWithTags.reduce((sum, e) => sum + e.cost, 0);
    const taggedTotalDistance = expensesWithTags.reduce((sum, e) => sum + e.distance, 0);

    let text = `【交通費精算レポート（タグ別明細） - ${monthStr}】\n`;
    text += `タグ紐付け合計金額: ${taggedTotalCost.toLocaleString()} 円\n`;
    text += `タグ紐付け合計距離: ${taggedTotalDistance.toFixed(1)} km\n`;
    text += `対象件数: ${expensesWithTags.length} 件\n\n`;
    
    // Group by tag
    tagSummaries.forEach(s => {
      const tagExpenses = expensesWithTags.filter(e => e.tagId === s.tag);
      if (tagExpenses.length > 0) {
        text += `■ タグ: ${s.tag}\n`;
        text += `   小計: ${s.cost.toLocaleString()} 円 (${s.count}件)\n`;
        text += `   明細:\n`;
        tagExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
          const distanceStr = e.distance > 0 ? ` (${e.distance.toFixed(1)}km)` : '';
          const receiptStr = RECEIPT_REQUIRED_METHODS.includes(e.method as TransportationMethod) ? ' [領収書要]' : '';
          text += `   - ${e.date} | ${e.departure} → ${e.destination} | ${e.method}${distanceStr}${receiptStr} | ${e.cost.toLocaleString()}円\n`;
          if (e.note) text += `     備考: ${e.note}\n`;
        });
        text += `\n`;
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const getMethodIcon = (m: TransportationMethod) => {
    switch (m) {
      case '電車': return <Train size={16} />;
      case 'バス': return <Bus size={16} />;
      case 'タクシー': return <Car size={16} className="text-yellow-500" />;
      case '走行距離': return <Car size={16} />;
      case '高速道路利用料金': return <Route size={16} />;
      case '宿泊費': return <Bed size={16} />;
      default: return <MoreHorizontal size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F3] font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black">
              <Navigation size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">交通費トラッカー</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 rounded-full p-1">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 font-medium min-w-[120px] text-center">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </span>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <button 
              onClick={exportToCSV}
              disabled={filteredExpenses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-white/10 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-[#141414] disabled:hover:text-[#F5F5F3]"
            >
              <Download size={16} />
              CSV出力
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-white/10 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-all cursor-pointer">
              <Upload size={16} />
              CSVインポート
              <input 
                type="file" 
                accept=".csv" 
                onChange={importFromCSV} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] p-8 rounded-3xl border border-white/5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">合計金額</p>
            <p className="text-4xl font-light tracking-tighter">{totalCost.toLocaleString()} <span className="text-xl">円</span></p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#141414] p-8 rounded-3xl border border-white/5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">合計距離</p>
            <p className="text-4xl font-light tracking-tighter">{totalDistance.toFixed(1)} <span className="text-xl">km</span></p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl text-black shadow-xl flex flex-col justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2 text-black/50">登録件数</p>
              <p className="text-4xl font-light tracking-tighter">{filteredExpenses.length}</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus size={20} />
              新規登録
            </button>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'bg-[#141414] text-white/40 hover:bg-white/5'}`}
            >
              <FileText size={18} />
              明細一覧
            </button>
            <button 
              onClick={() => setViewMode('summary')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${viewMode === 'summary' ? 'bg-white text-black shadow-lg' : 'bg-[#141414] text-white/40 hover:bg-white/5'}`}
            >
              <BarChart3 size={18} />
              集計レポート
            </button>
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'summary' && (
              <button 
                onClick={copySummaryToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-white/10 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-all"
              >
                {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {isCopied ? 'コピー完了' : 'レポートをコピー'}
              </button>
            )}

            {filterTag && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">フィルタ中:</span>
              <span className="flex items-center gap-1 text-sm font-bold">
                <Tag size={12} />
                {filterTag}
              </span>
              <button 
                onClick={() => setFilterTag(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <Plus size={14} className="rotate-45" />
              </button>
            </motion.div>
          )}
          </div>
        </div>

        {viewMode === 'list' ? (
          /* Data List */
          <div className="bg-[#141414] rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">月間ログ</h2>
                <span className="text-sm text-white/40 font-medium">{filteredExpenses.length} 件のデータ</span>
              </div>
              {expenses.length > 0 && (
                <button 
                  onClick={() => setIsClearModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <Trash2 size={14} />
                  全データ削除
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#1F1F1F]">
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">区間 (出発地 → 目的地) / 備考</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">手段</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">タグ</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 text-right">距離</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 text-right">金額</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {groupedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-white/30 italic">
                          今月のデータはありません。「新規登録」から開始してください。
                        </td>
                      </tr>
                    ) : (
                      groupedExpenses.map(([date, items]) => (
                        <React.Fragment key={date}>
                          <tr className="bg-white/5">
                            <td colSpan={6} className="px-8 py-3 text-xs font-bold text-white/60 tracking-widest uppercase flex items-center gap-2">
                              <CalendarIcon size={12} />
                              {date}
                              <span className="ml-auto text-[10px] font-normal text-white/30">
                                {items.length} 件 | 合計 {items.reduce((sum, i) => sum + i.cost, 0).toLocaleString()} 円
                              </span>
                            </td>
                          </tr>
                          {items.map((expense) => (
                            <motion.tr 
                              key={expense.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="group border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <td className="px-8 py-5 font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{expense.departure || '-'}</span>
                                  <ArrowRight size={12} className="text-white/30" />
                                  <span>{expense.destination}</span>
                                </div>
                                {expense.note && (
                                  <span className="block text-[10px] text-white/40 font-normal mt-0.5">{expense.note}</span>
                                )}
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="p-1.5 bg-white/5 rounded-lg">
                                    {getMethodIcon(expense.method as TransportationMethod)}
                                  </span>
                                  {expense.method}
                                  {RECEIPT_REQUIRED_METHODS.includes(expense.method as TransportationMethod) && (
                                    <span className="text-[10px] text-red-500 font-bold bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/50">
                                      領収書要
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                {expense.tagId ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    <Tag size={10} />
                                    {expense.tagId}
                                  </span>
                                ) : (
                                  <span className="text-white/20 text-[10px]">-</span>
                                )}
                              </td>
                              <td className="px-8 py-5 text-right font-mono text-sm">
                                {expense.method === '宿泊費' ? '-' : `${expense.distance} km`}
                              </td>
                              <td className="px-8 py-5 text-right font-semibold">{expense.cost.toLocaleString()} 円</td>
                              <td className="px-8 py-5 text-center">
                                <button 
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Summary View */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tag Summary */}
              <div className="bg-[#141414] rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-lg font-semibold">タグ別集計 (ノート)</h2>
                </div>
                <div className="p-8">
                  {tagSummaries.length === 0 ? (
                    <p className="text-center text-white/30 italic py-10">データがありません</p>
                  ) : (
                    <div className="space-y-4">
                      {tagSummaries.map(summary => (
                        <button 
                          key={summary.tag} 
                          onClick={() => {
                            setFilterTag(summary.tag === '未分類' ? null : summary.tag);
                            setViewMode('list');
                          }}
                          className="w-full flex items-center justify-between p-4 bg-[#1F1F1F] rounded-2xl hover:bg-white/5 transition-all text-left group"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Tag size={14} className="text-white/40" />
                              <span className="font-bold">{summary.tag}</span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                              {summary.count} 件の明細
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-light tracking-tighter group-hover:scale-110 transition-transform origin-right">{summary.cost.toLocaleString()} 円</p>
                            {summary.distance > 0 && (
                              <p className="text-[10px] text-white/40 font-bold">{summary.distance.toFixed(1)} km</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Summary */}
              <div className="bg-[#141414] rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-lg font-semibold">日別集計 (今月)</h2>
                </div>
                <div className="p-8">
                  {dateSummaries.length === 0 ? (
                    <p className="text-center text-white/30 italic py-10">データがありません</p>
                  ) : (
                    <div className="space-y-4">
                      {dateSummaries.map(([date, data]) => (
                        <div key={date} className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-2xl">
                          <div>
                            <p className="font-mono font-bold">{date}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                              {data.count} 件
                            </p>
                          </div>
                          <p className="text-xl font-light tracking-tighter">{data.cost.toLocaleString()} 円</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Summary */}
              <div className="bg-[#141414] rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-lg font-semibold">月別集計 (全期間)</h2>
                </div>
                <div className="p-8">
                  {monthlySummaries.length === 0 ? (
                    <p className="text-center text-white/30 italic py-10">データがありません</p>
                  ) : (
                    <div className="space-y-4">
                      {monthlySummaries.map(([month, data]) => (
                        <div key={month} className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-2xl">
                          <div>
                            <p className="font-bold">{month}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                              {data.count} 件
                            </p>
                          </div>
                          <p className="text-xl font-light tracking-tighter">{data.cost.toLocaleString()} 円</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClearModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">全データを削除しますか？</h3>
                <p className="text-white/40 text-sm mb-8 leading-relaxed">
                  これまでに登録されたすべてのレコードが完全に削除されます。<br />
                  この操作は取り消すことができません。
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleClearAll}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    削除を確定する
                  </button>
                  <button 
                    onClick={() => setIsClearModalOpen(false)}
                    className="w-full py-4 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">新規交通費登録</h2>
                  {method === '走行距離' && (
                    <span className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full uppercase tracking-widest">
                      自動計算中 (¥{CAR_REIMBURSEMENT_RATE}/km)
                    </span>
                  )}
                </div>
                
                <form onSubmit={handleAddExpense} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">日付</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input 
                          type="date" 
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">移動手段</label>
                      <select 
                        value={method}
                        onChange={(e) => setMethod(e.target.value as TransportationMethod)}
                        className="w-full px-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all appearance-none text-white"
                      >
                        {TRANSPORTATION_METHODS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {RECEIPT_REQUIRED_METHODS.includes(method) && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-pulse">
                          ※領収書の提出が必要です
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">出発地</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input 
                          type="text" 
                          required={method !== '宿泊費'}
                          placeholder="例: 自宅、オフィス"
                          value={departure}
                          onChange={(e) => setDeparture(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">目的地</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input 
                          type="text" 
                          required
                          placeholder={method === '宿泊費' ? '例: ホテル名' : '例: オフィス、クライアント先'}
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">距離 (km)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        value={distance}
                        disabled={['電車', 'バス', 'タクシー', '宿泊費'].includes(method)}
                        onChange={(e) => setDistance(e.target.value)}
                        className={`w-full px-4 py-3 border-none rounded-2xl focus:ring-2 focus:ring-white transition-all ${['電車', 'バス', 'タクシー', '宿泊費'].includes(method) ? 'bg-white/5 text-white/50 cursor-not-allowed' : 'bg-[#1F1F1F] text-white'}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">金額 (円)</label>
                      <div className="relative">
                        <JapaneseYen className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input 
                          type="number" 
                          required
                          placeholder="0"
                          value={cost}
                          readOnly={method === '走行距離'}
                          onChange={(e) => setCost(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border-none rounded-2xl focus:ring-2 focus:ring-white transition-all ${method === '走行距離' ? 'bg-white/5 text-white/50 cursor-not-allowed' : 'bg-[#1F1F1F] text-white'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">タグID / ノート名 (任意)</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input 
                        type="text" 
                        placeholder="例: プロジェクトA、出張2024"
                        value={tagId}
                        list="tag-suggestions"
                        onChange={(e) => setTagId(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all text-white"
                      />
                      <datalist id="tag-suggestions">
                        {uniqueTags.map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">備考 (任意)</label>
                    <textarea 
                      placeholder="詳細を入力..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-none rounded-2xl focus:ring-2 focus:ring-white transition-all h-24 resize-none text-white"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-4 bg-[#1F1F1F] text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                    >
                      キャンセル
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                    >
                      保存
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
