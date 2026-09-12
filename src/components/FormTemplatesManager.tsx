import React, { useState, useEffect, useMemo } from 'react';
import {
  BookmarkCheck,
  BookmarkPlus,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit3,
  Check,
  Search,
  RefreshCw,
  Eye,
  Sparkles,
  User,
  Briefcase,
  Building2,
  Home,
  CreditCard,
  ArrowRight,
  X,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { FormData, FormTemplateRecord, FormTemplateCategory } from '../types';

interface FormTemplatesManagerProps {
  currentFormData: FormData;
  onApplyTemplate: (templateData: Partial<FormData>, templateName: string) => void;
  onClose?: () => void;
}

const CATEGORY_STYLES: Record<FormTemplateCategory, { bg: string; text: string; border: string }> = {
  Salaried: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Self-Employed': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Executive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Investor: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Non-Resident': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Joint: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Custom: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' }
};

const CATEGORIES_LIST: Array<'All' | FormTemplateCategory> = [
  'All',
  'Salaried',
  'Self-Employed',
  'Joint',
  'Executive',
  'Non-Resident',
  'Custom'
];

export function FormTemplatesManager({
  currentFormData,
  onApplyTemplate,
  onClose
}: FormTemplatesManagerProps) {
  const [templates, setTemplates] = useState<FormTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'All' | FormTemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Save new template modal/drawer state
  const [isSaveDrawerOpen, setIsSaveDrawerOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<FormTemplateCategory>('Salaried');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateTags, setNewTemplateTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit template modal state
  const [editingTemplate, setEditingTemplate] = useState<FormTemplateRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<FormTemplateCategory>('Custom');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplateRecord | null>(null);

  // Status feedback toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch templates from server
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/form-templates');
      const data = await res.json();
      if (data.templates && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
    } catch (err: any) {
      console.error('Error loading form templates:', err);
      showNotification('error', 'Failed to load templates from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Compute number of non-empty fields in currentFormData
  const currentPopulatedFieldsCount = useMemo(() => {
    let count = 0;
    if (!currentFormData) return 0;
    Object.entries(currentFormData).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined && val !== false) {
        count++;
      }
    });
    return count;
  }, [currentFormData]);

  // Handle Save Current Form as Snapshot Template
  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      showNotification('error', 'Please provide a name for this template');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = newTemplateTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          category: newTemplateCategory,
          description: newTemplateDesc.trim(),
          tags: tagsArray,
          data: currentFormData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');

      setTemplates(prev => [data.template, ...prev]);
      setIsSaveDrawerOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateTags('');
      showNotification('success', `Saved template "${data.template.name}" successfully!`);
    } catch (err: any) {
      console.error('Save template error:', err);
      showNotification('error', err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Update Template
  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editName.trim()) return;

    setIsUpdating(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/form-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory,
          description: editDesc.trim(),
          tags: tagsArray
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update template');

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data.template : t));
      setEditingTemplate(null);
      showNotification('success', `Updated template "${data.template.name}"`);
    } catch (err: any) {
      console.error('Update template error:', err);
      showNotification('error', err.message || 'Failed to update template');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async (template: FormTemplateRecord) => {
    if (!window.confirm(`Are you sure you want to delete template "${template.name}"?`)) return;

    try {
      const res = await fetch(`/api/form-templates/${template.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete template');

      setTemplates(prev => prev.filter(t => t.id !== template.id));
      showNotification('success', `Deleted template "${template.name}"`);
    } catch (err: any) {
      console.error('Delete template error:', err);
      showNotification('error', err.message || 'Failed to delete template');
    }
  };

  // Handle Duplicate Template
  const handleDuplicateTemplate = async (template: FormTemplateRecord) => {
    try {
      const res = await fetch('/api/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          category: template.category,
          description: template.description,
          tags: template.tags,
          data: template.data
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate template');

      setTemplates(prev => [data.template, ...prev]);
      showNotification('success', `Duplicated "${template.name}"`);
    } catch (err: any) {
      console.error('Duplicate template error:', err);
      showNotification('error', err.message || 'Failed to duplicate template');
    }
  };

  // Handle Reset to Defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset templates to factory defaults? Custom templates will be preserved.')) return;

    try {
      const res = await fetch('/api/form-templates/reset-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preserveCustom: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset templates');

      setTemplates(data.templates);
      showNotification('success', 'Reset built-in templates to default specifications.');
    } catch (err: any) {
      console.error('Reset error:', err);
      showNotification('error', err.message || 'Failed to reset default templates');
    }
  };

  // Export templates as JSON
  const handleExportTemplates = () => {
    const jsonStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HomeFinance_Templates_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', `Exported ${templates.length} templates as JSON file.`);
  };

  // Import templates from JSON
  const handleImportTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('File must contain a valid JSON array of templates');

        const res = await fetch('/api/form-templates/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templates: parsed })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');

        setTemplates(data.templates);
        showNotification('success', `Successfully imported ${data.importedCount} templates.`);
      } catch (err: any) {
        console.error('Import error:', err);
        showNotification('error', err.message || 'Invalid template JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCategory = selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCategory && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 overflow-hidden">
      {/* Top Banner / Controls */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Form Templates Management Studio
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium">
              {templates.length} saved
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Capture live form snapshots as reusable profiles (e.g. Salaried, Self-Employed, Joint Borrowers) for instant 1-click loading.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              // Pre-fill name suggestion based on current data
              const applicantName = `${currentFormData.firstName || ''} ${currentFormData.lastName || ''}`.trim();
              setNewTemplateName(applicantName ? `${applicantName} Profile` : 'New Custom Profile');
              setNewTemplateCategory(currentFormData.officeCompany ? 'Salaried' : 'Custom');
              setNewTemplateDesc(`Snapshot created from current form with ${currentPopulatedFieldsCount} populated fields.`);
              setIsSaveDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Save the current active inputs as a reusable template"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save Current Form as Template</span>
            <span className="ml-1 px-1.5 py-0.2 bg-blue-700/80 rounded text-[10px] font-mono">
              {currentPopulatedFieldsCount} fields
            </span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
          </label>

          <button
            onClick={handleExportTemplates}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
            title="Export templates as JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
            title="Restore default factory templates"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Reset Built-Ins</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between transition-all border-b ${
          notification.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' :
          notification.type === 'error' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
          'bg-blue-950/80 text-blue-300 border-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="px-6 py-3 bg-neutral-850 border-b border-neutral-750 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES_LIST.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All' 
              ? templates.length 
              : templates.filter(t => t.category.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-semibold ring-1 ring-blue-400'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1 rounded-full font-mono ${isSelected ? 'bg-blue-800 text-white' : 'bg-neutral-700 text-neutral-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search templates or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Templates Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-400" />
            <span className="text-sm">Loading form templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-8 bg-neutral-800/40 border border-neutral-750 rounded-xl">
            <BookmarkCheck className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-200">No matching templates found</h3>
            <p className="text-xs text-neutral-400 max-w-md mt-1 mb-4">
              {searchQuery
                ? `No templates matched "${searchQuery}". Try clearing search filters.`
                : 'No templates available in this category. You can save the current form as a new template.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-xs font-medium rounded-lg text-white"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map(template => {
              const catStyle = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.Custom;
              const data = template.data || {};

              // Extract preview metadata
              const applicantName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Applicant';
              const company = data.officeCompany || (data.category === 'Self-Employed' ? 'Business Owner' : 'Not Specified');
              const residence = `${data.residenceStatus || 'Resident'} in ${data.residenceArea || data.residenceCity || 'UAE'}`;
              const property = data.propertyBuilding || data.propertyProject || data.propertyUsage || 'Property Details';
              const bankTarget = data.selectedBank ? `${data.selectedBank} (${data.selectedFormType || 'All'})` : null;
              
              // Count filled fields in template
              let filledCount = 0;
              Object.values(data).forEach(v => {
                if (v !== '' && v !== null && v !== undefined && v !== false) filledCount++;
              });

              return (
                <div
                  key={template.id}
                  className="bg-neutral-800/90 border border-neutral-700 hover:border-neutral-600 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-lg group"
                >
                  <div>
                    {/* Header: Category Badge + Built-In indicator */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {template.category}
                        </span>
                        {template.isBuiltIn && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 font-mono">
                            Verified
                          </span>
                        )}
                        {data.hasCoApplicant && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Joint
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-neutral-400 font-mono">
                        {filledCount} fields
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed line-clamp-2">
                      {template.description || 'No description provided.'}
                    </p>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded bg-neutral-750 text-neutral-400 border border-neutral-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Profile Snapshot Highlights */}
                    <div className="mt-4 pt-3 border-t border-neutral-700/70 space-y-1.5 text-xs text-neutral-300">
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="font-medium text-neutral-200">{applicantName}</span>
                        {data.nationality && <span className="text-neutral-400 text-[11px]">({data.nationality})</span>}
                      </div>

                      <div className="flex items-center gap-2 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{company}</span>
                      </div>

                      <div className="flex items-center gap-2 truncate">
                        <Home className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{residence}</span>
                      </div>

                      {bankTarget && (
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-blue-300 font-medium truncate">{bankTarget}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 pt-3.5 border-t border-neutral-700 flex items-center justify-between gap-2">
                    {/* Primary Apply Action */}
                    <button
                      onClick={() => {
                        onApplyTemplate(template.data, template.name);
                        showNotification('success', `Applied template "${template.name}" to form!`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                      title="Quick load this template into the active form state"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Form</span>
                    </button>

                    {/* Secondary Tool Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                        title="Inspect snapshot data"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                        title="Duplicate as new template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setEditName(template.name);
                          setEditCategory(template.category);
                          setEditDesc(template.description || '');
                          setEditTags(template.tags?.join(', ') || '');
                        }}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                        title="Edit template details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!template.isBuiltIn && (
                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete custom template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DRAWER / MODAL: SAVE CURRENT FORM AS TEMPLATE */}
      {/* ============================================================ */}
      {isSaveDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-neutral-850 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Save Current Form Snapshot</h3>
              </div>
              <button
                onClick={() => setIsSaveDrawerOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate} className="p-6 space-y-4">
              {/* Snapshot Info Banner */}
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs text-blue-200 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Snapshotting Active Form:</span> Capturing all{' '}
                  <strong className="text-blue-300">{currentPopulatedFieldsCount} populated fields</strong> currently
                  entered in the form, including Applicant, Employment, Liabilities, and Property configurations.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salaried - Senior Aviation Expat"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Profile Category
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={e => setNewTemplateCategory(e.target.value as FormTemplateCategory)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Joint">Joint Application</option>
                    <option value="Executive">Executive / HNW</option>
                    <option value="Investor">Investor</option>
                    <option value="Non-Resident">Non-Resident</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MNC, Freezone, Primary"
                    value={newTemplateTags}
                    onChange={e => setNewTemplateTags(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description / Underwriting Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe who this borrower profile template is suited for..."
                  value={newTemplateDesc}
                  onChange={e => setNewTemplateDesc(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveDrawerOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT TEMPLATE METADATA */}
      {/* ============================================================ */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-neutral-850 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Edit Template Details</h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Profile Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as FormTemplateCategory)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Joint">Joint Application</option>
                    <option value="Executive">Executive / HNW</option>
                    <option value="Investor">Investor</option>
                    <option value="Non-Resident">Non-Resident</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description / Underwriting Notes
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PREVIEW TEMPLATE SNAPSHOT DATA */}
      {/* ============================================================ */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-neutral-850 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">{previewTemplate.name}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    {previewTemplate.category}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{previewTemplate.description}</p>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(previewTemplate.data || {}).map(([key, val]) => {
                  if (val === '' || val === null || val === undefined || val === false) return null;
                  return (
                    <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5">
                      <div className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                        {key}
                      </div>
                      <div className="text-xs font-semibold text-white mt-0.5 truncate">
                        {String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-800 border-t border-neutral-700 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                ID: {previewTemplate.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onApplyTemplate(previewTemplate.data, previewTemplate.name);
                    setPreviewTemplate(null);
                    showNotification('success', `Applied template "${previewTemplate.name}" to form!`);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  Apply to Form Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
