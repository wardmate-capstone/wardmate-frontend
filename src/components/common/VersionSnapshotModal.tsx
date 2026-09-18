import React, { useState } from "react";
import {
  X,
  FileCode,
  Files,
  ListChecks,
  ChatText,
  CheckCircle,
  WarningCircle,
  XCircle,
  Clock,
  UserCircle,
  ArrowsCounterClockwise,
} from "@phosphor-icons/react";
import type { RevisionHistoryItem } from "@/types/application";

interface VersionSnapshotModalProps {
  revision: RevisionHistoryItem;
  onClose: () => void;
}

type SnapshotTab = "eform" | "documents" | "checklist" | "comments";

const ResultBadge: React.FC<{ result?: "approved" | "need_revision" | "pending" }> = ({ result }) => {
  if (result === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle size={13} weight="fill" /> Da duyet
      </span>
    );
  }
  if (result === "need_revision") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <WarningCircle size={13} weight="fill" /> Yeu cau bo sung
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
      <Clock size={13} weight="fill" /> Dang cho xet duyet
    </span>
  );
};

export const VersionSnapshotModal: React.FC<VersionSnapshotModalProps> = ({ revision, onClose }) => {
  const [activeTab, setActiveTab] = useState<SnapshotTab>("eform");
  const { snapshot } = revision;

  const tabs: Array<{ id: SnapshotTab; label: string; icon: React.ElementType; count?: number }> = [
    { id: "eform", label: "E-form", icon: FileCode, count: snapshot?.eformFields.length },
    { id: "documents", label: "Tai lieu", icon: Files, count: snapshot?.documents.length },
    { id: "checklist", label: "Checklist", icon: ListChecks },
    { id: "comments", label: "Nhan xet CB", icon: ChatText, count: snapshot?.officerComments.length || undefined },
  ];

  const fieldStatusStyle = (status: string) => {
    if (status === "valid") return "border-emerald-200 bg-emerald-50/40";
    if (status === "error") return "border-rose-300 bg-rose-50/40";
    if (status === "warning") return "border-amber-200 bg-amber-50/40";
    return "border-slate-200 bg-white";
  };

  const fieldStatusBadge = (status: string) => {
    if (status === "valid") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Hop le</span>;
    if (status === "error") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Loi</span>;
    if (status === "warning") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Canh bao</span>;
    return null;
  };

  const checklistStatusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />;
    if (status === "warning") return <WarningCircle size={18} weight="fill" className="text-amber-500 shrink-0" />;
    return <XCircle size={18} weight="fill" className="text-rose-600 shrink-0" />;
  };

  const docStatusLabel = (status: string) => {
    if (status === "valid") return "Hop le";
    if (status === "invalid") return "Khong dat";
    return "Cho duyet";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-white/15 text-white">
              <ArrowsCounterClockwise size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Xem lai Phien ban v{revision.version}</h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Nop luc: {revision.submittedAt}
                {revision.reviewedBy && ` • Tien kiem: ${revision.reviewedBy}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ResultBadge result={revision.result} />
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <p className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Tom tat: </span>
            {revision.summary}
          </p>
          {revision.officerNote && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <UserCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">
                <span className="font-bold">Ket luan Can bo: </span>
                {revision.officerNote}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-slate-200 shrink-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "border-slate-800 text-slate-900 bg-slate-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={14} weight={isActive ? "duotone" : "regular"} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!snapshot ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ArrowsCounterClockwise size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Khong co du lieu snapshot cho phien ban nay</p>
            </div>
          ) : (
            <>
              {activeTab === "eform" && (
                <div className="space-y-2">
                  {snapshot.eformFields.map((field) => (
                    <div key={field.key} className={`p-3.5 rounded-xl border ${fieldStatusStyle(field.status)}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</span>
                        {fieldStatusBadge(field.status)}
                      </div>
                      <p className={`text-sm font-bold ${field.value ? "text-slate-900" : "text-slate-400 italic"}`}>
                        {field.value || "(Khong co du lieu)"}
                      </p>
                      {field.officerComment && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <WarningCircle size={13} className="shrink-0 mt-0.5" />
                          <span>{field.officerComment}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-3">
                  {snapshot.documents.map((doc, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${
                      doc.status === "valid" ? "border-emerald-200 bg-emerald-50/40"
                      : doc.status === "invalid" ? "border-rose-300 bg-rose-50/40"
                      : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="grid size-9 place-items-center rounded-lg bg-white border border-slate-200 shrink-0">
                        <Files size={18} className="text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            doc.status === "valid" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : doc.status === "invalid" ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {docStatusLabel(doc.status)}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">{doc.fileType}</span>
                        </div>
                        {doc.officerComment && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                            <WarningCircle size={12} className="shrink-0 mt-0.5" />
                            <span>{doc.officerComment}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "checklist" && (
                <div className="space-y-2">
                  {snapshot.checklist.map((item) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                      item.status === "ok" ? "border-emerald-200 bg-emerald-50/40"
                      : item.status === "warning" ? "border-amber-200 bg-amber-50/40"
                      : "border-rose-300 bg-rose-50/40"
                    }`}>
                      {checklistStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        {item.officerNote && (
                          <p className="text-[11px] text-amber-800 mt-0.5 italic">{item.officerNote}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "comments" && (
                <div className="space-y-2">
                  {snapshot.officerComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <CheckCircle size={30} className="mb-2 text-emerald-400" weight="fill" />
                      <p className="text-sm font-medium">Khong co nhan xet cua can bo</p>
                      <p className="text-xs mt-1">Ho so phien ban nay khong phat sinh gop y</p>
                    </div>
                  ) : (
                    snapshot.officerComments.map((comment, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                        <div className="grid size-7 place-items-center rounded-lg bg-amber-200 text-amber-900 shrink-0 text-[11px] font-bold">{idx + 1}</div>
                        <p className="text-xs text-amber-900 leading-relaxed">{comment}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <p className="text-[11px] text-slate-400 mr-auto">Snapshot chi doc - Phien ban v{revision.version}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  );
};
