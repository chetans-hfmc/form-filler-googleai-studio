import { FormData } from '../types';

export interface StepValidationError {
  field: keyof FormData | string;
  message: string;
}

export type StepErrors = Record<string, string>;

// Email regex helper
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Phone / mobile basic check
const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
};

// Validate individual steps
export function validateStep(stepIndex: number, data: FormData): StepErrors {
  const errors: StepErrors = {};

  switch (stepIndex) {
    case 0:
      // Step 0: Automated KYC upload (Optional upload; applicant can skip or upload)
      break;

    case 1: // Step 1: Personal Details
      if (!data.firstName?.trim()) {
        errors.firstName = 'First Name is mandatory.';
      }
      if (!data.lastName?.trim()) {
        errors.lastName = 'Last Name is mandatory.';
      }
      if (!data.dob?.trim()) {
        errors.dob = 'Date of Birth is mandatory.';
      }
      if (!data.gender) {
        errors.gender = 'Please select a gender.';
      }
      if (!data.nationality?.trim()) {
        errors.nationality = 'Nationality is mandatory.';
      }
      if (!data.emiratesId?.trim()) {
        errors.emiratesId = 'Emirates ID is mandatory.';
      } else if (data.emiratesId.replace(/\D/g, '').length < 10) {
        errors.emiratesId = 'Enter a valid Emirates ID number.';
      }
      if (!data.passportNo?.trim()) {
        errors.passportNo = 'Passport Number is mandatory.';
      }
      if (!data.mobileNumber?.trim()) {
        errors.mobileNumber = 'Mobile Number is mandatory.';
      } else if (!isValidPhone(data.mobileNumber)) {
        errors.mobileNumber = 'Enter a valid contact number.';
      }
      if (!data.personalEmail?.trim()) {
        errors.personalEmail = 'Personal Email is mandatory.';
      } else if (!isValidEmail(data.personalEmail)) {
        errors.personalEmail = 'Please provide a valid email address.';
      }
      if (!data.maritalStatus) {
        errors.maritalStatus = 'Marital Status is mandatory.';
      }

      // If Co-Applicant is checked
      if (data.hasCoApplicant) {
        if (!data.coAppFirstName?.trim()) {
          errors.coAppFirstName = 'Co-Applicant First Name is mandatory.';
        }
        if (!data.coAppLastName?.trim()) {
          errors.coAppLastName = 'Co-Applicant Last Name is mandatory.';
        }
      }
      break;

    case 2: // Step 2: Address & Office Details
      // Residence
      if (!data.residenceBuilding?.trim()) {
        errors.residenceBuilding = 'Building & Flat No. is mandatory.';
      }
      if (!data.residenceArea?.trim()) {
        errors.residenceArea = 'Area / Street is mandatory.';
      }
      if (!data.residenceCity?.trim()) {
        errors.residenceCity = 'City / Emirate is mandatory.';
      }
      if (!data.residenceStatus) {
        errors.residenceStatus = 'Residence status (Owned / Tenant) is mandatory.';
      }

      // Office
      if (!data.officeCompany?.trim()) {
        errors.officeCompany = 'Company / Employer Name is mandatory.';
      }
      if (!data.officeCity?.trim()) {
        errors.officeCity = 'Office City / Emirate is mandatory.';
      }
      if (data.officeHrEmail?.trim() && !isValidEmail(data.officeHrEmail)) {
        errors.officeHrEmail = 'Enter a valid HR email address.';
      }

      // Home Country
      if (!data.homeCountry?.trim()) {
        errors.homeCountry = 'Home Country is mandatory.';
      }
      if (!data.homeCity?.trim()) {
        errors.homeCity = 'Home City / State is mandatory.';
      }
      break;

    case 3: // Step 3: Liabilities
      // Validate partial loan entries (if user filled bank, outstanding & emi must also be filled)
      if (data.personalLoanBank?.trim()) {
        if (!data.personalLoanOs?.trim()) {
          errors.personalLoanOs = 'Outstanding balance required for personal loan.';
        }
        if (!data.personalLoanEmi?.trim()) {
          errors.personalLoanEmi = 'Monthly EMI required for personal loan.';
        }
      }
      if (data.carLoanBank?.trim()) {
        if (!data.carLoanOs?.trim()) {
          errors.carLoanOs = 'Outstanding balance required for auto loan.';
        }
        if (!data.carLoanEmi?.trim()) {
          errors.carLoanEmi = 'Monthly EMI required for auto loan.';
        }
      }
      if (data.homeLoanBank?.trim()) {
        if (!data.homeLoanOs?.trim()) {
          errors.homeLoanOs = 'Outstanding balance required for existing mortgage.';
        }
        if (!data.homeLoanEmi?.trim()) {
          errors.homeLoanEmi = 'Monthly EMI required for existing mortgage.';
        }
      }
      if (data.cc1Bank?.trim() && !data.cc1Limit?.trim()) {
        errors.cc1Limit = 'Card limit required for Credit Card 1.';
      }
      if (data.cc2Bank?.trim() && !data.cc2Limit?.trim()) {
        errors.cc2Limit = 'Card limit required for Credit Card 2.';
      }
      break;

    case 4: // Step 4: Property Details
      if (!data.propertyUsage) {
        errors.propertyUsage = 'Please select Property Usage.';
      }
      if (!data.propertyStatus) {
        errors.propertyStatus = 'Please select Property Status.';
      }
      if (!data.ownershipType) {
        errors.ownershipType = 'Please select Ownership Type.';
      }
      if (!data.marketType) {
        errors.marketType = 'Please select Market Type.';
      }
      if (data.propertyStatus === 'Finalized') {
        if (!data.propertyBuilding?.trim() && !data.propertyArea?.trim()) {
          errors.propertyBuilding = 'Building or Area is mandatory for finalized properties.';
        }
      }
      break;

    case 5: // Step 5: Generation
      if (!data.selectedBank?.trim()) {
        errors.selectedBank = 'Target Lending Institution is mandatory.';
      }
      if (!data.selectedFormType?.trim()) {
        errors.selectedFormType = 'Financing Structure is mandatory.';
      }
      break;

    default:
      break;
  }

  return errors;
}

// Get required field names for a specific step
export function getRequiredFieldsForStep(stepIndex: number, data: FormData): string[] {
  switch (stepIndex) {
    case 1:
      const p = ['firstName', 'lastName', 'dob', 'gender', 'nationality', 'emiratesId', 'passportNo', 'mobileNumber', 'personalEmail', 'maritalStatus'];
      if (data.hasCoApplicant) {
        p.push('coAppFirstName', 'coAppLastName');
      }
      return p;
    case 2:
      return ['residenceBuilding', 'residenceArea', 'residenceCity', 'residenceStatus', 'officeCompany', 'officeCity', 'homeCountry', 'homeCity'];
    case 4:
      const prop = ['propertyUsage', 'propertyStatus', 'ownershipType', 'marketType'];
      if (data.propertyStatus === 'Finalized') {
        prop.push('propertyBuilding');
      }
      return prop;
    case 5:
      return ['selectedBank', 'selectedFormType'];
    default:
      return [];
  }
}
