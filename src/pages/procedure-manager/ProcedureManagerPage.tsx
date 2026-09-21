import React, { useState } from 'react';
import { ProcedureManagerSidebar, ProcedureNavSection } from './ProcedureManagerSidebar';
import { ProcedureManagerHeader } from './ProcedureManagerHeader';
import { ProcedureDashboardView } from './ProcedureDashboardView';
import { ProcedureListView } from './ProcedureListView';
import { ProcedureDetailView } from './ProcedureDetailView';
import { ProcedureWizardModal } from './ProcedureWizardModal';
import { ProcedureCategoriesView } from './ProcedureCategoriesView';
import { ProcedureChecklistsView } from './ProcedureChecklistsView';
import { ProcedureStepsView } from './ProcedureStepsView';
import { ProcedureFormsView } from './ProcedureFormsView';
import { ProcedureLegalView } from './ProcedureLegalView';
import { ProcedureAiKnowledgeView } from './ProcedureAiKnowledgeView';
import { ProcedureAuditLogView } from './ProcedureAuditLogView';
import { ProcedureProfileView } from './ProcedureProfileView';
import { ProcedureItem, ProcedureStatus } from '@/types/procedureManager';
import { mockProcedures } from '@/data/mockProcedureManagerData';

export const ProcedureManagerPage: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<ProcedureNavSection>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active selected procedure for Detail View
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureItem | null>(null);

  // Wizard modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureItem | null>(null);

  // Global procedure list in memory
  const [procedures, setProcedures] = useState<ProcedureItem[]>(mockProcedures);

  const handleOpenCreateWizard = () => {
    setEditingProcedure(null);
    setIsWizardOpen(true);
  };

  const handleOpenEditWizard = (proc: ProcedureItem) => {
    setEditingProcedure(proc);
    setIsWizardOpen(true);
  };

  const handleSaveProcedure = (proc: ProcedureItem) => {
    setProcedures(prev => {
      const exists = prev.some(p => p.id === proc.id);
      if (exists) {
        return prev.map(p => (p.id === proc.id ? proc : p));
      }
      return [proc, ...prev];
    });

    if (selectedProcedure && selectedProcedure.id === proc.id) {
      setSelectedProcedure(proc);
    }
  };

  const handleStatusChange = (id: string, newStatus: ProcedureStatus) => {
    setProcedures(prev =>
      prev.map(p => (p.id === id ? { ...p, status: newStatus, updatedAt: 'Hôm nay' } : p))
    );
    if (selectedProcedure && selectedProcedure.id === id) {
      setSelectedProcedure(prev => prev ? { ...prev, status: newStatus, updatedAt: 'Hôm nay' } : null);
    }
  };

  const handleSelectProcedure = (proc: ProcedureItem) => {
    setSelectedProcedure(proc);
  };

  const handleBackToList = () => {
    setSelectedProcedure(null);
    setCurrentSection('procedures');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-gold-200 selection:text-red-950">
      {/* Sidebar */}
      <ProcedureManagerSidebar
        currentSection={currentSection}
        onSelectSection={(section) => {
          setCurrentSection(section);
          setSelectedProcedure(null); // Reset detail view on nav switch
        }}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        publishedCount={procedures.filter(p => p.status === 'PUBLISHED').length}
        draftCount={procedures.filter(p => p.status === 'DRAFT').length}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <ProcedureManagerHeader
          currentSection={currentSection}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          isCollapsedDesktop={isCollapsedDesktop}
          onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
          onAddNewProcedure={handleOpenCreateWizard}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Views */}
        <main className="flex-1 overflow-x-hidden focus:outline-none">
          {/* If a procedure is selected, show Detail Workspace regardless of section */}
          {selectedProcedure ? (
            <ProcedureDetailView
              procedure={selectedProcedure}
              onBack={handleBackToList}
              onEdit={handleOpenEditWizard}
              onStatusChange={handleStatusChange}
              onCreateNewVersion={(p) => {
                const nextVer = `V${parseInt(p.version.replace('V', '') || '1', 10) + 1}`;
                const updated: ProcedureItem = {
                  ...p,
                  version: nextVer,
                  status: 'DRAFT',
                  updatedAt: 'Hôm nay'
                };
                handleSaveProcedure(updated);
                alert(`Đã tạo phiên bản mới ${nextVer} (Bản nháp).`);
              }}
            />
          ) : (
            <>
              {currentSection === 'dashboard' && (
                <ProcedureDashboardView
                  onNavigateSection={(sec) => setCurrentSection(sec)}
                  onSelectProcedure={handleSelectProcedure}
                  onOpenCreateWizard={handleOpenCreateWizard}
                />
              )}

              {currentSection === 'procedures' && (
                <ProcedureListView
                  onSelectProcedure={handleSelectProcedure}
                  onOpenCreateWizard={handleOpenCreateWizard}
                  onEditProcedure={handleOpenEditWizard}
                />
              )}

              {currentSection === 'categories' && <ProcedureCategoriesView />}
              {currentSection === 'checklists' && <ProcedureChecklistsView />}
              {currentSection === 'steps' && <ProcedureStepsView />}

              {currentSection === 'forms' && <ProcedureFormsView key="forms-list" initialMode="list" />}
              {currentSection === 'upload-form' && <ProcedureFormsView key="forms-upload" initialMode="upload" />}
              {currentSection === 'form-versions' && <ProcedureFormsView key="forms-versions" initialMode="versions" />}
              {currentSection === 'attach-forms' && <ProcedureFormsView key="forms-attach" initialMode="attach" />}

              {currentSection === 'legal-docs' && <ProcedureLegalView />}
              {currentSection === 'procedure-legal-links' && <ProcedureLegalView />}

              {currentSection === 'ai-knowledge' && <ProcedureAiKnowledgeView />}
              {currentSection === 'audit-logs' && <ProcedureAuditLogView />}
              {currentSection === 'profile' && <ProcedureProfileView />}
            </>
          )}
        </main>
      </div>

      {/* 8-Step Wizard Modal for Creating/Editing Procedures */}
      <ProcedureWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleSaveProcedure}
        initialProcedure={editingProcedure}
      />
    </div>
  );
};
