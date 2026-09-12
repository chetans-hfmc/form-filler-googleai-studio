import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, ChevronRight, ChevronLeft, Check, FileText, User, 
  Building, MapPin, CreditCard, Home, Settings, CheckCircle2, 
  Loader2, AlertCircle, AlertTriangle, Lock, BookmarkCheck, X 
} from 'lucide-react';
import { FormData } from './types';
import { cn } from './lib/utils';
import { validateStep } from './lib/validation';
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
  const [adminTab, setAdminTab] = useState<'mapping' | 'templates' | 'banks'>('mapping');
  const [appliedTemplateBanner, setAppliedTemplateBanner] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [stepSubmitted, setStepSubmitted] = useState<Record<number, boolean>>({});
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  const handleApplyTemplate = (templateData: Partial<FormData>, templateName: string) => {
    setFormData(prev => {
      const updated = { ...prev, ...templateData };
      try {
        localStorage.setItem('hfu_mortgage_form_data', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
      return updated;
    });
    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setSyncStatus('saved');
    setAppliedTemplateBanner(`Loaded profile "${templateName}"`);
    setTimeout(() => {
      setAppliedTemplateBanner(null);
    }, 5000);
  };

  const isFirstRender = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time validation for current step
  const currentErrors = useMemo(() => {
    return validateStep(currentStep, formData);
  }, [currentStep, formData]);

  const currentErrorsCount = Object.keys(currentErrors).length;
  const isCurrentStepValid = currentErrorsCount === 0;

  // Clear validation alert when the step becomes fully valid
  useEffect(() => {
    if (isCurrentStepValid && validationAlert) {
      setValidationAlert(null);
    }
  }, [isCurrentStepValid, validationAlert]);

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

  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLElement).focus();
        }
      }, 50);
    }
  };

  const handleNext = () => {
    const errors = validateStep(currentStep, formData);
    const count = Object.keys(errors).length;
    if (count > 0) {
      setStepSubmitted(prev => ({ ...prev, [currentStep]: true }));
      setValidationAlert(`Please fill in all ${count} mandatory field${count > 1 ? 's' : ''} highlighted in red before proceeding.`);
      scrollToFirstError(errors);
      return;
    }

    setValidationAlert(null);
    setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setValidationAlert(null);
    setCurrentStep(p => Math.max(p - 1, 0));
  };

  const handleSelectStep = (targetIdx: number) => {
    // Navigating back is always allowed
    if (targetIdx <= currentStep) {
      setValidationAlert(null);
      setCurrentStep(targetIdx);
      return;
    }

    // Navigating forward: validate current step first
    const errors = validateStep(currentStep, formData);
    const count = Object.keys(errors).length;
    if (count > 0) {
      setStepSubmitted(prev => ({ ...prev, [currentStep]: true }));
      setValidationAlert(`Cannot skip ahead: Please complete the ${count} mandatory field${count > 1 ? 's' : ''} in ${STEPS[currentStep].title} first.`);
      scrollToFirstError(errors);
      return;
    }

    // Also verify any intermediate steps between current and target
    for (let s = 0; s < targetIdx; s++) {
      const sErrors = validateStep(s, formData);
      const sCount = Object.keys(sErrors).length;
      if (sCount > 0) {
        setCurrentStep(s);
        setStepSubmitted(prev => ({ ...prev, [s]: true }));
        setValidationAlert(`Please complete ${STEPS[s].title} before proceeding further.`);
        scrollToFirstError(sErrors);
        return;
      }
    }

    setValidationAlert(null);
    setCurrentStep(targetIdx);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
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
              onClick={() => {
                setAdminTab('templates');
                setAdminOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
              title="Browse and load pre-configured borrower templates (Salaried, Self-Employed, etc.)"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Form Templates</span>
            </button>

            <button 
              onClick={() => {
                setAdminTab('mapping');
                setAdminOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      {/* Applied Template Feedback Banner */}
      {appliedTemplateBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{appliedTemplateBanner} — all corresponding form fields have been populated.</span>
            </div>
            <button
              onClick={() => setAppliedTemplateBanner(null)}
              className="text-emerald-200 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0 hidden md:block">
          <nav className="space-y-1 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-neutral-200" />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const stepErrCount = Object.keys(validateStep(idx, formData)).length;
              const hasErrors = stepErrCount > 0 && stepSubmitted[idx];
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleSelectStep(idx)}
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-2 text-sm font-medium transition-colors relative z-10 rounded-lg group",
                    isCurrent ? "text-blue-600 font-semibold" : isPast ? "text-neutral-700 hover:text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                      hasErrors ? "border-rose-500 bg-rose-50 text-rose-600" :
                      isCurrent ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-100" : 
                      isPast ? "border-emerald-600 bg-emerald-600 text-white" : 
                      "border-neutral-300 bg-white"
                    )}>
                      {hasErrors ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : isPast ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span>{step.title}</span>
                  </div>

                  {/* Step status badges */}
                  {hasErrors && (
                    <span className="text-[11px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.5 rounded-full">
                      {stepErrCount}
                    </span>
                  )}
                  {isPast && stepErrCount === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-800">{STEPS[currentStep].title}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Step {currentStep + 1} of {STEPS.length} • Complete all required details to generate bank submission packages
                  </p>
                </div>

                {/* Real-time Step Validation Badge */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    isCurrentStepValid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : stepSubmitted[currentStep]
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-neutral-100 text-neutral-600 border-neutral-200"
                  )}>
                    {isCurrentStepValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All requirements met</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className={cn("w-3.5 h-3.5", stepSubmitted[currentStep] ? "text-rose-600" : "text-neutral-500")} />
                        <span>{currentErrorsCount} required field{currentErrorsCount > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Required Banner when user triggers Next with missing fields */}
              {validationAlert && (
                <div 
                  id="step-validation-alert"
                  className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-rose-900 text-sm">Action Required to Proceed</h4>
                      <p className="text-xs text-rose-700 mt-0.5">{validationAlert}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setValidationAlert(null)}
                    className="text-rose-500 hover:text-rose-800 text-xs font-semibold px-2 py-1 hover:bg-rose-100 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Step Components with real-time error props */}
              {currentStep === 0 && <StepKyc data={formData} update={updateData} />}
              
              {currentStep === 1 && (
                <StepPersonal 
                  data={formData} 
                  update={updateData} 
                  errors={currentErrors} 
                  showErrors={Boolean(stepSubmitted[1])} 
                />
              )}

              {currentStep === 2 && (
                <StepAddress 
                  data={formData} 
                  update={updateData} 
                  errors={currentErrors} 
                  showErrors={Boolean(stepSubmitted[2])} 
                />
              )}

              {currentStep === 3 && (
                <StepLiabilities 
                  data={formData} 
                  update={updateData} 
                  errors={currentErrors} 
                  showErrors={Boolean(stepSubmitted[3])} 
                />
              )}

              {currentStep === 4 && (
                <StepProperty 
                  data={formData} 
                  update={updateData} 
                  errors={currentErrors} 
                  showErrors={Boolean(stepSubmitted[4])} 
                />
              )}

              {currentStep === 5 && (
                <StepGenerate 
                  data={formData} 
                  update={updateData} 
                  onOpenAdmin={() => setAdminOpen(true)} 
                />
              )}
            </div>
            
            {/* Step Navigation Bar */}
            <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <div className="flex items-center gap-4">
                {/* Real-time missing field counter */}
                {currentErrorsCount > 0 && stepSubmitted[currentStep] ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{currentErrorsCount} missing field{currentErrorsCount > 1 ? 's' : ''}</span>
                  </div>
                ) : isCurrentStepValid && currentStep > 0 && currentStep < STEPS.length - 1 ? (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Valid & ready</span>
                  </div>
                ) : null}

                <button
                  onClick={handleNext}
                  disabled={currentStep === STEPS.length - 1}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2",
                    currentErrorsCount > 0 && stepSubmitted[currentStep]
                      ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300"
                      : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title={!isCurrentStepValid ? `Complete ${currentErrorsCount} missing mandatory fields to proceed` : 'Proceed to next step'}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AdminPanel 
        isOpen={adminOpen} 
        onClose={() => setAdminOpen(false)} 
        formDataKeys={Object.keys(initialData)}
        currentFormData={formData}
        onApplyTemplate={handleApplyTemplate}
        initialTab={adminTab}
      />
    </div>
  );
}
