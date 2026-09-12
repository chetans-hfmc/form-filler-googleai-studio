import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, X, Save, AlertCircle, CheckCircle2, Trash2, 
  Search, Check, ZoomIn, ZoomOut, FileText, 
  Eye, EyeOff, Crosshair, Plus, Edit2, ChevronDown, 
  Layers, Shield, CreditCard, Users, FileCheck2, ArrowRight,
  Landmark, Building2
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { BankFormItem, VisualCoordinateMap, BankRecord } from '../types';
import { BankManagerModal } from './BankManagerModal';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Human-friendly labels and sample values for UAE Mortgage data
const FIELD_METADATA: Record<string, { label: string; category: string; sample: string }> = {
  // Personal
  firstName: { label: 'First Name', category: 'Personal', sample: 'Chetan' },
  middleName: { label: 'Middle Name', category: 'Personal', sample: 'S' },
  lastName: { label: 'Last Name', category: 'Personal', sample: 'Sharma' },
  dob: { label: 'Date of Birth', category: 'Personal', sample: '15/05/1985' },
  nationality: { label: 'Nationality', category: 'Personal', sample: 'Indian' },
  gender: { label: 'Gender', category: 'Personal', sample: 'Male' },
  passportNo: { label: 'Passport Number', category: 'Personal', sample: 'Z4928172' },
  passportExpiry: { label: 'Passport Expiry', category: 'Personal', sample: '10/08/2030' },
  emiratesId: { label: 'Emirates ID', category: 'Personal', sample: '784-1985-1234567-1' },
  emiratesIdExpiry: { label: 'Emirates ID Expiry', category: 'Personal', sample: '12/12/2028' },
  educationalQualification: { label: 'Educational Qualification', category: 'Personal', sample: 'Post Graduate' },
  residentOfUaeSince: { label: 'Resident of UAE Since', category: 'Personal', sample: '01/02/2012' },
  personalEmail: { label: 'Personal Email', category: 'Personal', sample: 'chetans@homefinanceuae.com' },
  officialEmail: { label: 'Official Email', category: 'Personal', sample: 'c.sharma@company.ae' },
  mobileNumber: { label: 'Mobile Number', category: 'Personal', sample: '+971 50 123 4567' },
  mothersFullName: { label: "Mother's Full Name", category: 'Personal', sample: 'Sushila Sharma' },
  maritalStatus: { label: 'Marital Status', category: 'Personal', sample: 'Married' },
  numberOfDependents: { label: 'Number of Dependents', category: 'Personal', sample: '2' },
  numberOfChildrenSchooling: { label: 'Children Going to School', category: 'Personal', sample: '1' },

  // Co-Applicant
  hasCoApplicant: { label: 'Has Co-Applicant', category: 'Co-Applicant', sample: 'Yes' },
  coAppFirstName: { label: 'Co-App First Name', category: 'Co-Applicant', sample: 'Pooja' },
  coAppMiddleName: { label: 'Co-App Middle Name', category: 'Co-Applicant', sample: 'C' },
  coAppLastName: { label: 'Co-App Last Name', category: 'Co-Applicant', sample: 'Sharma' },
  coAppDob: { label: 'Co-App Date of Birth', category: 'Co-Applicant', sample: '22/09/1988' },
  coAppNationality: { label: 'Co-App Nationality', category: 'Co-Applicant', sample: 'Indian' },
  coAppGender: { label: 'Co-App Gender', category: 'Co-Applicant', sample: 'Female' },
  coAppPassportNo: { label: 'Co-App Passport No', category: 'Co-Applicant', sample: 'K8192039' },
  coAppPassportExpiry: { label: 'Co-App Passport Expiry', category: 'Co-Applicant', sample: '04/06/2031' },
  coAppEmiratesId: { label: 'Co-App Emirates ID', category: 'Co-Applicant', sample: '784-1988-7654321-2' },
  coAppEmiratesIdExpiry: { label: 'Co-App EID Expiry', category: 'Co-Applicant', sample: '15/09/2029' },
  coAppEducationalQualification: { label: 'Co-App Education', category: 'Co-Applicant', sample: 'Bachelor Degree' },
  coAppResidentOfUaeSince: { label: 'Co-App UAE Resident Since', category: 'Co-Applicant', sample: '01/01/2015' },
  coAppPersonalEmail: { label: 'Co-App Personal Email', category: 'Co-Applicant', sample: 'pooja.s@gmail.com' },
  coAppOfficialEmail: { label: 'Co-App Official Email', category: 'Co-Applicant', sample: 'pooja@enterprise.ae' },
  coAppMobileNumber: { label: 'Co-App Mobile Number', category: 'Co-Applicant', sample: '+971 52 987 6543' },
  coAppMothersFullName: { label: "Co-App Mother's Name", category: 'Co-Applicant', sample: 'Meena Gupta' },
  coAppMaritalStatus: { label: 'Co-App Marital Status', category: 'Co-Applicant', sample: 'Married' },
  coAppNumberOfDependents: { label: 'Co-App Dependents', category: 'Co-Applicant', sample: '0' },

  // Residence Address
  residencePoBox: { label: 'Residence P.O. Box', category: 'Residence', sample: '45892' },
  residenceBuilding: { label: 'Residence Building & Flat', category: 'Residence', sample: 'Marina Gate 2, Apt 1402' },
  residenceArea: { label: 'Residence Area / Street', category: 'Residence', sample: 'Dubai Marina Walk' },
  residenceLandmark: { label: 'Residence Landmark', category: 'Residence', sample: 'Near Spinneys Marina' },
  residenceCity: { label: 'Residence City / Emirate', category: 'Residence', sample: 'Dubai' },
  residenceCountry: { label: 'Residence Country', category: 'Residence', sample: 'United Arab Emirates' },
  residenceStatus: { label: 'Residential Status', category: 'Residence', sample: 'Tenant' },
  residenceTelephone: { label: 'Residence Telephone', category: 'Residence', sample: '04 399 8877' },

  // Office & Employment
  officeCompany: { label: 'Current Employer Company', category: 'Employment', sample: 'Emaar Hospitality Group LLC' },
  officeEmployeesInUae: { label: 'Approx Employees in UAE', category: 'Employment', sample: '2500+' },
  officePoBox: { label: 'Office P.O. Box', category: 'Employment', sample: '9440' },
  officeBuilding: { label: 'Office Building Name', category: 'Employment', sample: 'Emaar Square, Building 4' },
  officeUnit: { label: 'Office Unit / Floor', category: 'Employment', sample: 'Office 601, 6th Floor' },
  officeArea: { label: 'Office Area / Street', category: 'Employment', sample: 'Downtown Dubai' },
  officeLandmark: { label: 'Office Landmark', category: 'Employment', sample: 'Opposite Dubai Mall Metro' },
  officeCity: { label: 'Office City / Emirate', category: 'Employment', sample: 'Dubai' },
  officeCountry: { label: 'Office Country', category: 'Employment', sample: 'United Arab Emirates' },
  officeStatus: { label: 'Office Property Status', category: 'Employment', sample: 'Owned by Company' },
  officeTelephone: { label: 'Office Telephone', category: 'Employment', sample: '04 367 3333' },
  officeHrEmail: { label: 'Official HR Email', category: 'Employment', sample: 'hr@emaar.ae' },
  officeSignatoryEmail: { label: 'Salary Signatory Email', category: 'Employment', sample: 'finance.sign@emaar.ae' },

  // Previous Company
  prevCompany: { label: 'Previous Company Name', category: 'Employment', sample: 'Jumeirah International LLC' },
  prevDesignation: { label: 'Previous Designation', category: 'Employment', sample: 'Senior Operations Manager' },
  prevAddress: { label: 'Previous Company Address', category: 'Employment', sample: 'Al Sufouh 1, Dubai' },
  prevDoj: { label: 'Previous Date of Joining', category: 'Employment', sample: '01/03/2015' },
  prevDol: { label: 'Previous Date of Leaving', category: 'Employment', sample: '30/11/2021' },

  // UAE References
  ref1Name: { label: 'Ref 1 Name (UAE)', category: 'References', sample: 'Vikram Mehta' },
  ref1Mobile: { label: 'Ref 1 Mobile (UAE)', category: 'References', sample: '+971 55 432 1098' },
  ref1Email: { label: 'Ref 1 Email', category: 'References', sample: 'vikram.m@gmail.com' },
  ref1Emirate: { label: 'Ref 1 Emirate', category: 'References', sample: 'Dubai' },
  ref2Name: { label: 'Ref 2 Name (UAE)', category: 'References', sample: 'Sarah Al Zaabi' },
  ref2Mobile: { label: 'Ref 2 Mobile (UAE)', category: 'References', sample: '+971 50 987 1122' },
  ref2Email: { label: 'Ref 2 Email', category: 'References', sample: 's.alzaabi@emirates.com' },
  ref2Emirate: { label: 'Ref 2 Emirate', category: 'References', sample: 'Abu Dhabi' },

  // Home Country
  homePoBox: { label: 'Home Country Postal Code', category: 'Home Country', sample: '400050' },
  homeBuilding: { label: 'Home Country Building/Flat', category: 'Home Country', sample: 'Sea Pearl Apts, Flat 502' },
  homeUnit: { label: 'Home Country Unit', category: 'Home Country', sample: '502' },
  homeArea: { label: 'Home Country Area/Street', category: 'Home Country', sample: 'Bandra West, Hill Road' },
  homeCity: { label: 'Home Country City', category: 'Home Country', sample: 'Mumbai' },
  homeState: { label: 'Home Country State', category: 'Home Country', sample: 'Maharashtra' },
  homeCountry: { label: 'Home Country', category: 'Home Country', sample: 'India' },
  homeStatus: { label: 'Home Country Property Status', category: 'Home Country', sample: 'Owned Family Home' },
  homeTelephone: { label: 'Home Country Phone', category: 'Home Country', sample: '+91 22 2640 1234' },
  homeRef1Name: { label: 'Home Ref 1 Name', category: 'Home Country', sample: 'Rajesh Sharma' },
  homeRef1Mobile: { label: 'Home Ref 1 Mobile', category: 'Home Country', sample: '+91 98200 11223' },
  homeRef1Email: { label: 'Home Ref 1 Email', category: 'Home Country', sample: 'rajesh.sharma@rediffmail.com' },
  homeRef2Name: { label: 'Home Ref 2 Name', category: 'Home Country', sample: 'Anil Kapoor' },
  homeRef2Mobile: { label: 'Home Ref 2 Mobile', category: 'Home Country', sample: '+91 98190 99887' },
  homeRef2Email: { label: 'Home Ref 2 Email', category: 'Home Country', sample: 'anil.k@gmail.com' },

  // Liabilities
  carLoanNo: { label: 'Auto Loan Agreement No', category: 'Liabilities', sample: 'AL-789012' },
  carLoanEmi: { label: 'Auto Loan Monthly EMI (AED)', category: 'Liabilities', sample: '2,450' },
  carLoanOs: { label: 'Auto Loan Outstanding (AED)', category: 'Liabilities', sample: '48,000' },
  carLoanTerm: { label: 'Auto Loan Remaining Months', category: 'Liabilities', sample: '24' },
  carLoanBank: { label: 'Auto Loan Bank', category: 'Liabilities', sample: 'Emirates NBD' },
  personalLoanNo: { label: 'Personal Loan Agreement No', category: 'Liabilities', sample: 'PL-554433' },
  personalLoanEmi: { label: 'Personal Loan EMI (AED)', category: 'Liabilities', sample: '3,800' },
  personalLoanOs: { label: 'Personal Loan Outstanding', category: 'Liabilities', sample: '95,000' },
  personalLoanTerm: { label: 'Personal Loan Term', category: 'Liabilities', sample: '36' },
  personalLoanBank: { label: 'Personal Loan Bank', category: 'Liabilities', sample: 'ADCB' },
  homeLoanNo: { label: 'Existing Home Loan No', category: 'Liabilities', sample: 'HL-001928' },
  homeLoanEmi: { label: 'Existing Home Loan EMI', category: 'Liabilities', sample: '8,200' },
  homeLoanOs: { label: 'Existing Home Loan Outstanding', category: 'Liabilities', sample: '1,120,000' },
  homeLoanTerm: { label: 'Existing Home Loan Term', category: 'Liabilities', sample: '180' },
  homeLoanBank: { label: 'Existing Home Loan Bank', category: 'Liabilities', sample: 'Dubai Islamic Bank' },
  cc1Limit: { label: 'Credit Card 1 Limit (AED)', category: 'Liabilities', sample: '50,000' },
  cc1Bank: { label: 'Credit Card 1 Bank', category: 'Liabilities', sample: 'Citi UAE' },
  cc2Limit: { label: 'Credit Card 2 Limit (AED)', category: 'Liabilities', sample: '35,000' },
  cc2Bank: { label: 'Credit Card 2 Bank', category: 'Liabilities', sample: 'FAB' },

  // Property
  propertyUsage: { label: 'Property Usage', category: 'Property', sample: 'Primary Residence / End-Use' },
  propertyStatus: { label: 'Property Status', category: 'Property', sample: 'Ready / Completed' },
  ownershipType: { label: 'Ownership Type', category: 'Property', sample: 'Freehold' },
  marketType: { label: 'Market Type', category: 'Property', sample: 'Secondary Resale' },
  propertyBuilding: { label: 'Property Building / Villa No', category: 'Property', sample: 'Creek Vista Tower A, Unit 2104' },
  propertyArea: { label: 'Property Location / Community', category: 'Property', sample: 'Sobha Hartland, MBR City' },
  propertyDeveloper: { label: 'Property Master Developer', category: 'Property', sample: 'Sobha Realty' },
  propertyProject: { label: 'Property Project Name', category: 'Property', sample: 'Creek Vistas' },
};

const CATEGORIES = ['All', 'Personal', 'Co-Applicant', 'Residence', 'Employment', 'References', 'Home Country', 'Liabilities', 'Property'];

export function AdminPanel({ isOpen, onClose, formDataKeys }: { isOpen: boolean; onClose: () => void; formDataKeys: string[] }) {
  const [bank, setBank] = useState('ADIB');
  const [formType, setFormType] = useState('Islamic');

  // Dynamic banks directory state
  const [banksList, setBanksList] = useState<BankRecord[]>([]);
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);

  // Bank forms list for the active bank
  const [forms, setForms] = useState<BankFormItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');

  // Current working form record
  const currentForm = useMemo(() => forms.find(f => f.id === selectedFormId), [forms, selectedFormId]);

  // PDF display state
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Active key selected from sidebar
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; page: number } | null>(null);

  // Filter / Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterMode, setFilterMode] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [previewSample, setPreviewSample] = useState(false);

  // Status & Modal states
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // CRUD Dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formNameInput, setFormNameInput] = useState('');
  const [formCategoryInput, setFormCategoryInput] = useState<BankFormItem['category']>('Application');
  const [formTypeInput, setFormTypeInput] = useState<'Islamic' | 'Non-Islamic' | 'All'>('All');
  const [formDescInput, setFormDescInput] = useState('');
  const [modalFile, setModalFile] = useState<File | null>(null);

  // Load banks list
  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (data.banks && Array.isArray(data.banks)) {
        setBanksList(data.banks);
        // If current bank isn't in list and list not empty, select first
        if (!data.banks.some((b: BankRecord) => b.code.toUpperCase() === bank.toUpperCase()) && data.banks.length > 0) {
          setBank(data.banks[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching banks list:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
    }
  }, [isOpen]);

  // Load forms whenever bank changes
  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms?bank=${bank}`);
      const data = await res.json();
      if (data.forms) {
        setForms(data.forms);
        // Select first matching form if none selected or selected not in list
        if (data.forms.length > 0) {
          const matching = data.forms.find((f: BankFormItem) => f.formType === formType || f.formType === 'All');
          const target = matching || data.forms[0];
          setSelectedFormId(target.id);
        } else {
          setSelectedFormId('');
        }
      }
    } catch (err: any) {
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchForms();
    }
  }, [bank, isOpen]);

  // Load PDF file for the selected form
  useEffect(() => {
    if (!selectedFormId) {
      setFileUrl(null);
      setNumPages(0);
      return;
    }

    const form = forms.find(f => f.id === selectedFormId);
    if (form?.hasFile) {
      setFileUrl(`/api/forms/${selectedFormId}/file?t=${Date.now()}`);
    } else {
      setFileUrl(null);
      setNumPages(0);
    }
    setActiveKey(null);
    setHoverCoord(null);
  }, [selectedFormId, forms]);

  // Handle uploading or replacing blank PDF template for current form
  const handleUploadTemplateForCurrent = async (file: File) => {
    if (!selectedFormId) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('template', file);

      const res = await fetch(`/api/forms/${selectedFormId}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload template');

      // Update forms state
      setForms(prev => prev.map(f => f.id === selectedFormId ? data.form : f));
      setFileUrl(`/api/forms/${selectedFormId}/file?t=${Date.now()}`);

      setStatusMessage({
        type: 'success',
        text: `Uploaded blank template for "${data.form.name}". You can now click on the canvas to place coordinates.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Canvas click handler to map coordinates
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (!currentForm) return;

    if (!activeKey) {
      setStatusMessage({
        type: 'info',
        text: 'Select a field from the left sidebar first, then click on the PDF to map its position.'
      });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = Math.max(0, Math.min(100, Number(((clickX / rect.width) * 100).toFixed(2))));
    const yPct = Math.max(0, Math.min(100, Number(((clickY / rect.height) * 100).toFixed(2))));

    const updatedMappings: VisualCoordinateMap[] = [
      ...currentForm.visualMappings.filter(m => m.key !== activeKey),
      {
        id: `${activeKey}_${pageIndex}_${Date.now()}`,
        key: activeKey,
        page: pageIndex,
        x: xPct,
        y: yPct
      }
    ];

    // Optimistically update local state
    setForms(prev => prev.map(f => f.id === currentForm.id ? { ...f, visualMappings: updatedMappings } : f));

    // Save to server
    try {
      await fetch(`/api/forms/${currentForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualMappings: updatedMappings })
      });

      setStatusMessage({
        type: 'success',
        text: `Mapped "${FIELD_METADATA[activeKey]?.label || activeKey}" on ${currentForm.name} (Page ${pageIndex + 1})`
      });
    } catch (err: any) {
      console.error('Failed to save mapping to server:', err);
    }
  };

  // Remove a mapped coordinate
  const removeMapping = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentForm) return;

    const updated = currentForm.visualMappings.filter(m => m.id !== id);
    setForms(prev => prev.map(f => f.id === currentForm.id ? { ...f, visualMappings: updated } : f));

    try {
      await fetch(`/api/forms/${currentForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualMappings: updated })
      });
    } catch (err) {
      console.error('Error removing mapping:', err);
    }
  };

  // Form CRUD Actions
  const handleCreateForm = async () => {
    if (!formNameInput.trim()) return;
    setLoading(true);

    try {
      const data = new FormData();
      data.append('bank', bank);
      data.append('name', formNameInput.trim());
      data.append('category', formCategoryInput);
      data.append('formType', formTypeInput);
      data.append('description', formDescInput.trim());

      if (modalFile) {
        data.append('template', modalFile);
      }

      const res = await fetch('/api/forms', {
        method: 'POST',
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create form');

      setForms(prev => [...prev, result.form]);
      setSelectedFormId(result.form.id);
      setIsAddModalOpen(false);
      setFormNameInput('');
      setFormDescInput('');
      setModalFile(null);

      setStatusMessage({
        type: 'success',
        text: `Created new form "${result.form.name}". You can now upload its blank PDF and map fields.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateForm = async () => {
    if (!currentForm || !formNameInput.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/forms/${currentForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formNameInput.trim(),
          category: formCategoryInput,
          formType: formTypeInput,
          description: formDescInput.trim()
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update form');

      setForms(prev => prev.map(f => f.id === currentForm.id ? result.form : f));
      setIsEditModalOpen(false);

      setStatusMessage({
        type: 'success',
        text: `Updated form details for "${result.form.name}".`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from ${bank}? All its coordinate mappings and uploaded template will be removed.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete form');

      setForms(prev => prev.filter(f => f.id !== id));
      if (selectedFormId === id) {
        const remaining = forms.filter(f => f.id !== id);
        setSelectedFormId(remaining.length > 0 ? remaining[0].id : '');
      }

      setStatusMessage({ type: 'info', text: `Deleted form "${name}".` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Filtered keys for sidebar
  const visualMappings = currentForm?.visualMappings || [];
  const filteredKeys = useMemo(() => {
    return formDataKeys.filter(k => {
      if (k === 'selectedBank' || k === 'selectedFormType') return false;

      const meta = FIELD_METADATA[k] || { label: k, category: 'Other', sample: '' };
      
      if (selectedCategory !== 'All' && meta.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesKey = k.toLowerCase().includes(query);
        const matchesLabel = meta.label.toLowerCase().includes(query);
        if (!matchesKey && !matchesLabel) return false;
      }

      const isMapped = visualMappings.some(m => m.key === k);
      if (filterMode === 'mapped' && !isMapped) return false;
      if (filterMode === 'unmapped' && isMapped) return false;

      return true;
    });
  }, [formDataKeys, selectedCategory, searchQuery, filterMode, visualMappings]);

  const mappedCount = visualMappings.length;
  const totalKeysCount = formDataKeys.filter(k => k !== 'selectedBank' && k !== 'selectedFormType').length;
  const canvasWidth = Math.round(700 * zoomScale);

  return (
    <>
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-0 w-[97vw] max-w-[1450px] h-[93vh] z-50 flex flex-col overflow-hidden border border-neutral-200">
          
          {/* Top Bar: Bank Selector, Form Type, and Global Actions */}
          <div className="bg-neutral-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white leading-tight">
                  Bank Forms & Template Studio
                </Dialog.Title>
                <p className="text-xs text-neutral-400">
                  Manage multiple bank application forms (Main, AECB, UAEDDS, Co-App) & visual PDF mapping
                </p>
              </div>
            </div>

            {/* Target Bank & Form Type Controls */}
            <div className="flex items-center gap-2 bg-neutral-800/90 p-1 rounded-xl border border-neutral-700">
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs text-neutral-400 font-medium">Bank:</span>
                <select
                  value={bank}
                  onChange={e => {
                    if (e.target.value === '__MANAGE_BANKS__') {
                      setIsBankManagerOpen(true);
                    } else {
                      setBank(e.target.value);
                    }
                  }}
                  className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
                >
                  {banksList.length > 0 ? (
                    banksList.map(b => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name}
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
                  <option value="__MANAGE_BANKS__">+ Add / Manage Banks...</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsBankManagerOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-xs font-medium transition-colors"
                  title="Manage Lending Institutions (Add, Edit, Delete)"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Banks</span>
                </button>
              </div>

              <div className="h-4 w-px bg-neutral-700" />

              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs text-neutral-400 font-medium">Type:</span>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Islamic">Islamic Finance</option>
                  <option value="Non-Islamic">Conventional (Non-Islamic)</option>
                </select>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormNameInput('');
                  setFormCategoryInput('Application');
                  setFormTypeInput('All');
                  setFormDescInput('');
                  setModalFile(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Form</span>
              </button>

              <Dialog.Close className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          </div>

          {/* Form Selector Bar (Bank-wise Form Pills) */}
          <div className="bg-neutral-800 text-white px-6 py-2 flex items-center justify-between gap-3 border-b border-neutral-700 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 shrink-0">
                {bank} Forms ({forms.length}):
              </span>

              {forms.map(form => {
                const isSelected = form.id === selectedFormId;
                const formMappingsCount = form.visualMappings?.length || 0;

                return (
                  <button
                    key={form.id}
                    onClick={() => setSelectedFormId(form.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-neutral-700/70 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{form.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                      formMappingsCount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-600 text-neutral-400'
                    }`}>
                      {formMappingsCount} pts
                    </span>
                    {form.hasFile && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Template PDF uploaded" />}
                  </button>
                );
              })}
            </div>

            {/* Active Form Controls: Edit, Upload Template, Delete */}
            {currentForm && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setFormNameInput(currentForm.name);
                    setFormCategoryInput(currentForm.category);
                    setFormTypeInput(currentForm.formType);
                    setFormDescInput(currentForm.description || '');
                    setIsEditModalOpen(true);
                  }}
                  className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-neutral-700 transition-colors"
                  title="Rename or edit form metadata"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteForm(currentForm.id, currentForm.name)}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-700 transition-colors"
                  title="Delete this form"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              statusMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                {statusMessage.type === 'info' && <Crosshair className="w-4 h-4 text-blue-600 shrink-0" />}
                <p className="font-medium">{statusMessage.text}</p>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Workspace: Sidebar (Fields) + Canvas (Form Viewport) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar: All Mortgage Form Fields */}
            <div className="w-80 md:w-96 border-r border-neutral-200 bg-neutral-50/70 flex flex-col shrink-0 overflow-hidden">
              
              {/* Search & Category Filter */}
              <div className="p-3.5 border-b border-neutral-200 bg-white space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search applicant fields..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-neutral-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                        selectedCategory === cat 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${filterMode === 'all' ? 'bg-blue-100 text-blue-800' : 'text-neutral-500'}`}
                    >
                      All ({totalKeysCount})
                    </button>
                    <button
                      onClick={() => setFilterMode('mapped')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${filterMode === 'mapped' ? 'bg-emerald-100 text-emerald-800' : 'text-neutral-500'}`}
                    >
                      Mapped on this Form ({mappedCount})
                    </button>
                    <button
                      onClick={() => setFilterMode('unmapped')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${filterMode === 'unmapped' ? 'bg-amber-100 text-amber-800' : 'text-neutral-500'}`}
                    >
                      Unmapped ({totalKeysCount - mappedCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Placement Banner */}
              {activeKey ? (
                <div className="bg-blue-600 text-white p-3 shrink-0 flex items-center justify-between animate-in fade-in">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                      <Crosshair className="w-3 h-3 animate-spin" />
                      <span>Ready to Place</span>
                    </div>
                    <p className="font-semibold text-xs truncate text-white">
                      {FIELD_METADATA[activeKey]?.label || activeKey}
                    </p>
                    <p className="text-[10px] text-blue-100">
                      👉 Click anywhere on "{currentForm?.name}" canvas
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveKey(null)}
                    className="px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded text-[11px] text-white shrink-0"
                  >
                    Deselect
                  </button>
                </div>
              ) : (
                <div className="bg-neutral-100/80 px-3 py-2 border-b border-neutral-200 text-[11px] text-neutral-500 shrink-0 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Select any field below, then click on the PDF to place</span>
                </div>
              )}

              {/* Fields List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredKeys.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    No fields match your search
                  </div>
                ) : (
                  filteredKeys.map(k => {
                    const meta = FIELD_METADATA[k] || { label: k, category: 'Other', sample: '' };
                    const mapping = visualMappings.find(m => m.key === k);
                    const isSelected = activeKey === k;

                    return (
                      <div
                        key={k}
                        onClick={() => setActiveKey(isSelected ? null : k)}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                            : mapping
                            ? 'bg-white border-emerald-200 hover:border-emerald-300'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs text-neutral-900 truncate block">
                            {meta.label}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-neutral-400 truncate">
                              {k}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-500 font-medium">
                              {meta.category}
                            </span>
                          </div>
                          {previewSample && meta.sample && (
                            <p className="text-[10px] text-blue-600 mt-1 font-mono truncate">
                              Sample: "{meta.sample}"
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1 mt-0.5">
                          {mapping ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>P.{mapping.page + 1}</span>
                              </span>
                              <button
                                onClick={(e) => removeMapping(mapping.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-0.5"
                                title="Remove mapping"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 border border-dashed border-neutral-300 px-1.5 py-0.5 rounded">
                              unmapped
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: PDF Canvas Viewport */}
            <div className="flex-1 bg-neutral-200/80 flex flex-col overflow-hidden relative">
              
              {/* Canvas Toolbar */}
              <div className="bg-white px-4 py-2 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-800">
                    {currentForm?.name || 'No Form Selected'}
                  </span>
                  {currentForm?.description && (
                    <span className="text-[11px] text-neutral-500 hidden md:inline truncate max-w-sm">
                      ({currentForm.description})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Upload Blank PDF Template Button */}
                  <label 
                    htmlFor="current-blank-pdf-input"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors border border-neutral-300"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{fileUrl ? 'Replace Blank PDF' : 'Upload Blank PDF'}</span>
                  </label>
                  <input
                    type="file"
                    id="current-blank-pdf-input"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) handleUploadTemplateForCurrent(e.target.files[0]);
                    }}
                  />

                  {/* Sample Preview Toggle */}
                  <button
                    onClick={() => setPreviewSample(!previewSample)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      previewSample ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {previewSample ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                    <span>Preview Values</span>
                  </button>

                  <div className="h-4 w-px bg-neutral-200" />

                  {/* Zoom Controls */}
                  <div className="flex items-center bg-neutral-100 rounded-lg border border-neutral-200 p-0.5">
                    <button
                      onClick={() => setZoomScale(s => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
                      className="p-1 text-neutral-600 hover:text-neutral-900 rounded"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-medium px-2 text-neutral-700">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(s => Math.min(2.0, Number((s + 0.15).toFixed(2))))}
                      className="p-1 text-neutral-600 hover:text-neutral-900 rounded"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className={`flex-1 overflow-y-auto overflow-x-auto p-8 flex flex-col items-center select-none ${
                activeKey ? 'cursor-crosshair' : 'cursor-default'
              }`}>
                {!fileUrl ? (
                  <div className="max-w-md my-auto bg-white rounded-2xl p-8 text-center border-2 border-dashed border-neutral-300 shadow-sm space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Upload Blank PDF for "{currentForm?.name || 'Form'}"
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                        Upload the official blank PDF to render its canvas and set field coordinates.
                      </p>
                    </div>

                    <label
                      htmlFor="canvas-blank-pdf-input-direct"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Blank PDF File</span>
                    </label>
                    <input
                      type="file"
                      id="canvas-blank-pdf-input-direct"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleUploadTemplateForCurrent(e.target.files[0]);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-8 flex flex-col items-center">
                    <Document
                      file={fileUrl}
                      onLoadSuccess={({ numPages: total }) => setNumPages(total)}
                      loading={
                        <div className="p-8 text-center text-neutral-500 text-sm flex items-center gap-2 bg-white rounded-xl shadow-sm">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Rendering PDF canvas...</span>
                        </div>
                      }
                      error={
                        <div className="p-6 text-center text-red-600 bg-white rounded-xl border border-red-200">
                          Failed to render PDF canvas. Please upload a valid PDF document.
                        </div>
                      }
                    >
                      {Array.from(new Array(numPages), (_, pageIndex) => {
                        const pageMappings = visualMappings.filter(m => m.page === pageIndex);

                        return (
                          <div key={`page_${pageIndex}`} className="flex flex-col items-center space-y-2">
                            <div className="flex items-center justify-between w-full px-2 text-xs text-neutral-500 font-medium">
                              <span className="bg-neutral-800 text-white px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                                Page {pageIndex + 1} of {numPages}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                {pageMappings.length} mapped field{pageMappings.length !== 1 ? 's' : ''} on this page
                              </span>
                            </div>

                            <div
                              className="relative shadow-2xl rounded-sm border border-neutral-300 bg-white overflow-hidden"
                              style={{ width: canvasWidth }}
                              onClick={(e) => handleCanvasClick(e, pageIndex)}
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setHoverCoord({ x, y, page: pageIndex });
                              }}
                              onMouseLeave={() => setHoverCoord(null)}
                            >
                              <Page
                                pageNumber={pageIndex + 1}
                                width={canvasWidth}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />

                              {/* Crosshair indicator */}
                              {activeKey && hoverCoord && hoverCoord.page === pageIndex && (
                                <div 
                                  className="absolute pointer-events-none z-30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                                  style={{ left: `${hoverCoord.x}%`, top: `${hoverCoord.y}%` }}
                                >
                                  <div className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white/80 animate-ping" />
                                  <div className="absolute top-4 left-4 bg-neutral-900/90 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    📍 Place: <strong>{FIELD_METADATA[activeKey]?.label || activeKey}</strong>
                                  </div>
                                </div>
                              )}

                              {/* Placed field markers */}
                              {pageMappings.map(m => {
                                const meta = FIELD_METADATA[m.key] || { label: m.key, category: 'Other', sample: '' };
                                const isSelected = activeKey === m.key;
                                const displayValue = previewSample && meta.sample ? meta.sample : meta.label;

                                return (
                                  <div
                                    key={m.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveKey(m.key);
                                    }}
                                    className={`absolute z-20 group -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none ${
                                      isSelected ? 'scale-110' : 'hover:scale-105'
                                    }`}
                                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                  >
                                    <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded shadow-md border ${
                                      isSelected ? 'bg-blue-600 text-white border-blue-700' : 'bg-neutral-900/90 text-white border-neutral-700'
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                      <span className="max-w-[140px] truncate">{displayValue}</span>
                                      <button
                                        onClick={(e) => removeMapping(m.id, e)}
                                        className="ml-1 text-neutral-400 hover:text-rose-400"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </Document>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ADD NEW FORM MODAL */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-semibold text-neutral-900">Add New Form for {bank}</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Form Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. AECB Consent Form, Direct Debit Mandate, Insurance Form"
                      value={formNameInput}
                      onChange={e => setFormNameInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Category</label>
                      <select
                        value={formCategoryInput}
                        onChange={e => setFormCategoryInput(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      >
                        <option value="Application">Application</option>
                        <option value="Consent">Consent</option>
                        <option value="Banking">Banking (UAEDDS)</option>
                        <option value="Insurance">Insurance / Takaful</option>
                        <option value="Undertaking">Undertaking</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Applicable Finance Type</label>
                      <select
                        value={formTypeInput}
                        onChange={e => setFormTypeInput(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      >
                        <option value="All">Both Islamic & Conventional</option>
                        <option value="Islamic">Islamic Finance Only</option>
                        <option value="Non-Islamic">Conventional Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Mandatory AECB consent required for all primary borrowers"
                      value={formDescInput}
                      onChange={e => setFormDescInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Upload Blank PDF Template (Optional)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => {
                        if (e.target.files?.[0]) setModalFile(e.target.files[0]);
                      }}
                      className="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateForm}
                    disabled={!formNameInput.trim() || loading}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Form'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT FORM MODAL */}
          {isEditModalOpen && currentForm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-semibold text-neutral-900">Edit Form: {currentForm.name}</h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Form Name *</label>
                    <input
                      type="text"
                      value={formNameInput}
                      onChange={e => setFormNameInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Category</label>
                      <select
                        value={formCategoryInput}
                        onChange={e => setFormCategoryInput(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      >
                        <option value="Application">Application</option>
                        <option value="Consent">Consent</option>
                        <option value="Banking">Banking (UAEDDS)</option>
                        <option value="Insurance">Insurance / Takaful</option>
                        <option value="Undertaking">Undertaking</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Applicable Finance Type</label>
                      <select
                        value={formTypeInput}
                        onChange={e => setFormTypeInput(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      >
                        <option value="All">Both Islamic & Conventional</option>
                        <option value="Islamic">Islamic Finance Only</option>
                        <option value="Non-Islamic">Conventional Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formDescInput}
                      onChange={e => setFormDescInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateForm}
                    disabled={!formNameInput.trim() || loading}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Bank Directory & CRUD Manager Modal */}
    <BankManagerModal
      isOpen={isBankManagerOpen}
      onClose={() => setIsBankManagerOpen(false)}
      currentSelectedBank={bank}
      onSelectBank={(newBankCode) => {
        setBank(newBankCode);
        fetchBanks();
      }}
      onBanksUpdated={(updated) => {
        setBanksList(updated);
      }}
    />
    </>
  );
}
