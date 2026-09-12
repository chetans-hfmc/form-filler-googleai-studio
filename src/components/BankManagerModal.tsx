import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Trash2, Edit3, ExternalLink, CheckCircle2, 
  AlertCircle, Search, Layers, Globe, Phone, X, Check, ArrowRight,
  ShieldAlert, RefreshCw, Landmark
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { BankRecord } from '../types';

interface BankManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank?: (bankCode: string) => void;
  currentSelectedBank?: string;
  onBanksUpdated?: (banks: BankRecord[]) => void;
}

export function BankManagerModal({
  isOpen,
  onClose,
  onSelectBank,
  currentSelectedBank,
  onBanksUpdated,
}: BankManagerModalProps) {
  const [banks, setBanks] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  // Status message
  const [status, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add / Edit form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBankCode, setEditingBankCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputShortName, setInputShortName] = useState('');
  const [inputType, setInputType] = useState<'Islamic' | 'Conventional' | 'Both'>('Both');
  const [inputWebsite, setInputWebsite] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [seedFormsCheckbox, setSeedFormsCheckbox] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [bankToDelete, setBankToDelete] = useState<BankRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch banks from API
  const fetchBanks = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (data.banks) {
        setBanks(data.banks);
        if (onBanksUpdated) {
          onBanksUpdated(data.banks);
        }
      }
    } catch (err: any) {
      console.error('Error fetching banks:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load banks from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
    }
  }, [isOpen]);

  const handleOpenAdd = () => {
    setEditingBankCode(null);
    setInputCode('');
    setInputName('');
    setInputShortName('');
    setInputType('Both');
    setInputWebsite('');
    setInputPhone('');
    setSeedFormsCheckbox(true);
    setShowFormModal(true);
    setStatusMessage(null);
  };

  const handleOpenEdit = (bank: BankRecord) => {
    setEditingBankCode(bank.code);
    setInputCode(bank.code);
    setInputName(bank.name);
    setInputShortName(bank.shortName || bank.code);
    setInputType(bank.type || 'Both');
    setInputWebsite(bank.website || '');
    setInputPhone(bank.supportPhone || '');
    setSeedFormsCheckbox(false);
    setShowFormModal(true);
    setStatusMessage(null);
  };

  const handleSubmitBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !inputName.trim()) {
      setStatusMessage({ type: 'error', text: 'Bank Code and Bank Full Name are required.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      if (editingBankCode) {
        // Edit existing bank
        const res = await fetch(`/api/banks/${editingBankCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newCode: inputCode.trim().toUpperCase(),
            name: inputName.trim(),
            shortName: inputShortName.trim() || inputCode.trim(),
            type: inputType,
            website: inputWebsite.trim(),
            supportPhone: inputPhone.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update bank');

        setStatusMessage({ type: 'success', text: `Updated bank "${inputName}" successfully.` });
        setShowFormModal(false);
        fetchBanks();
        if (onSelectBank && inputCode.trim().toUpperCase() !== editingBankCode) {
          onSelectBank(inputCode.trim().toUpperCase());
        }
      } else {
        // Create new bank
        const res = await fetch('/api/banks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: inputCode.trim().toUpperCase(),
            name: inputName.trim(),
            shortName: inputShortName.trim() || inputCode.trim(),
            type: inputType,
            website: inputWebsite.trim(),
            supportPhone: inputPhone.trim(),
            seedStandardForms: seedFormsCheckbox,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create bank');

        setStatusMessage({ 
          type: 'success', 
          text: `Bank "${inputName}" (${inputCode.toUpperCase()}) added with ${data.formsCreated || 0} standard forms!` 
        });
        setShowFormModal(false);
        fetchBanks();

        if (onSelectBank) {
          onSelectBank(inputCode.trim().toUpperCase());
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bankToDelete) return;
    setDeleting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/banks/${bankToDelete.code}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bank');

      setStatusMessage({ type: 'success', text: data.message || `Deleted bank ${bankToDelete.name}` });
      setBankToDelete(null);
      fetchBanks();

      // If user deleted currently selected bank, default to ADIB
      if (currentSelectedBank === bankToDelete.code && onSelectBank) {
        onSelectBank('ADIB');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const filteredBanks = banks.filter(b => {
    const matchesSearch = 
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'All') return matchesSearch;
    return matchesSearch && (b.type === filterType || b.type === 'Both');
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-0 w-[95vw] max-w-4xl max-h-[90vh] z-50 flex flex-col overflow-hidden border border-neutral-200">
          
          {/* Header */}
          <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white">
                  Lending Institutions & Banks Directory
                </Dialog.Title>
                <p className="text-xs text-neutral-400">
                  Add, edit, and manage UAE mortgage lending banks and their application form packages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank</span>
              </button>

              <button
                type="button"
                onClick={fetchBanks}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Refresh banks list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Dialog.Close className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          </div>

          {/* Search, Filter & Feedback bar */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by bank name or code (e.g. Mashreq, CBD, DIB)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 font-medium">Filter Type:</span>
              {(['All', 'Islamic', 'Conventional', 'Both'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterType === type 
                      ? 'bg-neutral-900 text-white shadow-xs' 
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Alert */}
          {status && (
            <div className={`mx-6 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{status.text}</span>
            </div>
          )}

          {/* Banks List Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loading && banks.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading registered banks...</span>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Building2 className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-sm font-medium text-neutral-700">No banks found matching your search</p>
                <p className="text-xs text-neutral-400">Click &quot;Add Bank&quot; above to register a new institution.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredBanks.map(b => {
                  const isCurrent = currentSelectedBank?.toUpperCase() === b.code.toUpperCase();

                  return (
                    <div
                      key={b.code}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300 shadow-xs' 
                          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs px-2 py-0.5 rounded bg-neutral-900 text-white font-mono">
                              {b.code}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              b.type === 'Islamic' 
                                ? 'bg-purple-100 text-purple-800'
                                : b.type === 'Conventional'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {b.type === 'Both' ? 'Islamic & Conventional' : b.type}
                            </span>
                          </div>

                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Currently Active
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-sm text-neutral-900 leading-tight">
                          {b.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 pt-1">
                          <span className="flex items-center gap-1 font-medium text-neutral-700">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            {b.formsCount || 0} application form{(b.formsCount !== 1) ? 's' : ''}
                          </span>

                          {b.website && (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors text-xs flex items-center gap-1"
                            title="Edit bank details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBankToDelete(b)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1"
                            title="Delete bank"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {onSelectBank && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectBank(b.code);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isCurrent
                                ? 'bg-neutral-200 text-neutral-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                            }`}
                          >
                            <span>{isCurrent ? 'Selected' : 'Select Bank'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
            <span>
              Total Institutions: <strong>{banks.length}</strong> | Standard forms auto-map applicant KYC, employment, liabilities & property.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg font-medium text-xs transition-colors"
            >
              Close Directory
            </button>
          </div>

          {/* Submodal: Add or Edit Bank */}
          {showFormModal && (
            <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-neutral-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-base text-neutral-900">
                      {editingBankCode ? `Edit ${editingBankCode}` : 'Add New Lending Institution'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmitBank} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Bank Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MASHREQ, CBD"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.toUpperCase())}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-400">Short unique identifier</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Financing Structure
                      </label>
                      <select
                        value={inputType}
                        onChange={e => setInputType(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Both">Both (Islamic & Conventional)</option>
                        <option value="Islamic">Islamic Finance Only</option>
                        <option value="Conventional">Conventional Mortgage Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Official Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Commercial Bank of Dubai (CBD)"
                      value={inputName}
                      onChange={e => setInputName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.cbd.ae"
                        value={inputWebsite}
                        onChange={e => setInputWebsite(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Support Contact (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="+971 600 522 223"
                        value={inputPhone}
                        onChange={e => setInputPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {!editingBankCode && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seedFormsCheckbox}
                          onChange={e => setSeedFormsCheckbox(e.target.checked)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-blue-900 block">
                            Auto-generate standard UAE mortgage form package
                          </span>
                          <span className="text-[11px] text-blue-700">
                            Creates 6 ready-to-use forms: Main Application, AECB Consent, Direct Debit Mandate (UAEDDS), Co-Applicant Undertaking, and Takaful / Insurance declaration.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingBankCode ? 'Save Changes' : 'Create Bank'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Submodal: Delete Bank Confirmation */}
          {bankToDelete && (
            <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">Delete {bankToDelete.name}?</h3>
                    <p className="text-xs text-rose-600 font-medium">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  Deleting <strong>{bankToDelete.name} ({bankToDelete.code})</strong> will also delete all of its configured forms ({bankToDelete.formsCount || 0} forms), visual coordinate maps, and uploaded template files.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBankToDelete(null)}
                    disabled={deleting}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {deleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{deleting ? 'Deleting...' : 'Delete Bank & Forms'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
