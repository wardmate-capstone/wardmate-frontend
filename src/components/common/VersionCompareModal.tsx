import React, { useState } from "react";
import {
  X,
  ArrowsLeftRight,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  XCircle,
  Files,
  FileCode,
  ListChecks,
} from "@phosphor-icons/react";
import type { RevisionHistoryItem } from "@/types/application";

interface VersionCompareModalProps {
  revisionHistory: RevisionHistoryItem[];
  defaultVersionA?: number;
  defaultVersionB?: number;
  onClose: () => void;
}

type CompareSection = "eform" | "documents" | "checklist";

const fieldStatusBadge = (status: string) => {
  if (status === "valid") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Hop le</span>;
  if (status === "error") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">Loi</span>;
  if (status === "warning") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Canh bao</span>;
  return null;
};

const docStatusBadge = (status: string) => {
  if (status === "valid") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Hop le</span>;
  if (status === "invalid") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">Khong dat</span>;
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">Cho duyet</span>;
};

const checklistStatusIcon = (status: string) => {
  if (status === "ok") return <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />;
  if (status === "warning") return <WarningCircle size={15} weight="fill" className="text-amber-500 shrink-0" />;
  return <XCircle size={15} weight="fill" className="text-rose-600 shrink-0" />;
};

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  revisionHistory,
  defaultVersionA,
  defaultVersionB,
  onClose,
}) => {
  const sortedHistory = [...revisionHistory].sort((a, b) => a.version - b.version);
  const [versionA, setVersionA] = useState(defaultVersionA ?? sortedHistory[0]?.version ?? 1);
  const [versionB, setVersionB] = useState(defaultVersionB ?? sortedHistory[sortedHistory.length - 1]?.version ?? 1);
  const [section, setSection] = useState<CompareSection>("eform");

  const revA = sortedHistory.find((r) => r.version === versionA);
  const revB = sortedHistory.find((r) => r.version === versionB);

  const snapA = revA?.snapshot;
  const snapB = revB?.snapshot;

  // Compute which eform fields differ
  const getFieldDiff = () => {
    if (!snapA || !snapB) return new Set<string>();
    const diffKeys = new Set<string>();
    snapA.eformFields.forEach((fa) => {
      const fb = snapB.eformFields.find((f) => f.key === fa.key);
      if (!fb || fb.value !== fa.value || fb.status !== fa.status) {
        diffKeys.add(fa.key);
      }
    });
    snapB.eformFields.forEach((fb) => {
      const fa = snapA.eformFields.find((f) => f.key === fb.key);
      if (!fa) diffKeys.add(fb.key);
    });
    return diffKeys;
  };

  const diffFields = getFieldDiff();

  const totalDiffs =
    diffFields.size +
    (snapA && snapB ? Math.abs(snapA.documents.length - snapB.documents.length) : 0);

  const sections: Array<{ id: CompareSection; label: string; icon: React.ElementType }> = [
    { id: "eform", label: "E-form", icon: FileCode },
    { id: "documents", label: "Tai lieu", icon: Files },
    { id: "checklist", label: "Checklist", icon: ListChecks },
  ];

  const versionSelectStyle = "h-9 pl-3 pr-8 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-white/15">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold">So sanh phien ban (What changed?)</h3>
              <p className="text-[11px] text-indigo-200 mt-0.5">Chon 2 phien ban de xem su khac biet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Version selectors */}
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900">Phien ban A (Cu):</span>
              <div className="relative">
                <select
                  value={versionA}
                  onChange={(e) => setVersionA(Number(e.target.value))}
                  className={versionSelectStyle}
                  style={{ background: 'white' }}
                >
                  {sortedHistory.map((r) => (
                    <option key={r.version} value={r.version}>
                      v{r.version} — {r.submittedAt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ArrowRight size={20} className="text-indigo-400" weight="bold" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900">Phien ban B (Moi):</span>
              <div className="relative">
                <select
                  value={versionB}
                  onChange={(e) => setVersionB(Number(e.target.value))}
                  className={versionSelectStyle}
                  style={{ background: 'white' }}
                >
                  {sortedHistory.map((r) => (
                    <option key={r.version} value={r.version}>
                      v{r.version} — {r.submittedAt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {versionA !== versionB && (
              <span className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-200 text-indigo-900">
                {totalDiffs} truong khac biet
              </span>
            )}
            {versionA === versionB && (
              <span className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full bg-slate-200 text-slate-600">
                Chon 2 phien ban khac nhau
              </span>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 px-6 pt-3 pb-0 border-b border-slate-200 shrink-0">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-indigo-700 text-indigo-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={14} weight={isActive ? "duotone" : "regular"} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Compare grid */}
        <div className="flex-1 overflow-hidden">
          {versionA === versionB ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ArrowsLeftRight size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Hay chon 2 phien ban khac nhau de so sanh</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-slate-200 h-full overflow-hidden">
              {/* Column A */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border-b border-rose-200 shrink-0">
                  <span className="grid size-6 place-items-center rounded-md bg-rose-700 text-white text-[10px] font-bold">A</span>
                  <span className="text-xs font-bold text-rose-900">Phien ban v{versionA}</span>
                  <span className="text-[11px] text-rose-700 ml-auto">{revA?.submittedAt}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {!snapA ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">Khong co snapshot</p>
                  ) : (
                    <>
                      {section === "eform" && snapA.eformFields.map((field) => {
                        const isDiff = diffFields.has(field.key);
                        return (
                          <div key={field.key} className={`p-3 rounded-xl border text-xs ${isDiff ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}`}>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{field.label}</span>
                              <div className="flex items-center gap-1">
                                {isDiff && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 font-bold">THAY DOI</span>}
                                {fieldStatusBadge(field.status)}
                              </div>
                            </div>
                            <p className={`font-bold ${isDiff ? "text-rose-800 line-through opacity-70" : "text-slate-900"} ${!field.value ? "italic text-slate-400" : ""}`}>
                              {field.value || "(trong)"}
                            </p>
                            {field.officerComment && (
                              <p className="text-[11px] text-rose-700 mt-1 italic">{field.officerComment}</p>
                            )}
                          </div>
                        );
                      })}

                      {section === "documents" && snapA.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                          <Files size={15} className="text-slate-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">{docStatusBadge(doc.status)}</div>
                            {doc.officerComment && <p className="text-[11px] text-rose-700 mt-1 italic">{doc.officerComment}</p>}
                          </div>
                        </div>
                      ))}

                      {section === "checklist" && snapA.checklist.map((item) => (
                        <div key={item.id} className={`flex items-start gap-2 p-3 rounded-xl border ${
                          item.status === "ok" ? "border-emerald-200 bg-emerald-50/40"
                          : item.status === "warning" ? "border-amber-200 bg-amber-50/40"
                          : "border-rose-300 bg-rose-50/40"
                        }`}>
                          {checklistStatusIcon(item.status)}
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            {item.officerNote && <p className="text-[11px] text-amber-800 italic mt-0.5">{item.officerNote}</p>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Column B */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 shrink-0">
                  <span className="grid size-6 place-items-center rounded-md bg-emerald-700 text-white text-[10px] font-bold">B</span>
                  <span className="text-xs font-bold text-emerald-900">Phien ban v{versionB}</span>
                  <span className="text-[11px] text-emerald-700 ml-auto">{revB?.submittedAt}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {!snapB ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">Khong co snapshot</p>
                  ) : (
                    <>
                      {section === "eform" && snapB.eformFields.map((field) => {
                        const fieldA = snapA?.eformFields.find((f) => f.key === field.key);
                        const isDiff = diffFields.has(field.key);
                        const isNew = !fieldA;
                        return (
                          <div key={field.key} className={`p-3 rounded-xl border text-xs ${isDiff || isNew ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{field.label}</span>
                              <div className="flex items-center gap-1">
                                {isDiff && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">DA SUA</span>}
                                {isNew && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 font-bold">MOI</span>}
                                {fieldStatusBadge(field.status)}
                              </div>
                            </div>
                            <p className={`font-bold ${isDiff || isNew ? "text-emerald-800" : "text-slate-900"} ${!field.value ? "italic text-slate-400" : ""}`}>
                              {field.value || "(trong)"}
                            </p>
                            {field.officerComment && (
                              <p className="text-[11px] text-rose-700 mt-1 italic">{field.officerComment}</p>
                            )}
                          </div>
                        );
                      })}

                      {section === "documents" && snapB.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                          <Files size={15} className="text-slate-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">{docStatusBadge(doc.status)}</div>
                            {doc.officerComment && <p className="text-[11px] text-rose-700 mt-1 italic">{doc.officerComment}</p>}
                          </div>
                        </div>
                      ))}

                      {section === "checklist" && snapB.checklist.map((item) => (
                        <div key={item.id} className={`flex items-start gap-2 p-3 rounded-xl border ${
                          item.status === "ok" ? "border-emerald-200 bg-emerald-50/40"
                          : item.status === "warning" ? "border-amber-200 bg-amber-50/40"
                          : "border-rose-300 bg-rose-50/40"
                        }`}>
                          {checklistStatusIcon(item.status)}
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            {item.officerNote && <p className="text-[11px] text-amber-800 italic mt-0.5">{item.officerNote}</p>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-rose-200 inline-block" /> Phien ban cu (A)</span>
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-emerald-200 inline-block" /> Phien ban moi (B)</span>
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-indigo-200 inline-block" /> Truong moi them</span>
          </div>
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
