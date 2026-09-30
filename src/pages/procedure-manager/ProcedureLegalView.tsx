import React, { useState } from 'react';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { LegalDocument, LegalDocType } from '@/types/procedureManager';
import { mockLegalDocuments } from '@/data/mockProcedureManagerData';

export const ProcedureLegalView: React.FC = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>(mockLegalDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // New doc form state
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<LegalDocType>('NGHI_DINH');
  const [newIssuingAuth, setNewIssuingAuth] = useState('Chính phủ');

  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      searchQuery.trim() === '' ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedType === 'ALL' || doc.docType === selectedType;
    return matchSearch && matchType;
  });

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocNumber.trim() || !newDocTitle.trim()) return;

    const newDoc: LegalDocument = {
      id: `leg_${Date.now()}`,
      docNumber: newDocNumber.trim(),
      title: newDocTitle.trim(),
      docType: newDocType,
      issuingAuthority: newIssuingAuth,
      issuedDate: '21/09/2026',
      effectiveDate: '01/10/2026',
      status: 'VALID',
      linkedProcedureCount: 1
    };

    setDocuments([newDoc, ...documents]);
    setIsAddingDoc(false);
    setNewDocNumber('');
    setNewDocTitle('');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
            VĂN BẢN QUY PHẠM PHÁP LUẬT
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingDoc(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-900"
        >
          <Plus size={16} weight="bold" />
          <span>+ Thêm văn bản mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 admin-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo số hiệu (123/2015/NĐ-CP), tên văn bản..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="ALL">Tất cả loại văn bản</option>
            <option value="LUAT">Luật</option>
            <option value="NGHI_DINH">Nghị định</option>
            <option value="THONG_TU">Thông tư</option>
            <option value="QUYET_DINH">Quyết định</option>
          </select>
        </div>
      </div>

      {/* Add Document Modal / Drawer */}
      {isAddingDoc && (
        <form onSubmit={handleCreateDoc} className="rounded-3xl border border-red-200 bg-red-50/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950">THÊM VĂN BẢN PHÁP LÝ MỚI</h3>
            <button
              type="button"
              onClick={() => setIsAddingDoc(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Hủy
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Số hiệu văn bản *</label>
              <input
                type="text"
                required
                value={newDocNumber}
                onChange={(e) => setNewDocNumber(e.target.value)}
                placeholder="VD: 104/2022/NĐ-CP"
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Loại văn bản</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as LegalDocType)}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="LUAT">Luật</option>
                <option value="NGHI_DINH">Nghị định</option>
                <option value="THONG_TU">Thông tư</option>
                <option value="QUYET_DINH">Quyết định</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Cơ quan ban hành</label>
              <input
                type="text"
                value={newIssuingAuth}
                onChange={(e) => setNewIssuingAuth(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Trích yếu / Tên văn bản *</label>
            <input
              type="text"
              required
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="VD: Nghị định sửa đổi, bổ sung một số điều liên quan đến xuất trình sổ hộ khẩu..."
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingDoc(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900"
            >
              Lưu văn bản
            </button>
          </div>
        </form>
      )}

      {/* Main Table */}
      <div className="admin-card overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Số hiệu văn bản</th>
              <th className="px-4 py-3.5">Tên văn bản</th>
              <th className="px-4 py-3.5">Loại</th>
              <th className="px-4 py-3.5">Ban hành</th>
              <th className="px-4 py-3.5">Hiệu lực</th>
              <th className="px-4 py-3.5 text-center">Liên kết thủ tục</th>
              <th className="px-5 py-3.5 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-mono font-bold text-red-900 whitespace-nowrap">
                  {doc.docNumber}
                </td>
                <td className="px-4 py-4 max-w-sm">
                  <p className="font-bold text-slate-950">{doc.title}</p>
                  <p className="text-[11px] text-slate-400">Cơ quan: {doc.issuingAuthority}</p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-700">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {doc.docType}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                  {doc.issuedDate}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                  {doc.effectiveDate}
                </td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                    {doc.linkedProcedureCount || 1} thủ tục
                  </span>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    Còn hiệu lực
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
