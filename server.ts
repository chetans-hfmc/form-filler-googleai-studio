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

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
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

// Initialize cache
banksCache = loadBanksFromDisk();
formsCache = loadFormsFromDisk();

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
