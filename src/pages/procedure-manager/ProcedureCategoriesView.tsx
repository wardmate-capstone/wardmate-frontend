import React, { useState } from 'react';
import { FolderSimple, Plus } from '@phosphor-icons/react';
import { ProcedureCategory } from '@/types/procedureManager';
import { mockProcedureCategories } from '@/data/mockProcedureManagerData';

export const ProcedureCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<ProcedureCategory[]>(mockProcedureCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: ProcedureCategory = {
      id: `cat_${Date.now()}`,
      code: code.trim().toUpperCase() || 'LINH_VUC',
      name: name.trim(),
      description: description.trim(),
      procedureCount: 0
    };

    setCategories([...categories, newCat]);
    setIsAdding(false);
    setName('');
    setCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            DANH MỤC LĨNH VỰC THỦ TỤC
          </h2>
          <p className="text-xs text-slate-500">
            Phân loại lĩnh vực quản lý nhà nước cấp xã / phường phục vụ tra cứu và thống kê
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-900"
        >
          <Plus size={16} weight="bold" />
          <span>+ Thêm danh mục mới</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCategory} className="rounded-3xl border border-red-200 bg-red-50/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-950">THÊM DANH MỤC THỦ TỤC MỚI</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Mã danh mục *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: TU_PHAP, Y_TE"
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Tên danh mục *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tư pháp - Hộ tịch"
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả phạm vi lĩnh vực</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả các thủ tục thuộc danh mục..."
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900"
            >
              Lưu danh mục
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 transition-all hover:border-red-200"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-red-50 text-red-900 font-extrabold text-sm">
                <FolderSimple size={22} weight="duotone" />
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {cat.procedureCount} thủ tục
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
                {cat.code}
              </span>
              <h3 className="text-base font-bold text-slate-950">{cat.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
