import express from 'express';
import path from 'path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, rgb, StandardFonts } from 'pdf-lib';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// File-backed persistence directories
const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const FORMS_FILE = path.join(DATA_DIR, 'forms.json');
const BANKS_FILE = path.join(DATA_DIR, 'banks.json');
const FORM_TEMPLATES_FILE = path.join(DATA_DIR, 'form_templates.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

export interface FormTemplateRecord {
  id: string;
  name: string;
  description: string;
  category: 'Salaried' | 'Self-Employed' | 'Executive' | 'Investor' | 'Non-Resident' | 'Joint' | 'Custom';
  tags?: string[];
  isBuiltIn?: boolean;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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

export interface VisualCoordinateMap {
  id: string;
  key: string;
  page: number; // 0-indexed
  x: number;    // percentage 0-100 from left
  y: number;    // percentage 0-100 from top
}

export interface BankFormRecord {
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

// Default UAE banks list
const DEFAULT_SEED_BANKS: BankRecord[] = [
  { code: 'ADIB', name: 'Abu Dhabi Islamic Bank', shortName: 'ADIB', type: 'Islamic', website: 'https://www.adib.ae', isDefault: true },
  { code: 'DIB', name: 'Dubai Islamic Bank', shortName: 'DIB', type: 'Islamic', website: 'https://www.dib.ae', isDefault: true },
  { code: 'ENBD', name: 'Emirates NBD', shortName: 'Emirates NBD', type: 'Both', website: 'https://www.emiratesnbd.com', isDefault: true },
  { code: 'FAB', name: 'First Abu Dhabi Bank', shortName: 'FAB', type: 'Both', website: 'https://www.bankfab.com', isDefault: true },
  { code: 'ADCB', name: 'Abu Dhabi Commercial Bank', shortName: 'ADCB', type: 'Both', website: 'https://www.adcb.com', isDefault: true },
  { code: 'MASHREQ', name: 'Mashreq Bank', shortName: 'Mashreq', type: 'Both', website: 'https://www.mashreqbank.com', isDefault: false },
  { code: 'RAKBANK', name: 'National Bank of Ras Al Khaimah (RAKBANK)', shortName: 'RAKBANK', type: 'Both', website: 'https://rakbank.ae', isDefault: false },
  { code: 'CBD', name: 'Commercial Bank of Dubai', shortName: 'CBD', type: 'Both', website: 'https://www.cbd.ae', isDefault: false },
  { code: 'SIB', name: 'Sharjah Islamic Bank', shortName: 'SIB', type: 'Islamic', website: 'https://www.sib.ae', isDefault: false },
  { code: 'AJMAN', name: 'Ajman Bank', shortName: 'Ajman Bank', type: 'Islamic', website: 'https://www.ajmanbank.ae', isDefault: false },
  { code: 'HSBC', name: 'HSBC Middle East', shortName: 'HSBC', type: 'Conventional', website: 'https://www.hsbc.ae', isDefault: false },
  { code: 'SCB', name: 'Standard Chartered UAE', shortName: 'Standard Chartered', type: 'Both', website: 'https://www.sc.com/ae', isDefault: false }
];

// Helper to generate the 6 standard UAE mortgage forms for any bank
function createStandardFormsForBank(bankCode: string, bankName: string): BankFormRecord[] {
  const code = bankCode.toUpperCase();
  const lower = code.toLowerCase();
  return [
    {
      id: `${lower}_main_islamic`,
      bank: code,
      formType: 'Islamic',
      name: `${bankName} Home Finance Application Form (Islamic)`,
      category: 'Application',
      description: `Official ${code} Islamic home finance application form for Ijara & Murabaha home purchase.`,
      hasFile: false,
      pageCount: 4,
      visualMappings: [
        { id: `${lower}_m1`, key: 'firstName', page: 0, x: 25, y: 18 },
        { id: `${lower}_m2`, key: 'lastName', page: 0, x: 65, y: 18 },
        { id: `${lower}_m3`, key: 'dob', page: 0, x: 25, y: 23 },
        { id: `${lower}_m4`, key: 'nationality', page: 0, x: 65, y: 23 },
        { id: `${lower}_m5`, key: 'passportNo', page: 0, x: 25, y: 28 },
        { id: `${lower}_m6`, key: 'emiratesId', page: 0, x: 65, y: 28 },
        { id: `${lower}_m7`, key: 'mobileNumber', page: 0, x: 25, y: 33 },
        { id: `${lower}_m8`, key: 'personalEmail', page: 0, x: 65, y: 33 },
        { id: `${lower}_m9`, key: 'residenceBuilding', page: 0, x: 25, y: 38 },
        { id: `${lower}_m10`, key: 'residenceCity', page: 0, x: 65, y: 38 },
        { id: `${lower}_m11`, key: 'officeCompany', page: 1, x: 25, y: 18 },
        { id: `${lower}_m12`, key: 'officeTelephone', page: 1, x: 65, y: 18 },
        { id: `${lower}_m13`, key: 'officeHrEmail', page: 1, x: 25, y: 23 },
        { id: `${lower}_m14`, key: 'propertyBuilding', page: 2, x: 25, y: 20 },
        { id: `${lower}_m15`, key: 'propertyArea', page: 2, x: 65, y: 20 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    },
    {
      id: `${lower}_main_conventional`,
      bank: code,
      formType: 'Non-Islamic',
      name: `${bankName} Mortgage Application Form (Conventional)`,
      category: 'Application',
      description: `Official ${code} conventional mortgage loan application with interest-bearing schedule and covenants.`,
      hasFile: false,
      pageCount: 4,
      visualMappings: [
        { id: `${lower}_mc1`, key: 'firstName', page: 0, x: 25, y: 18 },
        { id: `${lower}_mc2`, key: 'lastName', page: 0, x: 65, y: 18 },
        { id: `${lower}_mc3`, key: 'dob', page: 0, x: 25, y: 23 },
        { id: `${lower}_mc4`, key: 'nationality', page: 0, x: 65, y: 23 },
        { id: `${lower}_mc5`, key: 'passportNo', page: 0, x: 25, y: 28 },
        { id: `${lower}_mc6`, key: 'emiratesId', page: 0, x: 65, y: 28 },
        { id: `${lower}_mc7`, key: 'mobileNumber', page: 0, x: 25, y: 33 },
        { id: `${lower}_mc8`, key: 'personalEmail', page: 0, x: 65, y: 33 },
        { id: `${lower}_mc9`, key: 'officeCompany', page: 1, x: 25, y: 18 },
        { id: `${lower}_mc10`, key: 'propertyBuilding', page: 2, x: 25, y: 20 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    },
    {
      id: `${lower}_aecb_consent`,
      bank: code,
      formType: 'All',
      name: `${code} - AECB Credit Bureau Consent & Authorization`,
      category: 'Consent',
      description: `Al Etihad Credit Bureau (AECB) mandatory consent authorizing ${code} to pull credit bureau scores and liability records.`,
      hasFile: false,
      pageCount: 2,
      visualMappings: [
        { id: `${lower}_c1`, key: 'firstName', page: 0, x: 25, y: 20 },
        { id: `${lower}_c2`, key: 'lastName', page: 0, x: 60, y: 20 },
        { id: `${lower}_c3`, key: 'emiratesId', page: 0, x: 25, y: 26 },
        { id: `${lower}_c4`, key: 'passportNo', page: 0, x: 60, y: 26 },
        { id: `${lower}_c5`, key: 'dob', page: 0, x: 25, y: 32 },
        { id: `${lower}_c6`, key: 'nationality', page: 0, x: 60, y: 32 },
        { id: `${lower}_c7`, key: 'mobileNumber', page: 0, x: 25, y: 38 },
        { id: `${lower}_c8`, key: 'personalEmail', page: 0, x: 60, y: 38 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    },
    {
      id: `${lower}_direct_debit`,
      bank: code,
      formType: 'All',
      name: `${code} Direct Debit Authority Mandate (UAEDDS)`,
      category: 'Banking',
      description: `UAE Central Bank Direct Debit System (UAEDDS) mandate form for automated monthly EMI deductions.`,
      hasFile: false,
      pageCount: 2,
      visualMappings: [
        { id: `${lower}_dd1`, key: 'firstName', page: 0, x: 30, y: 22 },
        { id: `${lower}_dd2`, key: 'lastName', page: 0, x: 65, y: 22 },
        { id: `${lower}_dd3`, key: 'emiratesId', page: 0, x: 30, y: 28 },
        { id: `${lower}_dd4`, key: 'mobileNumber', page: 0, x: 65, y: 28 },
        { id: `${lower}_dd5`, key: 'residencePoBox', page: 0, x: 30, y: 34 },
        { id: `${lower}_dd6`, key: 'residenceCity', page: 0, x: 65, y: 34 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    },
    {
      id: `${lower}_coapp_undertaking`,
      bank: code,
      formType: 'All',
      name: `${code} Co-Applicant Supplementary Undertaking Form`,
      category: 'Undertaking',
      description: `Joint applicant liability undertaking and KYC verification for ${code} mortgage applications.`,
      hasFile: false,
      pageCount: 2,
      visualMappings: [
        { id: `${lower}_co1`, key: 'firstName', page: 0, x: 30, y: 16 },
        { id: `${lower}_co2`, key: 'lastName', page: 0, x: 65, y: 16 },
        { id: `${lower}_co3`, key: 'coAppFirstName', page: 0, x: 30, y: 25 },
        { id: `${lower}_co4`, key: 'coAppLastName', page: 0, x: 65, y: 25 },
        { id: `${lower}_co5`, key: 'coAppEmiratesId', page: 0, x: 30, y: 32 },
        { id: `${lower}_co6`, key: 'coAppPassportNo', page: 0, x: 65, y: 32 },
        { id: `${lower}_co7`, key: 'coAppMobileNumber', page: 0, x: 30, y: 38 },
        { id: `${lower}_co8`, key: 'coAppPersonalEmail', page: 0, x: 65, y: 38 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    },
    {
      id: `${lower}_insurance`,
      bank: code,
      formType: 'All',
      name: `${code} Group Takaful / Life & Property Insurance Enrollment`,
      category: 'Insurance',
      description: `Mortgage protection plan covering property fire/all-risk and primary borrower life coverage for ${code}.`,
      hasFile: false,
      pageCount: 3,
      visualMappings: [
        { id: `${lower}_ins1`, key: 'firstName', page: 0, x: 25, y: 18 },
        { id: `${lower}_ins2`, key: 'lastName', page: 0, x: 65, y: 18 },
        { id: `${lower}_ins3`, key: 'dob', page: 0, x: 25, y: 24 },
        { id: `${lower}_ins4`, key: 'gender', page: 0, x: 65, y: 24 },
        { id: `${lower}_ins5`, key: 'emiratesId', page: 0, x: 25, y: 30 },
        { id: `${lower}_ins6`, key: 'mobileNumber', page: 0, x: 65, y: 30 },
      ],
      fieldMappings: {},
      updatedAt: new Date().toISOString()
    }
  ];
}

// In-memory cache synced with disk
let banksCache: BankRecord[] = [];
let formsCache: BankFormRecord[] = [];
let formTemplatesCache: FormTemplateRecord[] = [];

// Realistic UAE Mortgage Form Templates
const DEFAULT_SEED_TEMPLATES: FormTemplateRecord[] = [
  {
    id: 'tpl_salaried_expat',
    name: 'Salaried - Expat Professional',
    description: 'High-earning multinational corporate employee in Dubai Marina with clean credit and auto loan. Ideal for standard prime mortgage applications.',
    category: 'Salaried',
    tags: ['Salaried', 'MNC', 'Expat', 'Dubai Marina', 'ADIB'],
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      educationalQualification: 'Master / Post Graduate',
      residentOfUaeSince: '2016-03-01',
      personalEmail: 'tariq.mansoor@gmail.com',
      officialEmail: 't.mansoor@deloitte.com',
      mobileNumber: '+971 50 234 5678',
      mothersFullName: 'Fatima Mansoor',
      maritalStatus: 'Married',
      numberOfDependents: '2',
      numberOfChildrenSchooling: '1',
      firstName: 'Tariq',
      middleName: 'Hussain',
      lastName: 'Mansoor',
      dob: '1986-07-14',
      nationality: 'Pakistan',
      gender: 'Male',
      passportNo: 'PK9082341',
      passportExpiry: '2031-05-20',
      emiratesId: '784-1986-1928374-1',
      emiratesIdExpiry: '2028-09-15',
      hasCoApplicant: false,
      residencePoBox: '45892',
      residenceBuilding: 'Marina Gate Tower 2, Apt 1804',
      residenceArea: 'Dubai Marina Walk',
      residenceLandmark: 'Near Spinneys Marina',
      residenceCity: 'Dubai',
      residenceCountry: 'United Arab Emirates',
      residenceStatus: 'Tenant',
      residenceTelephone: '+971 4 399 1122',
      officeCompany: 'Deloitte Middle East LLC',
      officeEmployeesInUae: '1500+',
      officePoBox: '9440',
      officeBuilding: 'Emaar Square, Building 3',
      officeUnit: 'Office 402, 4th Floor',
      officeArea: 'Downtown Dubai',
      officeLandmark: 'Opposite Dubai Mall Metro',
      officeCity: 'Dubai',
      officeCountry: 'United Arab Emirates',
      officeStatus: 'Tenant',
      officeTelephone: '+971 4 376 8888',
      officeHrEmail: 'hr.me@deloitte.com',
      officeSignatoryEmail: 'signatory.deloitte@deloitte.com',
      prevCompany: 'KPMG Lower Gulf',
      prevDesignation: 'Senior Audit Manager',
      prevAddress: 'Al Fardan Office Tower, Dubai',
      prevDoj: '2016-04-01',
      prevDol: '2021-08-31',
      ref1Name: 'Adnan Siddiqui',
      ref1Mobile: '+971 55 334 1122',
      ref1Email: 'adnan.siddiqui@gmail.com',
      ref1Emirate: 'Dubai',
      ref2Name: 'Rashid Al Nuaimi',
      ref2Mobile: '+971 50 889 4433',
      ref2Email: 'rashid.nuaimi@adcb.ae',
      ref2Emirate: 'Abu Dhabi',
      homePoBox: '75500',
      homeBuilding: 'Gulberg Heights, Apt 401',
      homeUnit: 'Flat 401',
      homeArea: 'Clifton Block 5',
      homeCity: 'Karachi',
      homeState: 'Sindh',
      homeCountry: 'Pakistan',
      homeStatus: 'Owned',
      homeTelephone: '+92 21 3587 9900',
      homeRef1Name: 'Zubair Mansoor',
      homeRef1Mobile: '+92 300 829 1122',
      homeRef1Email: 'zubair.mansoor@yahoo.com',
      homeRef2Name: 'Kamran Baig',
      homeRef2Mobile: '+92 321 998 3344',
      homeRef2Email: 'kamran.b@gmail.com',
      carLoanBank: 'Emirates NBD',
      carLoanOs: '38,000',
      carLoanEmi: '1,950',
      carLoanTerm: '20',
      carLoanNo: 'AL-998822',
      personalLoanBank: '',
      personalLoanOs: '',
      personalLoanEmi: '',
      personalLoanTerm: '',
      personalLoanNo: '',
      homeLoanBank: '',
      homeLoanOs: '',
      homeLoanEmi: '',
      homeLoanTerm: '',
      homeLoanNo: '',
      cc1Bank: 'ADCB',
      cc1Limit: '45,000',
      cc2Bank: 'FAB',
      cc2Limit: '25,000',
      propertyUsage: 'Personal Use',
      propertyStatus: 'Finalized',
      ownershipType: 'Single',
      marketType: 'Secondary',
      propertyBuilding: 'The Springs 14, Villa 32',
      propertyArea: 'The Springs, Emirates Living',
      propertyDeveloper: 'Emaar Properties',
      propertyProject: 'The Springs',
      selectedBank: 'ADIB',
      selectedFormType: 'Islamic',
    }
  },
  {
    id: 'tpl_self_employed_owner',
    name: 'Self-Employed - Business Owner',
    description: 'Managing Director & Partner of a DMCC Freezone technology firm. Owned residence in JLT, existing personal facility and primary market investment property.',
    category: 'Self-Employed',
    tags: ['Self-Employed', 'DMCC', 'Business Owner', 'JLT', 'Investment'],
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      educationalQualification: 'Bachelor Degree',
      residentOfUaeSince: '2012-08-15',
      personalEmail: 'vikram.k@apextech.ae',
      officialEmail: 'vikram@apextech.ae',
      mobileNumber: '+971 52 876 5432',
      mothersFullName: 'Kavita Khurana',
      maritalStatus: 'Married',
      numberOfDependents: '3',
      numberOfChildrenSchooling: '2',
      firstName: 'Vikram',
      middleName: 'Raj',
      lastName: 'Khurana',
      dob: '1982-11-25',
      nationality: 'India',
      gender: 'Male',
      passportNo: 'Z4928172',
      passportExpiry: '2030-08-10',
      emiratesId: '784-1982-8827163-1',
      emiratesIdExpiry: '2029-04-12',
      hasCoApplicant: false,
      residencePoBox: '64321',
      residenceBuilding: 'Al Seef Tower 2, Penthouse 32',
      residenceArea: 'Cluster U, Jumeirah Lakes Towers',
      residenceLandmark: 'Opposite DMCC Metro',
      residenceCity: 'Dubai',
      residenceCountry: 'United Arab Emirates',
      residenceStatus: 'Owned',
      residenceTelephone: '+971 4 421 9088',
      officeCompany: 'Apex Digital Technologies FZCO',
      officeEmployeesInUae: '32',
      officePoBox: '34055',
      officeBuilding: 'Silver Tower, Cluster I',
      officeUnit: 'Office 2104, 21st Floor',
      officeArea: 'JLT',
      officeLandmark: 'Near Saba Tower',
      officeCity: 'Dubai',
      officeCountry: 'United Arab Emirates',
      officeStatus: 'Owned',
      officeTelephone: '+971 4 456 7890',
      officeHrEmail: 'admin@apextech.ae',
      officeSignatoryEmail: 'finance@apextech.ae',
      prevCompany: 'Infosys Middle East',
      prevDesignation: 'Regional Delivery Head',
      prevAddress: 'Dubai Internet City, Bldg 3',
      prevDoj: '2012-09-01',
      prevDol: '2018-05-31',
      ref1Name: 'Sanjay Kapoor',
      ref1Mobile: '+971 50 445 6677',
      ref1Email: 'sanjay.kapoor@venture.ae',
      ref1Emirate: 'Dubai',
      ref2Name: 'Deepak Varma',
      ref2Mobile: '+971 55 998 1122',
      ref2Email: 'd.varma@consulting.ae',
      ref2Emirate: 'Dubai',
      homePoBox: '400050',
      homeBuilding: 'Sea Pearl Apts, Flat 702',
      homeUnit: 'Flat 702',
      homeArea: 'Bandra West, Hill Road',
      homeCity: 'Mumbai',
      homeState: 'Maharashtra',
      homeCountry: 'India',
      homeStatus: 'Owned',
      homeTelephone: '+91 22 2640 5544',
      homeRef1Name: 'Sunil Khurana',
      homeRef1Mobile: '+91 98200 44332',
      homeRef1Email: 'sunil.k@rediffmail.com',
      homeRef2Name: 'Pradeep Joshi',
      homeRef2Mobile: '+91 98190 77665',
      homeRef2Email: 'p.joshi@gmail.com',
      carLoanBank: 'FAB',
      carLoanOs: '75,000',
      carLoanEmi: '3,200',
      carLoanTerm: '26',
      carLoanNo: 'AL-554433',
      personalLoanBank: 'ADCB',
      personalLoanOs: '110,000',
      personalLoanEmi: '4,450',
      personalLoanTerm: '28',
      personalLoanNo: 'PL-889900',
      homeLoanBank: '',
      homeLoanOs: '',
      homeLoanEmi: '',
      homeLoanTerm: '',
      homeLoanNo: '',
      cc1Bank: 'Emirates NBD',
      cc1Limit: '60,000',
      cc2Bank: 'Mashreq',
      cc2Limit: '35,000',
      propertyUsage: 'Investment',
      propertyStatus: 'Finalized',
      ownershipType: 'Single',
      marketType: 'Primary',
      propertyBuilding: 'Creek Horizon Tower 1, Apt 1405',
      propertyArea: 'Dubai Creek Harbour',
      propertyDeveloper: 'Emaar Properties',
      propertyProject: 'Creek Horizon',
      selectedBank: 'DIB',
      selectedFormType: 'Islamic',
    }
  },
  {
    id: 'tpl_joint_couple',
    name: 'Joint Borrowers - Salaried Couple',
    description: 'Married couple applying jointly with primary borrower in Emirates Aviation and co-applicant spouse in Dubai Healthcare, pooling income for maximum loan affordability.',
    category: 'Joint',
    tags: ['Joint', 'Co-Applicant', 'Dual Income', 'Emirates', 'Healthcare'],
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      educationalQualification: 'Bachelor Degree',
      residentOfUaeSince: '2015-06-10',
      personalEmail: 'carlos.mendoza@gmail.com',
      officialEmail: 'carlos.mendoza@emirates.com',
      mobileNumber: '+971 56 123 7890',
      mothersFullName: 'Maria Elena Mendoza',
      maritalStatus: 'Married',
      numberOfDependents: '1',
      numberOfChildrenSchooling: '1',
      firstName: 'Carlos',
      middleName: 'Eduardo',
      lastName: 'Mendoza',
      dob: '1984-03-22',
      nationality: 'Spain',
      gender: 'Male',
      passportNo: 'ES8829103',
      passportExpiry: '2032-11-15',
      emiratesId: '784-1984-6638291-1',
      emiratesIdExpiry: '2028-10-30',
      hasCoApplicant: true,
      coAppFirstName: 'Elena',
      coAppMiddleName: 'Sofia',
      coAppLastName: 'Mendoza',
      coAppDob: '1987-09-18',
      coAppNationality: 'Spain',
      coAppGender: 'Female',
      coAppPassportNo: 'ES9938201',
      coAppPassportExpiry: '2033-04-20',
      coAppEmiratesId: '784-1987-5544332-2',
      coAppEmiratesIdExpiry: '2028-10-30',
      coAppEducationalQualification: 'Master / Post Graduate',
      coAppResidentOfUaeSince: '2015-06-10',
      coAppPersonalEmail: 'elena.mendoza@gmail.com',
      coAppOfficialEmail: 'elena.m@mediclinic.ae',
      coAppMobileNumber: '+971 56 987 6543',
      coAppMothersFullName: 'Carmen Rodriguez',
      coAppMaritalStatus: 'Married',
      coAppNumberOfDependents: '0',
      residencePoBox: '33201',
      residenceBuilding: 'Downtown Views II, Tower 2, Apt 2201',
      residenceArea: 'Downtown Dubai',
      residenceLandmark: 'Adjacent to Dubai Mall Zabeel',
      residenceCity: 'Dubai',
      residenceCountry: 'United Arab Emirates',
      residenceStatus: 'Tenant',
      residenceTelephone: '+971 4 332 5544',
      officeCompany: 'Emirates Airlines Group',
      officeEmployeesInUae: '25000+',
      officePoBox: '686',
      officeBuilding: 'Emirates Group Headquarters',
      officeUnit: 'Flight Operations, Block B',
      officeArea: 'Airport Road, Garhoud',
      officeLandmark: 'Opposite Terminal 3',
      officeCity: 'Dubai',
      officeCountry: 'United Arab Emirates',
      officeStatus: 'Owned',
      officeTelephone: '+971 4 286 4444',
      officeHrEmail: 'hr.recruitment@emirates.com',
      officeSignatoryEmail: 'salary.admin@emirates.com',
      prevCompany: 'Iberia Airlines',
      prevDesignation: 'First Officer',
      prevAddress: 'Barajas Airport, Madrid',
      prevDoj: '2010-01-15',
      prevDol: '2015-05-30',
      ref1Name: 'Captain David Miller',
      ref1Mobile: '+971 50 223 9988',
      ref1Email: 'david.miller@emirates.com',
      ref1Emirate: 'Dubai',
      ref2Name: 'Dr. Sarah Jenkins',
      ref2Mobile: '+971 55 443 2211',
      ref2Email: 's.jenkins@mediclinic.ae',
      ref2Emirate: 'Dubai',
      homePoBox: '28001',
      homeBuilding: 'Calle de Serrano 45',
      homeUnit: 'Piso 3-B',
      homeArea: 'Barrio de Salamanca',
      homeCity: 'Madrid',
      homeState: 'Comunidad de Madrid',
      homeCountry: 'Spain',
      homeStatus: 'Owned',
      homeTelephone: '+34 91 556 7890',
      homeRef1Name: 'Javier Mendoza',
      homeRef1Mobile: '+34 610 223 344',
      homeRef1Email: 'javier.m@telefonica.es',
      homeRef2Name: 'Lucia Gomez',
      homeRef2Mobile: '+34 622 998 877',
      homeRef2Email: 'lucia.g@gmail.com',
      carLoanBank: '',
      carLoanOs: '',
      carLoanEmi: '',
      carLoanTerm: '',
      carLoanNo: '',
      personalLoanBank: '',
      personalLoanOs: '',
      personalLoanEmi: '',
      personalLoanTerm: '',
      personalLoanNo: '',
      homeLoanBank: '',
      homeLoanOs: '',
      homeLoanEmi: '',
      homeLoanTerm: '',
      homeLoanNo: '',
      cc1Bank: 'Citi UAE',
      cc1Limit: '50,000',
      cc2Bank: 'HSBC UAE',
      cc2Limit: '30,000',
      propertyUsage: 'Personal Use',
      propertyStatus: 'Finalized',
      ownershipType: 'Joint',
      marketType: 'Secondary',
      propertyBuilding: 'Arabian Ranches 2, Camelia Villa 45',
      propertyArea: 'Arabian Ranches, Dubai',
      propertyDeveloper: 'Emaar Properties',
      propertyProject: 'Camelia Villas',
      selectedBank: 'ENBD',
      selectedFormType: 'Non-Islamic',
    }
  },
  {
    id: 'tpl_non_resident_investor',
    name: 'Non-Resident - International Investor',
    description: 'International overseas investor purchasing prime freehold off-plan residential unit. Clean zero UAE debt profile with international residence.',
    category: 'Non-Resident',
    tags: ['Non-Resident', 'Overseas', 'Investor', 'Off-Plan', 'Emaar'],
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      educationalQualification: 'Post Graduate / MBA',
      residentOfUaeSince: '',
      personalEmail: 'alexander.schmidt@investor-berlin.de',
      officialEmail: 'a.schmidt@schmidt-holdings.de',
      mobileNumber: '+49 171 2345678',
      mothersFullName: 'Greta Schmidt',
      maritalStatus: 'Married',
      numberOfDependents: '2',
      numberOfChildrenSchooling: '2',
      firstName: 'Alexander',
      middleName: 'Wilhelm',
      lastName: 'Schmidt',
      dob: '1979-05-12',
      nationality: 'Germany',
      gender: 'Male',
      passportNo: 'C11223344',
      passportExpiry: '2033-02-10',
      emiratesId: '',
      emiratesIdExpiry: '',
      hasCoApplicant: false,
      residencePoBox: '10117',
      residenceBuilding: 'Unter den Linden 42',
      residenceArea: 'Mitte',
      residenceLandmark: 'Near Brandenburg Gate',
      residenceCity: 'Berlin',
      residenceCountry: 'Germany',
      residenceStatus: 'Owned',
      residenceTelephone: '+49 30 2094 5000',
      officeCompany: 'Schmidt Vermögensverwaltung GmbH',
      officeEmployeesInUae: '0',
      officePoBox: '10117',
      officeBuilding: 'Friedrichstraße 90',
      officeUnit: 'Suite 500',
      officeArea: 'Mitte',
      officeLandmark: 'Friedrichstraße Station',
      officeCity: 'Berlin',
      officeCountry: 'Germany',
      officeStatus: 'Owned',
      officeTelephone: '+49 30 8899 1000',
      officeHrEmail: 'office@schmidt-holdings.de',
      officeSignatoryEmail: 'directors@schmidt-holdings.de',
      prevCompany: 'Siemens AG',
      prevDesignation: 'Executive Vice President',
      prevAddress: 'Munich, Germany',
      prevDoj: '2005-01-01',
      prevDol: '2019-12-31',
      ref1Name: 'Wolfgang Becker',
      ref1Mobile: '+49 170 9988776',
      ref1Email: 'w.becker@berlin-capital.de',
      ref1Emirate: 'Dubai',
      ref2Name: 'Maximilian Weber',
      ref2Mobile: '+49 172 5544332',
      ref2Email: 'max.weber@weber-law.de',
      ref2Emirate: 'Dubai',
      homePoBox: '10117',
      homeBuilding: 'Unter den Linden 42',
      homeUnit: 'Penthouse',
      homeArea: 'Mitte',
      homeCity: 'Berlin',
      homeState: 'Berlin',
      homeCountry: 'Germany',
      homeStatus: 'Owned',
      homeTelephone: '+49 30 2094 5000',
      homeRef1Name: 'Klaus Schmidt',
      homeRef1Mobile: '+49 171 8877665',
      homeRef1Email: 'klaus.schmidt@t-online.de',
      homeRef2Name: 'Dieter Fischer',
      homeRef2Mobile: '+49 170 3322110',
      homeRef2Email: 'd.fischer@fischer-gmbh.de',
      carLoanBank: '',
      carLoanOs: '',
      carLoanEmi: '',
      carLoanTerm: '',
      carLoanNo: '',
      personalLoanBank: '',
      personalLoanOs: '',
      personalLoanEmi: '',
      personalLoanTerm: '',
      personalLoanNo: '',
      homeLoanBank: '',
      homeLoanOs: '',
      homeLoanEmi: '',
      homeLoanTerm: '',
      homeLoanNo: '',
      cc1Bank: '',
      cc1Limit: '',
      cc2Bank: '',
      cc2Limit: '',
      propertyUsage: 'Investment',
      propertyStatus: 'Finalized',
      ownershipType: 'Single',
      marketType: 'Primary',
      propertyBuilding: 'Burj Crown, Unit 1904',
      propertyArea: 'Downtown Dubai',
      propertyDeveloper: 'Emaar Properties',
      propertyProject: 'Burj Crown',
      selectedBank: 'FAB',
      selectedFormType: 'Non-Islamic',
    }
  }
];

function loadBanksFromDisk(): BankRecord[] {
  try {
    if (fs.existsSync(BANKS_FILE)) {
      const data = fs.readFileSync(BANKS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading banks from disk:', e);
  }

  const initial = [...DEFAULT_SEED_BANKS];
  saveBanksToDisk(initial);
  return initial;
}

function saveBanksToDisk(banks: BankRecord[]) {
  try {
    fs.writeFileSync(BANKS_FILE, JSON.stringify(banks, null, 2), 'utf-8');
    banksCache = banks;
  } catch (e) {
    console.error('Error saving banks to disk:', e);
  }
}

// Initial seed forms for UAE mortgage consultancy
function getInitialSeedForms(): BankFormRecord[] {
  const banks = loadBanksFromDisk();
  const forms: BankFormRecord[] = [];

  banks.forEach(b => {
    forms.push(...createStandardFormsForBank(b.code, b.name));
  });

  return forms;
}


// Load forms from disk or initial seed

function loadFormsFromDisk(): BankFormRecord[] {
  try {
    if (fs.existsSync(FORMS_FILE)) {
      const data = fs.readFileSync(FORMS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading forms from disk:', e);
  }

  const initial = getInitialSeedForms();
  saveFormsToDisk(initial);
  return initial;
}

function saveFormsToDisk(forms: BankFormRecord[]) {
  try {
    fs.writeFileSync(FORMS_FILE, JSON.stringify(forms, null, 2), 'utf-8');
    formsCache = forms;
  } catch (e) {
    console.error('Error saving forms to disk:', e);
  }
}

// Load form templates from disk or initial seed
function loadFormTemplatesFromDisk(): FormTemplateRecord[] {
  try {
    if (fs.existsSync(FORM_TEMPLATES_FILE)) {
      const data = fs.readFileSync(FORM_TEMPLATES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading form templates from disk:', e);
  }

  const initial = [...DEFAULT_SEED_TEMPLATES];
  saveFormTemplatesToDisk(initial);
  return initial;
}

function saveFormTemplatesToDisk(templates: FormTemplateRecord[]) {
  try {
    fs.writeFileSync(FORM_TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
    formTemplatesCache = templates;
  } catch (e) {
    console.error('Error saving form templates to disk:', e);
  }
}

// Initialize cache
banksCache = loadBanksFromDisk();
formsCache = loadFormsFromDisk();
formTemplatesCache = loadFormTemplatesFromDisk();

// Template PDF buffer helper
function getTemplateBuffer(formId: string): Buffer | null {
  const filePath = path.join(TEMPLATES_DIR, `${formId}.pdf`);
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath);
    } catch {
      return null;
    }
  }
  return null;
}

function saveTemplateBuffer(formId: string, buffer: Buffer) {
  const filePath = path.join(TEMPLATES_DIR, `${formId}.pdf`);
  fs.writeFileSync(filePath, buffer);
}

function deleteTemplateBuffer(formId: string) {
  const filePath = path.join(TEMPLATES_DIR, `${formId}.pdf`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }
}

// Draw fallback official bank document if blank template is not yet uploaded
async function generateFallbackPdf(form: BankFormRecord, data: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 30,
    y: height - 80,
    width: width - 60,
    height: 50,
    color: rgb(0.08, 0.28, 0.58),
  });

  page.drawText(`${form.bank.toUpperCase()} MORTGAGE CONSULTANCY SUBMISSION`, {
    x: 45,
    y: height - 55,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(form.name, {
    x: 45,
    y: height - 70,
    size: 10,
    font,
    color: rgb(0.85, 0.92, 1),
  });

  let currentY = height - 110;

  const drawSection = (title: string, fields: Array<{ label: string; value: string }>) => {
    page.drawText(title.toUpperCase(), {
      x: 35,
      y: currentY,
      size: 10,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3),
    });
    page.drawLine({
      start: { x: 35, y: currentY - 3 },
      end: { x: width - 35, y: currentY - 3 },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9),
    });
    currentY -= 18;

    let col = 0;
    for (const f of fields) {
      const xPos = col === 0 ? 35 : width / 2 + 10;
      page.drawText(`${f.label}:`, {
        x: xPos,
        y: currentY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.4, 0.45, 0.5),
      });
      page.drawText(String(f.value || 'N/A'), {
        x: xPos + 100,
        y: currentY,
        size: 8.5,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      if (col === 1) {
        currentY -= 15;
        col = 0;
      } else {
        col = 1;
      }
    }
    if (col === 1) currentY -= 15;
    currentY -= 12;
  };

  // Sections
  drawSection('1. Applicant Details', [
    { label: 'Full Name', value: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim() },
    { label: 'Nationality', value: data.nationality },
    { label: 'Date of Birth', value: data.dob },
    { label: 'Gender', value: data.gender },
    { label: 'Emirates ID', value: data.emiratesId },
    { label: 'EID Expiry', value: data.emiratesIdExpiry },
    { label: 'Passport No', value: data.passportNo },
    { label: 'Passport Expiry', value: data.passportExpiry },
    { label: 'Mobile No', value: data.mobileNumber },
    { label: 'Personal Email', value: data.personalEmail },
    { label: 'Mother Name', value: data.mothersFullName },
    { label: 'Marital Status', value: data.maritalStatus },
    { label: 'Dependents', value: data.numberOfDependents },
    { label: 'UAE Resident', value: `Since ${data.residentOfUaeSince || 'N/A'}` },
  ]);

  if (data.hasCoApplicant) {
    drawSection('2. Co-Applicant Particulars', [
      { label: 'Co-App Name', value: `${data.coAppFirstName || ''} ${data.coAppLastName || ''}`.trim() },
      { label: 'Co-App EID', value: data.coAppEmiratesId },
      { label: 'Co-App Passport', value: data.coAppPassportNo },
      { label: 'Co-App Mobile', value: data.coAppMobileNumber },
      { label: 'Co-App Email', value: data.coAppPersonalEmail },
      { label: 'Relationship', value: 'Spouse / Co-Borrower' },
    ]);
  }

  drawSection('3. Employment & Income', [
    { label: 'Employer', value: data.officeCompany },
    { label: 'Office Address', value: `${data.officeBuilding || ''}, ${data.officeArea || ''}, ${data.officeCity || ''}`.trim() },
    { label: 'Office Tel', value: data.officeTelephone },
    { label: 'HR Email', value: data.officeHrEmail },
    { label: 'UAE Employees', value: data.officeEmployeesInUae },
    { label: 'Prev Company', value: data.prevCompany },
  ]);

  drawSection('4. Facility & Property Details', [
    { label: 'Selected Bank', value: data.selectedBank },
    { label: 'Financing Type', value: data.selectedFormType },
    { label: 'Property Project', value: `${data.propertyDeveloper || ''} - ${data.propertyProject || ''}`.trim() },
    { label: 'Location/Area', value: data.propertyArea },
    { label: 'Usage / Market', value: `${data.propertyUsage || ''} (${data.marketType || ''})` },
    { label: 'Residence In UAE', value: `${data.residenceBuilding || ''}, ${data.residenceArea || ''}, ${data.residenceCity || ''}`.trim() },
  ]);

  // Signatures Zone
  currentY = Math.max(currentY, 110);
  page.drawText('APPLICANT SIGNATURE & DECLARATION', {
    x: 35,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText('I/We hereby declare that all information submitted herein is true, complete and accurate.', {
    x: 35,
    y: currentY - 12,
    size: 7.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawRectangle({
    x: 35,
    y: currentY - 55,
    width: 220,
    height: 38,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
    color: rgb(0.98, 0.98, 0.98),
  });
  page.drawText('Primary Applicant Signature / Date', {
    x: 45,
    y: currentY - 50,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  if (data.hasCoApplicant) {
    page.drawRectangle({
      x: width - 255,
      y: currentY - 55,
      width: 220,
      height: 38,
      borderWidth: 1,
      borderColor: rgb(0.7, 0.7, 0.7),
      color: rgb(0.98, 0.98, 0.98),
    });
    page.drawText('Co-Applicant Signature / Date', {
      x: width - 245,
      y: currentY - 50,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Footer
  page.drawText('Generated via Home Finance Mortgage Consultancy LLC • Automated Bank Submission Engine', {
    x: 35,
    y: 20,
    size: 7.5,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Populate a form using its stored template buffer or fallback
async function populateFormPdf(form: BankFormRecord, data: any): Promise<PDFDocument> {
  const templateBuffer = getTemplateBuffer(form.id);

  if (!templateBuffer) {
    // Generate clean structured fallback PDF
    const fallbackBuffer = await generateFallbackPdf(form, data);
    return await PDFDocument.load(fallbackBuffer);
  }

  const pdfDoc = await PDFDocument.load(templateBuffer);
  const pdfForm = pdfDoc.getForm();

  // 1. Fill interactive form fields if mapped
  if (form.fieldMappings) {
    for (const [pdfField, stdKey] of Object.entries(form.fieldMappings)) {
      if (stdKey && data[stdKey] !== undefined && data[stdKey] !== '') {
        try {
          const field = pdfForm.getField(pdfField);
          if (!field) continue;

          const val = String(data[stdKey]);
          if (field instanceof PDFTextField) {
            field.setText(val);
          } else if (field instanceof PDFCheckBox) {
            if (val.toLowerCase() === 'true' || val.toLowerCase() === 'yes') {
              field.check();
            }
          } else if (field instanceof PDFDropdown) {
            field.select(val);
          } else if (field instanceof PDFRadioGroup) {
            field.select(val);
          }
        } catch {
          // Ignore read-only or type errors
        }
      }
    }
  }

  // 2. Draw text at coordinate zones
  if (form.visualMappings && form.visualMappings.length > 0) {
    const pages = pdfDoc.getPages();
    for (const vmap of form.visualMappings) {
      if (data[vmap.key] !== undefined && data[vmap.key] !== '') {
        const page = pages[vmap.page];
        if (!page) continue;

        const { width, height } = page.getSize();
        // Coordinates are percentage from top-left, pdf-lib origin is bottom-left
        const x = (vmap.x / 100) * width;
        const y = height - ((vmap.y / 100) * height);

        page.drawText(String(data[vmap.key]), {
          x,
          y: y - 8,
          size: 9.5,
        });
      }
    }
  }

  return pdfDoc;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', formsCount: formsCache.length });
  });

  // AI-powered KYC Parser
  app.post('/api/parse-kyc', upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No document uploaded' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const fileData = {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          fileData,
          "Extract the following details from this ID document and output ONLY JSON. No markdown formatting or extra text. Ensure keys exactly match: \n- firstName (string)\n- middleName (string, optional)\n- lastName (string)\n- dob (string, YYYY-MM-DD)\n- nationality (string)\n- gender (string, 'Male' or 'Female')\n- emiratesId (string, if present)\n- emiratesIdExpiry (string, YYYY-MM-DD, if present)\n- passportNo (string, if present)\n- passportExpiry (string, YYYY-MM-DD, if present)"
        ]
      });

      let responseText = response.text || '';
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (error: any) {
      console.error('Error parsing KYC:', error);
      res.status(500).json({ error: error.message || 'Failed to parse document' });
    }
  });

  // AI Auto-map fields
  app.post('/api/auto-map-fields', async (req, res) => {
    try {
      const { pdfFields, standardFields } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert system that maps PDF form field names from UAE bank mortgage applications to standard internal form field keys.
Given a list of PDF field names and standard field keys, produce a JSON object where the keys are the PDF field names and the values are the matching standard field key. If a PDF field does not clearly match any standard field, map it to empty string "".

Standard Fields:
${JSON.stringify(standardFields, null, 2)}

PDF Fields:
${JSON.stringify(pdfFields, null, 2)}

Respond with ONLY a raw valid JSON object mapping PDF field names to standard field keys. Do NOT enclose in markdown backticks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [prompt],
      });

      let responseText = response.text || '';
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const mapping = JSON.parse(responseText);

      res.json({ mapping });
    } catch (error: any) {
      console.error('Auto-map error:', error);
      res.status(500).json({ error: error.message || 'Failed to auto-map' });
    }
  });

  // ==========================================
  // BANK ENTITY CRUD API
  // ==========================================

  // 1. GET /api/banks - List all registered lending institutions
  app.get('/api/banks', (req, res) => {
    const banksWithCounts = banksCache.map(b => {
      const formsCount = formsCache.filter(f => f.bank.toUpperCase() === b.code.toUpperCase()).length;
      return {
        ...b,
        formsCount
      };
    });

    res.json({ banks: banksWithCounts });
  });

  // 2. GET /api/banks/:code - Get single bank details
  app.get('/api/banks/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const bank = banksCache.find(b => b.code.toUpperCase() === code);
    if (!bank) return res.status(404).json({ error: `Bank ${code} not found` });

    const formsCount = formsCache.filter(f => f.bank.toUpperCase() === code).length;
    res.json({ ...bank, formsCount });
  });

  // 3. POST /api/banks - Create a new bank
  app.post('/api/banks', (req, res) => {
    try {
      const { code, name, shortName, type, website, supportPhone, seedStandardForms } = req.body;

      if (!code || !name) {
        return res.status(400).json({ error: 'Bank Code and Bank Full Name are required' });
      }

      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const cleanName = name.trim();

      if (!cleanCode) {
        return res.status(400).json({ error: 'Invalid bank code format' });
      }

      // Check duplicate code
      const existing = banksCache.find(b => b.code.toUpperCase() === cleanCode);
      if (existing) {
        return res.status(400).json({ error: `A bank with code "${cleanCode}" already exists (${existing.name})` });
      }

      const newBank: BankRecord = {
        code: cleanCode,
        name: cleanName,
        shortName: shortName?.trim() || cleanCode,
        type: type || 'Both',
        website: website?.trim() || '',
        supportPhone: supportPhone?.trim() || '',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      banksCache.push(newBank);
      saveBanksToDisk(banksCache);

      // Optionally auto-generate standard UAE application forms
      let createdFormsCount = 0;
      if (seedStandardForms !== false) {
        const standardForms = createStandardFormsForBank(cleanCode, cleanName);
        formsCache.push(...standardForms);
        saveFormsToDisk(formsCache);
        createdFormsCount = standardForms.length;
      }

      res.status(201).json({
        success: true,
        bank: {
          ...newBank,
          formsCount: createdFormsCount
        },
        formsCreated: createdFormsCount,
        message: `Successfully created bank "${cleanName}" (${cleanCode}) with ${createdFormsCount} standard forms ready.`
      });
    } catch (err: any) {
      console.error('Create bank error:', err);
      res.status(500).json({ error: err.message || 'Failed to create bank' });
    }
  });

  // 4. PUT /api/banks/:code - Update bank information
  app.put('/api/banks/:code', (req, res) => {
    try {
      const oldCode = req.params.code.toUpperCase();
      const bankIndex = banksCache.findIndex(b => b.code.toUpperCase() === oldCode);

      if (bankIndex === -1) {
        return res.status(404).json({ error: `Bank ${oldCode} not found` });
      }

      const { name, shortName, type, website, supportPhone, newCode } = req.body;

      let targetCode = oldCode;
      if (newCode && newCode.trim().toUpperCase() !== oldCode) {
        const cleanNewCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        const duplicate = banksCache.find((b, idx) => idx !== bankIndex && b.code.toUpperCase() === cleanNewCode);
        if (duplicate) {
          return res.status(400).json({ error: `Bank code "${cleanNewCode}" is already taken by ${duplicate.name}` });
        }
        targetCode = cleanNewCode;

        // Cascade update bank code in all forms associated with oldCode
        formsCache = formsCache.map(f => {
          if (f.bank.toUpperCase() === oldCode) {
            return {
              ...f,
              bank: targetCode,
              updatedAt: new Date().toISOString()
            };
          }
          return f;
        });
        saveFormsToDisk(formsCache);
      }

      const current = banksCache[bankIndex];
      const updatedBank: BankRecord = {
        ...current,
        code: targetCode,
        name: name !== undefined ? name.trim() : current.name,
        shortName: shortName !== undefined ? shortName.trim() : current.shortName,
        type: type !== undefined ? type : current.type,
        website: website !== undefined ? website.trim() : current.website,
        supportPhone: supportPhone !== undefined ? supportPhone.trim() : current.supportPhone,
        updatedAt: new Date().toISOString()
      };

      banksCache[bankIndex] = updatedBank;
      saveBanksToDisk(banksCache);

      const formsCount = formsCache.filter(f => f.bank.toUpperCase() === targetCode).length;

      res.json({
        success: true,
        bank: {
          ...updatedBank,
          formsCount
        },
        message: `Updated bank "${updatedBank.name}" successfully.`
      });
    } catch (err: any) {
      console.error('Update bank error:', err);
      res.status(500).json({ error: err.message || 'Failed to update bank' });
    }
  });

  // 5. DELETE /api/banks/:code - Delete bank and associated forms
  app.delete('/api/banks/:code', (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const bankIndex = banksCache.findIndex(b => b.code.toUpperCase() === code);

      if (bankIndex === -1) {
        return res.status(404).json({ error: `Bank ${code} not found` });
      }

      const deletedBank = banksCache[bankIndex];

      // Remove from banks cache
      banksCache.splice(bankIndex, 1);
      saveBanksToDisk(banksCache);

      // Remove associated forms and their templates
      const formsToDelete = formsCache.filter(f => f.bank.toUpperCase() === code);
      formsToDelete.forEach(f => {
        deleteTemplateBuffer(f.id);
      });

      formsCache = formsCache.filter(f => f.bank.toUpperCase() !== code);
      saveFormsToDisk(formsCache);

      res.json({
        success: true,
        message: `Successfully deleted bank "${deletedBank.name}" (${code}) and ${formsToDelete.length} associated forms.`
      });
    } catch (err: any) {
      console.error('Delete bank error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete bank' });
    }
  });

  // ==========================================
  // FORM TEMPLATES CRUD API
  // ==========================================

  // 1. GET /api/form-templates - List all templates with optional category/search filters
  app.get('/api/form-templates', (req, res) => {
    try {
      const { category, search } = req.query as { category?: string; search?: string };
      let list = [...formTemplatesCache];

      if (category && category !== 'All') {
        list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(t =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
        );
      }

      res.json({ templates: list });
    } catch (err: any) {
      console.error('List templates error:', err);
      res.status(500).json({ error: err.message || 'Failed to list templates' });
    }
  });

  // 2. GET /api/form-templates/:id - Get single template
  app.get('/api/form-templates/:id', (req, res) => {
    const template = formTemplatesCache.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: `Template with ID "${req.params.id}" not found` });
    }
    res.json({ template });
  });

  // 3. POST /api/form-templates - Save current form snapshot as new template
  app.post('/api/form-templates', (req, res) => {
    try {
      const { name, description, category, tags, data } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Form data payload is required' });
      }

      const id = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanName = name.trim();
      const cleanCategory = category || 'Custom';
      const cleanTags = Array.isArray(tags)
        ? tags.map(t => String(t).trim()).filter(Boolean)
        : typeof tags === 'string'
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

      const newTemplate: FormTemplateRecord = {
        id,
        name: cleanName,
        description: description ? description.trim() : '',
        category: cleanCategory,
        tags: cleanTags,
        isBuiltIn: false,
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      formTemplatesCache.unshift(newTemplate);
      saveFormTemplatesToDisk(formTemplatesCache);

      res.status(201).json({
        success: true,
        template: newTemplate,
        message: `Template "${cleanName}" saved successfully.`,
      });
    } catch (err: any) {
      console.error('Create template error:', err);
      res.status(500).json({ error: err.message || 'Failed to create template' });
    }
  });

  // 4. PUT /api/form-templates/:id - Update existing template metadata or snapshot data
  app.put('/api/form-templates/:id', (req, res) => {
    try {
      const targetId = req.params.id;
      const index = formTemplatesCache.findIndex(t => t.id === targetId);

      if (index === -1) {
        return res.status(404).json({ error: `Template "${targetId}" not found` });
      }

      const { name, description, category, tags, data } = req.body;
      const current = formTemplatesCache[index];

      const cleanTags = tags !== undefined
        ? Array.isArray(tags)
          ? tags.map(t => String(t).trim()).filter(Boolean)
          : typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : current.tags
        : current.tags;

      const updatedTemplate: FormTemplateRecord = {
        ...current,
        name: name !== undefined ? name.trim() : current.name,
        description: description !== undefined ? description.trim() : current.description,
        category: category !== undefined ? category : current.category,
        tags: cleanTags,
        data: data !== undefined && typeof data === 'object' ? data : current.data,
        updatedAt: new Date().toISOString(),
      };

      formTemplatesCache[index] = updatedTemplate;
      saveFormTemplatesToDisk(formTemplatesCache);

      res.json({
        success: true,
        template: updatedTemplate,
        message: `Template "${updatedTemplate.name}" updated successfully.`,
      });
    } catch (err: any) {
      console.error('Update template error:', err);
      res.status(500).json({ error: err.message || 'Failed to update template' });
    }
  });

  // 5. DELETE /api/form-templates/:id - Delete a template
  app.delete('/api/form-templates/:id', (req, res) => {
    try {
      const targetId = req.params.id;
      const index = formTemplatesCache.findIndex(t => t.id === targetId);

      if (index === -1) {
        return res.status(404).json({ error: `Template "${targetId}" not found` });
      }

      const deleted = formTemplatesCache[index];
      formTemplatesCache.splice(index, 1);
      saveFormTemplatesToDisk(formTemplatesCache);

      res.json({
        success: true,
        message: `Template "${deleted.name}" deleted successfully.`,
      });
    } catch (err: any) {
      console.error('Delete template error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete template' });
    }
  });

  // 6. POST /api/form-templates/reset-defaults - Restore factory seed templates
  app.post('/api/form-templates/reset-defaults', (req, res) => {
    try {
      // Keep any user created custom templates or reset completely
      const { preserveCustom } = req.body;
      let newTemplates: FormTemplateRecord[];

      if (preserveCustom) {
        const customOnly = formTemplatesCache.filter(t => !t.isBuiltIn);
        newTemplates = [...DEFAULT_SEED_TEMPLATES, ...customOnly];
      } else {
        newTemplates = [...DEFAULT_SEED_TEMPLATES];
      }

      formTemplatesCache = newTemplates;
      saveFormTemplatesToDisk(formTemplatesCache);

      res.json({
        success: true,
        templates: formTemplatesCache,
        message: 'Successfully reset default form templates.',
      });
    } catch (err: any) {
      console.error('Reset default templates error:', err);
      res.status(500).json({ error: err.message || 'Failed to reset templates' });
    }
  });

  // 7. POST /api/form-templates/import - Import templates batch
  app.post('/api/form-templates/import', (req, res) => {
    try {
      const { templates } = req.body;
      if (!Array.isArray(templates) || templates.length === 0) {
        return res.status(400).json({ error: 'Valid array of templates is required' });
      }

      let importedCount = 0;
      for (const t of templates) {
        if (t.name && t.data) {
          const id = t.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          // Replace if exists, or push
          const existingIdx = formTemplatesCache.findIndex(item => item.id === id);
          const record: FormTemplateRecord = {
            id,
            name: String(t.name).trim(),
            description: t.description ? String(t.description).trim() : '',
            category: t.category || 'Custom',
            tags: Array.isArray(t.tags) ? t.tags : [],
            isBuiltIn: Boolean(t.isBuiltIn),
            data: t.data,
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingIdx !== -1) {
            formTemplatesCache[existingIdx] = record;
          } else {
            formTemplatesCache.push(record);
          }
          importedCount++;
        }
      }

      saveFormTemplatesToDisk(formTemplatesCache);

      res.json({
        success: true,
        importedCount,
        templates: formTemplatesCache,
        message: `Successfully imported ${importedCount} templates.`,
      });
    } catch (err: any) {
      console.error('Import templates error:', err);
      res.status(500).json({ error: err.message || 'Failed to import templates' });
    }
  });

  // ==========================================
  // BANK FORMS CRUD API
  // ==========================================

  // 1. GET /api/forms - List forms for a bank and formType
  app.get('/api/forms', (req, res) => {
    const { bank, formType } = req.query as { bank?: string; formType?: string };
    let filtered = [...formsCache];

    if (bank) {
      filtered = filtered.filter(f => f.bank.toUpperCase() === bank.toUpperCase());
    }
    if (formType) {
      filtered = filtered.filter(f => f.formType === formType || f.formType === 'All');
    }

    // Include file status
    const withFileInfo = filtered.map(f => ({
      ...f,
      hasFile: fs.existsSync(path.join(TEMPLATES_DIR, `${f.id}.pdf`))
    }));

    res.json({ forms: withFileInfo });
  });

  // 2. GET /api/forms/:id - Get single form record
  app.get('/api/forms/:id', (req, res) => {
    const form = formsCache.find(f => f.id === req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    res.json({
      ...form,
      hasFile: fs.existsSync(path.join(TEMPLATES_DIR, `${form.id}.pdf`))
    });
  });

  // 3. POST /api/forms - Create a new form (with optional blank PDF upload)
  app.post('/api/forms', upload.single('template'), async (req, res) => {
    try {
      const { bank, formType, name, category, description, visualMappings, fieldMappings } = req.body;
      
      if (!bank || !name) {
        return res.status(400).json({ error: 'Bank and Form Name are required' });
      }

      const id = `${bank.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let pageCount = 1;
      let hasFile = false;
      let fileName = '';

      if (req.file) {
        saveTemplateBuffer(id, req.file.buffer);
        try {
          const loaded = await PDFDocument.load(req.file.buffer);
          pageCount = loaded.getPageCount();
        } catch {}
        hasFile = true;
        fileName = req.file.originalname;
      }

      const newForm: BankFormRecord = {
        id,
        bank,
        formType: formType || 'All',
        name,
        category: category || 'Application',
        description: description || '',
        hasFile,
        fileName,
        pageCount,
        visualMappings: visualMappings ? JSON.parse(visualMappings) : [],
        fieldMappings: fieldMappings ? JSON.parse(fieldMappings) : {},
        updatedAt: new Date().toISOString()
      };

      formsCache.push(newForm);
      saveFormsToDisk(formsCache);

      res.status(201).json({ success: true, form: newForm });
    } catch (err: any) {
      console.error('Create form error:', err);
      res.status(500).json({ error: err.message || 'Failed to create form' });
    }
  });

  // 4. PUT /api/forms/:id - Update form metadata and mappings
  app.put('/api/forms/:id', (req, res) => {
    try {
      const index = formsCache.findIndex(f => f.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Form not found' });

      const existing = formsCache[index];
      const updates = req.body;

      const updated: BankFormRecord = {
        ...existing,
        name: updates.name !== undefined ? updates.name : existing.name,
        category: updates.category !== undefined ? updates.category : existing.category,
        description: updates.description !== undefined ? updates.description : existing.description,
        formType: updates.formType !== undefined ? updates.formType : existing.formType,
        visualMappings: updates.visualMappings !== undefined ? updates.visualMappings : existing.visualMappings,
        fieldMappings: updates.fieldMappings !== undefined ? updates.fieldMappings : existing.fieldMappings,
        updatedAt: new Date().toISOString()
      };

      formsCache[index] = updated;
      saveFormsToDisk(formsCache);

      res.json({ success: true, form: updated });
    } catch (err: any) {
      console.error('Update form error:', err);
      res.status(500).json({ error: err.message || 'Failed to update form' });
    }
  });

  // 5. POST /api/forms/:id/upload - Upload or replace blank PDF template for this form
  app.post('/api/forms/:id/upload', upload.single('template'), async (req, res) => {
    try {
      const index = formsCache.findIndex(f => f.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Form not found' });
      if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

      saveTemplateBuffer(req.params.id, req.file.buffer);

      let pageCount = 1;
      try {
        const loaded = await PDFDocument.load(req.file.buffer);
        pageCount = loaded.getPageCount();
      } catch {}

      formsCache[index].hasFile = true;
      formsCache[index].fileName = req.file.originalname;
      formsCache[index].pageCount = pageCount;
      formsCache[index].updatedAt = new Date().toISOString();

      saveFormsToDisk(formsCache);

      res.json({
        success: true,
        form: formsCache[index]
      });
    } catch (err: any) {
      console.error('Upload template error:', err);
      res.status(500).json({ error: err.message || 'Failed to upload PDF template' });
    }
  });

  // 6. DELETE /api/forms/:id - Delete a form
  app.delete('/api/forms/:id', (req, res) => {
    try {
      const index = formsCache.findIndex(f => f.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Form not found' });

      const deleted = formsCache[index];
      deleteTemplateBuffer(deleted.id);

      formsCache.splice(index, 1);
      saveFormsToDisk(formsCache);

      res.json({ success: true, deletedId: deleted.id });
    } catch (err: any) {
      console.error('Delete form error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete form' });
    }
  });

  // 7. GET /api/forms/:id/file - Stream stored blank PDF file to render on canvas
  app.get('/api/forms/:id/file', (req, res) => {
    const buffer = getTemplateBuffer(req.params.id);
    if (!buffer) {
      return res.status(404).send('Template file not found for this form');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.id}.pdf"`);
    res.send(buffer);
  });

  // ==========================================
  // SMART FORM GENERATION & PACKAGE MERGING
  // ==========================================

  // Generate a single filled form
  app.post('/api/generate-form/:id', async (req, res) => {
    try {
      const data = req.body;
      const form = formsCache.find(f => f.id === req.params.id);
      if (!form) return res.status(404).json({ error: 'Form not found' });

      const populatedDoc = await populateFormPdf(form, data);
      const pdfBytes = await populatedDoc.save();

      const sanitizedName = form.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${data.selectedBank}_${sanitizedName}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (err: any) {
      console.error('Generate form error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate form' });
    }
  });

  // Generate and merge multiple selected forms into a complete bank package
  app.post('/api/generate-package', async (req, res) => {
    try {
      const { selectedFormIds, ...data } = req.body;
      if (!selectedFormIds || !Array.isArray(selectedFormIds) || selectedFormIds.length === 0) {
        return res.status(400).json({ error: 'No forms selected for generation' });
      }

      const formsToGenerate = formsCache.filter(f => selectedFormIds.includes(f.id));
      if (formsToGenerate.length === 0) {
        return res.status(404).json({ error: 'Selected forms could not be found' });
      }

      const mergedPdf = await PDFDocument.create();

      for (const form of formsToGenerate) {
        const individualDoc = await populateFormPdf(form, data);
        const copiedPages = await mergedPdf.copyPages(individualDoc, individualDoc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.save();
      const applicantName = `${data.firstName || 'Applicant'}_${data.lastName || ''}`.trim().replace(/\s+/g, '_');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${data.selectedBank || 'Bank'}_${applicantName}_Full_Submission_Package.pdf"`
      );
      res.send(Buffer.from(mergedBytes));
    } catch (err: any) {
      console.error('Generate package error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate package' });
    }
  });

  // Legacy backwards-compatible endpoints
  app.get('/api/check-template', (req, res) => {
    const { bank, formType } = req.query as { bank?: string; formType?: string };
    const matching = formsCache.filter(f => 
      (!bank || f.bank.toUpperCase() === bank.toUpperCase()) &&
      (!formType || f.formType === formType || f.formType === 'All')
    );
    res.json({ exists: matching.length > 0 });
  });

  app.post('/api/generate-pdf', async (req, res) => {
    try {
      const data = req.body;
      const matching = formsCache.filter(f => 
        f.bank.toUpperCase() === data.selectedBank.toUpperCase() &&
        (f.formType === data.selectedFormType || f.formType === 'All')
      );

      if (matching.length === 0) {
        // Fallback default form
        const fallbackBuffer = await generateFallbackPdf(
          {
            id: 'generic_fallback',
            bank: data.selectedBank,
            formType: data.selectedFormType,
            name: `${data.selectedBank} Mortgage Application`,
            category: 'Application',
            hasFile: false,
            visualMappings: [],
            updatedAt: new Date().toISOString()
          },
          data
        );
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${data.selectedBank}_Application.pdf"`);
        return res.send(fallbackBuffer);
      }

      // Generate the primary application or merged package of all matching forms
      const primary = matching.find(f => f.category === 'Application') || matching[0];
      const populated = await populateFormPdf(primary, data);
      const pdfBytes = await populated.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${data.selectedBank}_${primary.name}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (err: any) {
      console.error('Legacy generate-pdf error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate PDF' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
