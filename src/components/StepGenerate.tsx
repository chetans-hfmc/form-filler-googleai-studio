import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, CheckCircle, FileCheck2, AlertCircle, 
  Settings, CheckSquare, Square, Layers, Sparkles, FileText, 
  ShieldCheck, CreditCard, Users, ExternalLink, RefreshCw,
  Landmark, Building2, Plus
} from 'lucide-react';
import { FormData, BankFormItem, BankRecord } from '../types';
import { BankManagerModal } from './BankManagerModal';

export function StepGenerate({ 
  data, 
  update,
  onOpenAdmin 
}: { 
  data: FormData; 
  update: (d: Partial<FormData>) => void;
  onOpenAdmin?: () => void;
}) {
  const [banksList, setBanksList] = useState<BankRecord[]>([]);
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);
  const [bankForms, setBankForms] = useState<BankFormItem[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [singleGeneratingId, setSingleGeneratingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fetch registered lending institutions
  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      const json = await res.json();
      if (json.banks && Array.isArray(json.banks)) {
        setBanksList(json.banks);
        // If current bank not in list, select first available
        if (!json.banks.some((b: BankRecord) => b.code.toUpperCase() === data.selectedBank.toUpperCase()) && json.banks.length > 0) {
          update({ selectedBank: json.banks[0].code });
        }
      }
    } catch (err) {
      console.error('Error fetching banks in StepGenerate:', err);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // Fetch all forms available for the selected bank & finance type
  const fetchBankForms = async () => {
    setLoadingForms(true);
    setError('');
    try {
      const res = await fetch(`/api/forms?bank=${data.selectedBank}&formType=${data.selectedFormType}`);
      const json = await res.json();
      if (json.forms) {
        setBankForms(json.forms);

        // Smart default selection:
        // Always select Main Application, AECB Consent, and Direct Debit
        // If co-applicant exists, select Co-Applicant Undertaking form as well
        const defaultSelected = json.forms
          .filter((f: BankFormItem) => {
            if (f.category === 'Application') return true;
            if (f.category === 'Consent') return true;
            if (f.category === 'Banking') return true;
            if (f.category === 'Undertaking' && data.hasCoApplicant) return true;
            return false;
          })
          .map((f: BankFormItem) => f.id);

        setSelectedFormIds(defaultSelected.length > 0 ? defaultSelected : json.forms.map((f: BankFormItem) => f.id));
      }
    } catch (err: any) {
      console.error('Error fetching bank forms:', err);
      setError('Failed to load bank forms. Please ensure dev server is running.');
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    fetchBankForms();
  }, [data.selectedBank, data.selectedFormType, data.hasCoApplicant]);

  const toggleFormSelection = (id: string) => {
    setSelectedFormIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedFormIds(bankForms.map(f => f.id));
  const deselectAll = () => setSelectedFormIds([]);

  // Generate and download a single filled form
  const handleGenerateSingle = async (form: BankFormItem, mode: 'download' | 'print' = 'download') => {
    setSingleGeneratingId(form.id);
    setError('');
    setDownloadSuccess(null);

    try {
      const response = await fetch(`/api/generate-form/${form.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to generate ${form.name}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (mode === 'print') {
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        const applicantName = `${data.firstName || 'Applicant'}_${data.lastName || ''}`.trim();
        a.download = `${data.selectedBank}_${form.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${applicantName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloadSuccess(`Downloaded "${form.name}" successfully!`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSingleGeneratingId(null);
    }
  };

  // Generate merged complete submission package
  const handleGeneratePackage = async () => {
    if (selectedFormIds.length === 0) {
      setError('Please select at least one form to generate.');
      return;
    }

    setGeneratingPackage(true);
    setError('');
    setDownloadSuccess(null);

    try {
      const response = await fetch('/api/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          selectedFormIds,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate package');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const applicantName = `${data.firstName || 'Applicant'}_${data.lastName || ''}`.trim();
      a.download = `${data.selectedBank}_${applicantName}_Full_Submission_Package.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(`Generated and downloaded ${selectedFormIds.length} forms in unified PDF package!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingPackage(false);
    }
  };

  const getCategoryBadge = (category: BankFormItem['category']) => {
    switch (category) {
      case 'Application':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Primary Application</span>;
      case 'Consent':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">AECB Consent</span>;
      case 'Banking':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">UAEDDS Mandate</span>;
      case 'Insurance':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Takaful / Insurance</span>;
      case 'Undertaking':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Co-Applicant Undertaking</span>;
      default:
        return <span className="bg-neutral-100 text-neutral-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Bank Form</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Bank & Product Header */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Bank & Submission Configuration</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select destination bank, product type, and forms to populate.
            </p>
          </div>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors border border-neutral-200"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>Manage Bank Forms & Mappings</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Target Lending Institution
              </label>
              <button
                type="button"
                onClick={() => setIsBankManagerOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add / Manage Banks</span>
              </button>
            </div>
            <select 
              value={data.selectedBank} 
              onChange={(e) => {
                if (e.target.value === '__MANAGE_BANKS__') {
                  setIsBankManagerOpen(true);
                } else {
                  update({ selectedBank: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-neutral-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-sm"
            >
              {banksList.length > 0 ? (
                banksList.map(b => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name} ({b.formsCount || 0} forms)
                  </option>
                ))
              ) : (
                <>
                  <option value="ADIB">Abu Dhabi Islamic Bank (ADIB)</option>
                  <option value="DIB">Dubai Islamic Bank (DIB)</option>
                  <option value="ENBD">Emirates NBD</option>
                  <option value="FAB">First Abu Dhabi Bank (FAB)</option>
                  <option value="ADCB">Abu Dhabi Commercial Bank (ADCB)</option>
                </>
              )}
              <option value="__MANAGE_BANKS__">+ Add / Manage More Banks...</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
              Financing Structure
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors flex-1">
                <input 
                  type="radio" 
                  name="formType" 
                  value="Islamic" 
                  checked={data.selectedFormType === 'Islamic'}
                  onChange={() => update({ selectedFormType: 'Islamic' })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">Islamic Finance</span>
                  <span className="text-[10px] text-neutral-500">Ijarah / Murabaha</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors flex-1">
                <input 
                  type="radio" 
                  name="formType" 
                  value="Non-Islamic" 
                  checked={data.selectedFormType === 'Non-Islamic'}
                  onChange={() => update({ selectedFormType: 'Non-Islamic' })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">Conventional</span>
                  <span className="text-[10px] text-neutral-500">Standard Mortgage</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Checklist Section */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-base font-semibold text-neutral-900">
                Forms to Generate for {data.selectedBank}
              </h4>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select which documents to include in the submission package.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50"
            >
              Select All
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-neutral-500 hover:text-neutral-700 font-medium px-2 py-1 rounded hover:bg-neutral-100"
            >
              Deselect All
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={fetchBankForms}
              className="text-neutral-500 hover:text-neutral-700 p-1 rounded hover:bg-neutral-100"
              title="Refresh forms list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingForms ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Forms List */}
        {loadingForms ? (
          <div className="py-8 text-center text-neutral-500 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading bank forms...</span>
          </div>
        ) : bankForms.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-neutral-500">No forms currently configured for {data.selectedBank}.</p>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Configure Forms in Admin Panel
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {bankForms.map(form => {
              const isSelected = selectedFormIds.includes(form.id);
              const isGeneratingSingle = singleGeneratingId === form.id;
              const mappedCount = form.visualMappings?.length || 0;

              return (
                <div
                  key={form.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected 
                      ? 'bg-blue-50/40 border-blue-200 shadow-xs' 
                      : 'bg-neutral-50/40 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div 
                    onClick={() => toggleFormSelection(form.id)}
                    className="flex items-start gap-3 cursor-pointer flex-1 select-none"
                  >
                    <div className="mt-0.5 text-blue-600">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-50" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-900 leading-tight">
                          {form.name}
                        </span>
                        {getCategoryBadge(form.category)}
                      </div>

                      {form.description && (
                        <p className="text-xs text-neutral-500">
                          {form.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                        <span>📄 {form.pageCount || 1} page{form.pageCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className={mappedCount > 0 ? 'text-emerald-600 font-medium' : 'text-neutral-400'}>
                          📍 {mappedCount > 0 ? `${mappedCount} fields coordinate-mapped` : 'Standard layout'}
                        </span>
                        <span>•</span>
                        <span>
                          {form.hasFile ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1 inline-flex">
                              <CheckCircle className="w-3 h-3" /> Official Bank Template
                            </span>
                          ) : (
                            <span className="text-blue-600 font-medium">Auto-Structured PDF</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Form Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGenerateSingle(form, 'print')}
                      disabled={isGeneratingSingle}
                      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg border border-neutral-200 transition-colors shadow-xs"
                      title="Print this form"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateSingle(form, 'download')}
                      disabled={isGeneratingSingle}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors shadow-xs"
                    >
                      {isGeneratingSingle ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>Download Form</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Co-Applicant Helper Alert */}
        {data.hasCoApplicant ? (
          <div className="p-3 bg-blue-50/70 text-blue-900 rounded-xl border border-blue-200 text-xs flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Joint Application Detected:</strong> Co-Applicant particulars for <strong>{data.coAppFirstName} {data.coAppLastName}</strong> will be pre-filled automatically on applicable undertaking forms.
            </span>
          </div>
        ) : (
          <div className="p-3 bg-neutral-50 text-neutral-600 rounded-xl border border-neutral-200 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>
              Single applicant submission for <strong>{data.firstName} {data.lastName}</strong>.
            </span>
          </div>
        )}
      </div>

      {/* Notifications: Error or Success */}
      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-between gap-2.5 text-xs border border-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{downloadSuccess}</span>
          </div>
        </div>
      )}

      {/* Primary Action Button: Merged Package */}
      <div className="flex flex-col items-center justify-center p-6 bg-neutral-900 text-white rounded-2xl shadow-xl space-y-4">
        <div className="text-center space-y-1">
          <h4 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Download Complete Bank Submission Package
          </h4>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            Combines all {selectedFormIds.length} selected forms into a single, merged, multi-page PDF ready for submission to {data.selectedBank} underwriters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePackage}
          disabled={generatingPackage || selectedFormIds.length === 0}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generatingPackage ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Assembling & Merging {selectedFormIds.length} Forms...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Complete Package ({selectedFormIds.length} Forms)</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-neutral-400">
          All client KYC, employment, liabilities, and coordinates are smartly populated across each form.
        </p>
      </div>

      {/* Lending Institutions Directory & CRUD Modal */}
      <BankManagerModal
        isOpen={isBankManagerOpen}
        onClose={() => setIsBankManagerOpen(false)}
        currentSelectedBank={data.selectedBank}
        onSelectBank={(newBankCode) => {
          update({ selectedBank: newBankCode });
          fetchBanks();
        }}
        onBanksUpdated={(updated) => {
          setBanksList(updated);
        }}
      />
    </div>
  );
}
