import React, { useState } from 'react';
import {
  Brain,
  ArrowsClockwise,
  Scales,
  Question,
  FileText,
  Article
} from '@phosphor-icons/react';
import { AiKnowledgeSource } from '@/types/procedureManager';
import { mockAiKnowledgeSources } from '@/data/mockProcedureManagerData';

export const ProcedureAiKnowledgeView: React.FC = () => {
  const [sources, setSources] = useState<AiKnowledgeSource[]>(mockAiKnowledgeSources);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncSource = (id: string) => {
    setSources(prev =>
      prev.map(s => (s.id === id ? { ...s, syncStatus: 'SYNCING' } : s))
    );

    setTimeout(() => {
      setSources(prev =>
        prev.map(s =>
          s.id === id ? { ...s, syncStatus: 'SYNCED', lastUpdated: 'Vừa xong' } : s
        )
      );
    }, 1200);
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setSources(prev => prev.map(s => ({ ...s, syncStatus: 'SYNCING' })));

    setTimeout(() => {
      setIsSyncingAll(false);
      setSources(prev =>
        prev.map(s => ({ ...s, syncStatus: 'SYNCED', lastUpdated: 'Vừa xong' }))
      );
    }, 1800);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LEGAL_DOC':
        return Scales;
      case 'FAQ':
        return Question;
      case 'PROCEDURE_GUIDE':
        return FileText;
      default:
        return Article;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <section className="rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <Brain size={16} weight="fill" />
              <span>RAG Knowledge Base & AI Semantic Indexing</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Cơ sở Dữ liệu Tri thức AI (WardMate Intelligence)
            </h2>
            <p className="text-sm leading-relaxed text-purple-100/80">
              Quản lý các nguồn dữ liệu văn bản pháp luật, bộ câu hỏi FAQ và quy định nghiệp vụ được nạp vào mô hình AI để tự động hỗ trợ cán bộ tiền kiểm và giải đáp cho người dân.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-purple-600 disabled:opacity-50"
          >
            <ArrowsClockwise size={18} className={isSyncingAll ? 'animate-spin' : ''} weight="bold" />
            <span>{isSyncingAll ? 'Đang đồng bộ AI...' : 'Đồng bộ lại toàn bộ AI'}</span>
          </button>
        </div>
      </section>

      {/* Sources Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {sources.map((source) => {
          const Icon = getTypeIcon(source.type);
          const isSyncing = source.syncStatus === 'SYNCING';
          return (
            <div
              key={source.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-10 place-items-center rounded-2xl bg-purple-100 text-purple-800">
                      <Icon size={20} weight="duotone" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                        {source.type}
                      </span>
                      <h3 className="text-base font-bold text-slate-950">
                        {source.name}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isSyncing
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isSyncing ? '● Đang lập chỉ mục' : '● Đã đồng bộ'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  {source.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span>Số mục nạp: <strong>{source.itemCount} đối tượng</strong></span>
                  <span>Lần đồng bộ: <strong>{source.lastUpdated}</strong></span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleSyncSource(source.id)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-900 hover:bg-purple-100 disabled:opacity-50"
                >
                  <ArrowsClockwise size={15} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Đang index...' : 'Đồng bộ lại'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
