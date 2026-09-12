import React, { useState, useEffect, useRef } from 'react';
import { Upload, ChevronRight, ChevronLeft, Check, FileText, User, Building, MapPin, CreditCard, Home, Settings, CheckCircle2, Loader2, CloudCheck } from 'lucide-react';
import { FormData } from './types';
import { cn } from './lib/utils';
import { StepPersonal } from './components/StepPersonal';
import { StepAddress } from './components/StepAddress';
import { StepLiabilities } from './components/StepLiabilities';
import { StepProperty } from './components/StepProperty';
import { StepGenerate } from './components/StepGenerate';
import { StepKyc } from './components/StepKyc';
import { AdminPanel } from './components/AdminPanel';

const STEPS = [
  { id: 'kyc', title: 'KYC & Upload', icon: Upload },
  { id: 'personal', title: 'Personal', icon: User },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'liabilities', title: 'Liabilities', icon: CreditCard },
  { id: 'property', title: 'Property', icon: Home },
  { id: 'generate', title: 'Generate', icon: FileText },
];

const initialData: FormData = {
  educationalQualification: '', residentOfUaeSince: '', personalEmail: '', officialEmail: '',
  mobileNumber: '', mothersFullName: '', maritalStatus: '', numberOfDependents: '', numberOfChildrenSchooling: '',
  firstName: '', middleName: '', lastName: '', dob: '', nationality: '', gender: '', passportNo: '', passportExpiry: '', emiratesId: '', emiratesIdExpiry: '',
  hasCoApplicant: false,
  coAppEducationalQualification: '', coAppResidentOfUaeSince: '', coAppPersonalEmail: '', coAppOfficialEmail: '',
  coAppMobileNumber: '', coAppMothersFullName: '', coAppMaritalStatus: '', coAppNumberOfDependents: '',
  coAppFirstName: '', coAppMiddleName: '', coAppLastName: '', coAppDob: '', coAppNationality: '', coAppGender: '', coAppPassportNo: '', coAppPassportExpiry: '', coAppEmiratesId: '', coAppEmiratesIdExpiry: '',
  residencePoBox: '', residenceBuilding: '', residenceArea: '', residenceLandmark: '', residenceCity: '', residenceCountry: '', residenceStatus: '', residenceTelephone: '',
  officeCompany: '', officeEmployeesInUae: '', officePoBox: '', officeBuilding: '', officeUnit: '', officeArea: '', officeLandmark: '', officeCity: '', officeCountry: '', officeStatus: '', officeTelephone: '', officeHrEmail: '', officeSignatoryEmail: '',
  prevCompany: '', prevDesignation: '', prevAddress: '', prevDoj: '', prevDol: '',
  ref1Name: '', ref1Mobile: '', ref1Email: '', ref1Emirate: '',
  ref2Name: '', ref2Mobile: '', ref2Email: '', ref2Emirate: '',
  homePoBox: '', homeBuilding: '', homeUnit: '', homeArea: '', homeCity: '', homeCountry: '', homeStatus: '', homeTelephone: '', homeState: '',
  homeRef1Name: '', homeRef1Mobile: '', homeRef1Email: '',
  homeRef2Name: '', homeRef2Mobile: '', homeRef2Email: '',
  carLoanNo: '', carLoanEmi: '', carLoanOs: '', carLoanTerm: '', carLoanBank: '',
  personalLoanNo: '', personalLoanEmi: '', personalLoanOs: '', personalLoanTerm: '', personalLoanBank: '',
  homeLoanNo: '', homeLoanEmi: '', homeLoanOs: '', homeLoanTerm: '', homeLoanBank: '',
  cc1Limit: '', cc1Bank: '', cc2Limit: '', cc2Bank: '',
  propertyUsage: '', propertyStatus: '', ownershipType: '', marketType: '', propertyBuilding: '', propertyArea: '', propertyDeveloper: '', propertyProject: '',
  selectedBank: 'ADIB', selectedFormType: 'Islamic',
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem('hfu_mortgage_form_data');
      if (saved) {
        return { ...initialData, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load saved form draft:', e);
    }
    return initialData;
  });
  const [adminOpen, setAdminOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const isFirstRender = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateData = (fields: Partial<FormData>) => {
    setSyncStatus('saving');
    setFormData(prev => ({ ...prev, ...fields }));
  };

  // Debounced auto-save effect whenever formData changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSyncStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem('hfu_mortgage_form_data', JSON.stringify(formData));
      } catch (err) {
        console.warn('Could not auto-save to localStorage:', err);
      }
      setSyncStatus('saved');
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData]);

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl tracking-tight text-neutral-800">Home Finance UAE</span>
            </div>

            <div className="h-4 w-px bg-neutral-200 hidden sm:block" />

            {/* Live Debounced Sync Status Indicator */}
            <div 
              id="sync-status-indicator"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200",
                syncStatus === 'saving'
                  ? "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              )}
              title={syncStatus === 'saving' ? 'Saving changes...' : `All changes saved at ${lastSavedTime}`}
            >
              {syncStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                  <span className="text-[10px] text-emerald-600/75 hidden md:inline ml-0.5 font-normal">
                    • {lastSavedTime}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Sync Indicator */}
            <div 
              className={cn(
                "flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                syncStatus === 'saving'
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              )}
            >
              {syncStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Saved</span>
                </>
              )}
            </div>

            <button 
              onClick={() => setAdminOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0 hidden md:block">
          <nav className="space-y-1 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-neutral-200" />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "w-full flex items-center gap-4 py-3 px-2 text-sm font-medium transition-colors relative z-10",
                    isCurrent ? "text-blue-600" : isPast ? "text-neutral-700 hover:text-neutral-900" : "text-neutral-400"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                    isCurrent ? "border-blue-600 bg-blue-50 text-blue-600" : 
                    isPast ? "border-blue-600 bg-blue-600 text-white" : 
                    "border-neutral-300 bg-white"
                  )}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  {step.title}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-neutral-800">{STEPS[currentStep].title}</h2>
              {currentStep === 0 && <StepKyc data={formData} update={updateData} />}
              {currentStep === 1 && <StepPersonal data={formData} update={updateData} />}
              {currentStep === 2 && <StepAddress data={formData} update={updateData} />}
              {currentStep === 3 && <StepLiabilities data={formData} update={updateData} />}
              {currentStep === 4 && <StepProperty data={formData} update={updateData} />}
              {currentStep === 5 && <StepGenerate data={formData} update={updateData} onOpenAdmin={() => setAdminOpen(true)} />}
            </div>
            
            <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <button
                onClick={nextStep}
                disabled={currentStep === STEPS.length - 1}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <AdminPanel 
        isOpen={adminOpen} 
        onClose={() => setAdminOpen(false)} 
        formDataKeys={Object.keys(initialData)} 
      />
    </div>
  );
}
