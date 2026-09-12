export interface FormData {
  // 1. Personal Details (Applicant)
  educationalQualification: string;
  residentOfUaeSince: string;
  personalEmail: string;
  officialEmail: string;
  mobileNumber: string;
  mothersFullName: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | '';
  numberOfDependents: string;
  numberOfChildrenSchooling: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  nationality: string;
  gender: 'Male' | 'Female' | '';
  passportNo: string;
  passportExpiry: string;
  emiratesId: string;
  emiratesIdExpiry: string;

  // 2. Co-Applicant
  hasCoApplicant: boolean;
  coAppEducationalQualification: string;
  coAppResidentOfUaeSince: string;
  coAppPersonalEmail: string;
  coAppOfficialEmail: string;
  coAppMobileNumber: string;
  coAppMothersFullName: string;
  coAppMaritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | '';
  coAppNumberOfDependents: string;
  coAppFirstName: string;
  coAppMiddleName: string;
  coAppLastName: string;
  coAppDob: string;
  coAppNationality: string;
  coAppGender: 'Male' | 'Female' | '';
  coAppPassportNo: string;
  coAppPassportExpiry: string;
  coAppEmiratesId: string;
  coAppEmiratesIdExpiry: string;

  // 3. Address - Residence
  residencePoBox: string;
  residenceBuilding: string;
  residenceArea: string;
  residenceLandmark: string;
  residenceCity: string;
  residenceCountry: string;
  residenceStatus: 'Owned' | 'Tenant' | '';
  residenceTelephone: string;

  // 3. Address - Office
  officeCompany: string;
  officeEmployeesInUae: string;
  officePoBox: string;
  officeBuilding: string;
  officeUnit: string;
  officeArea: string;
  officeLandmark: string;
  officeCity: string;
  officeCountry: string;
  officeStatus: 'Owned' | 'Tenant' | '';
  officeTelephone: string;
  officeHrEmail: string;
  officeSignatoryEmail: string;

  // Previous Company
  prevCompany: string;
  prevDesignation: string;
  prevAddress: string;
  prevDoj: string;
  prevDol: string;

  // References UAE
  ref1Name: string;
  ref1Mobile: string;
  ref1Email: string;
  ref1Emirate: string;

  ref2Name: string;
  ref2Mobile: string;
  ref2Email: string;
  ref2Emirate: string;

  // Home Country Address
  homePoBox: string;
  homeBuilding: string;
  homeUnit: string;
  homeArea: string;
  homeCity: string;
  homeCountry: string;
  homeStatus: 'Owned' | 'Tenant' | '';
  homeTelephone: string;
  homeState: string;

  // References Home
  homeRef1Name: string;
  homeRef1Mobile: string;
  homeRef1Email: string;

  homeRef2Name: string;
  homeRef2Mobile: string;
  homeRef2Email: string;

  // 5. Liabilities
  carLoanNo: string;
  carLoanEmi: string;
  carLoanOs: string;
  carLoanTerm: string;
  carLoanBank: string;

  personalLoanNo: string;
  personalLoanEmi: string;
  personalLoanOs: string;
  personalLoanTerm: string;
  personalLoanBank: string;

  homeLoanNo: string;
  homeLoanEmi: string;
  homeLoanOs: string;
  homeLoanTerm: string;
  homeLoanBank: string;

  cc1Limit: string;
  cc1Bank: string;

  cc2Limit: string;
  cc2Bank: string;

  // 6. Property Details
  propertyUsage: 'Personal Use' | 'Investment' | '';
  propertyStatus: 'Finalized' | 'Yet to be finalized' | '';
  ownershipType: 'Single' | 'Joint' | '';
  marketType: 'Primary' | 'Secondary' | '';
  propertyBuilding: string;
  propertyArea: string;
  propertyDeveloper: string;
  propertyProject: string;

  // Bank Selection
  selectedBank: string;
  selectedFormType: 'Islamic' | 'Non-Islamic' | '';
}

export interface VisualCoordinateMap {
  id: string;
  key: string;
  page: number; // 0-indexed
  x: number;    // percentage 0-100 from left
  y: number;    // percentage 0-100 from top
}

export interface BankRecord {
  code: string;
  name: string;
  shortName?: string;
  type?: 'Islamic' | 'Conventional' | 'Both';
  website?: string;
  supportPhone?: string;
  formsCount?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankFormItem {
  id: string;
  bank: string;
  formType: 'Islamic' | 'Non-Islamic' | 'All';
  name: string;
  category: 'Application' | 'Consent' | 'Banking' | 'Insurance' | 'Undertaking' | 'Other';
  description?: string;
  hasFile: boolean;
  fileName?: string;
  pageCount?: number;
  visualMappings: VisualCoordinateMap[];
  fieldMappings?: Record<string, string>;
  updatedAt: string;
}


