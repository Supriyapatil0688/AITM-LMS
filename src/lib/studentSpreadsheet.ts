import * as XLSX from 'xlsx';
import type { EnrolledStudent } from '../types';

export type StudentFieldKey =
  | 'location'
  | 'employeeCode'
  | 'studentName'
  | 'motherName'
  | 'fatherName'
  | 'dateOfBirth'
  | 'email'
  | 'mobileNumber'
  | 'gender'
  | 'aadhaarNumber'
  | 'permanentAddress'
  | 'panNumber'
  | 'status'
  | 'remarks'
  | 'registrationDate'
  | 'assignedStaffName'
  | 'abcId';

export interface StudentFieldDefinition {
  key: StudentFieldKey;
  label: string;
  required?: boolean;
  synonyms: string[];
}

export const STUDENT_FIELD_DEFINITIONS: StudentFieldDefinition[] = [
  { key: 'location', label: 'Location', synonyms: ['location', 'branch', 'center', 'centre', 'city'] },
  { key: 'employeeCode', label: 'Employee Code', required: true, synonyms: ['employee code', 'emp code', 'empcode', 'employee id', 'emp id', 'code', 'student code'] },
  { key: 'studentName', label: 'Student Name', required: true, synonyms: ['student name', 'full name', 'name', 'candidate name', 'trainee name'] },
  { key: 'motherName', label: "Mother's Name", synonyms: ["mother's name", 'mother name', 'mothers name', 'mother'] },
  { key: 'fatherName', label: "Father's Name", synonyms: ["father's name", 'father name', 'fathers name', 'father'] },
  { key: 'dateOfBirth', label: 'Date of Birth', synonyms: ['date of birth', 'dob', 'birth date', 'birthdate'] },
  { key: 'email', label: 'Email ID', synonyms: ['email id', 'email', 'email address', 'e-mail', 'mail id'] },
  { key: 'mobileNumber', label: 'Mobile Number', synonyms: ['mobile number', 'mobile no', 'mobile', 'phone', 'phone number', 'contact number', 'contact'] },
  { key: 'gender', label: 'Gender', synonyms: ['gender', 'sex'] },
  { key: 'aadhaarNumber', label: 'Aadhaar ID Number', synonyms: ['aadhaar id number', 'aadhaar number', 'aadhaar no', 'aadhaar', 'aadhar id number', 'aadhar number', 'aadhar no', 'aadhar', 'uid'] },
  { key: 'permanentAddress', label: 'Permanent Address', synonyms: ['permanent address', 'address', 'residential address', 'full address'] },
  { key: 'panNumber', label: 'PAN ID Number', synonyms: ['pan id number', 'pan number', 'pan no', 'pan id', 'pan card', 'pan'] },
  { key: 'status', label: 'Active / Inactive Status', synonyms: ['active / inactive status', 'active/inactive status', 'status', 'active status', 'state'] },
  { key: 'remarks', label: 'Remarks', synonyms: ['remarks', 'remark', 'notes', 'note', 'comments'] },
  { key: 'registrationDate', label: 'Registration Date', synonyms: ['registration date', 'reg date', 'reg. date', 'date of registration', 'joining date', 'enrollment date'] },
  { key: 'assignedStaffName', label: 'Assigned Staff Name', synonyms: ['assigned staff name', 'staff name', 'assigned staff', 'coordinator', 'counselor', 'counsellor'] },
  { key: 'abcId', label: 'ABC ID', synonyms: ['abc id', 'abcid', 'abc number', 'apaar id', 'apaar'] },
];

export interface ParsedSpreadsheet {
  fileName: string;
  headers: string[];
  rows: Array<Record<string, string>>;
}

export type MappedStudentDraft = Record<StudentFieldKey, string>;

export interface ValidatedImportRow {
  rowNumber: number;
  data: MappedStudentDraft;
  status: 'valid' | 'duplicate' | 'invalid';
  reason?: string;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeDateString(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += year >= 50 ? 1900 : 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }
  return s;
}

function isLikelyDateHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('date') || h.includes('dob') || h.includes('birth');
}

function extractCellString(cell: XLSX.CellObject | undefined, headerName: string): string {
  if (!cell) return '';

  // Date object cell
  if (cell.t === 'd' && cell.v instanceof Date && !Number.isNaN(cell.v.getTime())) {
    const d = cell.v;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  // Numeric cell: preserve full integers without scientific notation (Aadhaar / Mobile / ABC ID)
  if (cell.t === 'n' && typeof cell.v === 'number') {
    const numFmt = String(cell.z || '');
    const looksLikeDateFmt =
      isLikelyDateHeader(headerName) ||
      (/[dmy]/i.test(numFmt) && !/[@0#]/.test(numFmt) && cell.v > 20000 && cell.v < 80000);

    if (looksLikeDateFmt && XLSX.SSF && typeof XLSX.SSF.parse_date_code === 'function') {
      const parsed = XLSX.SSF.parse_date_code(cell.v);
      if (parsed && parsed.y >= 1900 && parsed.y <= 2100 && parsed.m >= 1 && parsed.m <= 12 && parsed.d >= 1 && parsed.d <= 31) {
        return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
      }
    }

    if (Number.isInteger(cell.v)) {
      return cell.v.toFixed(0);
    }
    if (cell.w && !/[eE][+-]?\d+/.test(cell.w)) {
      return cell.w.trim();
    }
    return String(cell.v);
  }

  // String or boolean cell
  const text = cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : String(cell.w ?? '').trim();
  if (isLikelyDateHeader(headerName)) {
    return normalizeDateString(text);
  }
  return text;
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Spreadsheet file size exceeds the 5 MB limit.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded workbook contains no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet || !sheet['!ref']) {
    throw new Error('The selected worksheet is empty.');
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  if (range.e.r - range.s.r > 5000) {
    throw new Error('Spreadsheet exceeds the maximum 5,000 rows per upload.');
  }

  const headers: string[] = [];
  const usedHeaders = new Set<string>();

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const cell = sheet[addr] as XLSX.CellObject | undefined;
    let rawHeader = cell ? String(cell.w ?? cell.v ?? '').trim() : '';
    if (!rawHeader) rawHeader = `Column ${c + 1}`;
    if (FORBIDDEN_KEYS.has(rawHeader.toLowerCase())) {
      rawHeader = `col_${c + 1}`;
    }
    let uniqueHeader = rawHeader;
    let suffix = 2;
    while (usedHeaders.has(uniqueHeader)) {
      uniqueHeader = `${rawHeader} (${suffix++})`;
    }
    usedHeaders.add(uniqueHeader);
    headers.push(uniqueHeader);
  }

  const rows: Array<Record<string, string>> = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const rowObj: Record<string, string> = {};
    let hasValue = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const headerName = headers[c - range.s.c];
      if (!headerName || FORBIDDEN_KEYS.has(headerName)) continue;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr] as XLSX.CellObject | undefined;
      const val = extractCellString(cell, headerName);
      if (val !== '') hasValue = true;
      rowObj[headerName] = val;
    }
    if (hasValue) {
      rows.push(rowObj);
    }
  }

  if (rows.length === 0) {
    throw new Error('No data rows found beneath the header row.');
  }

  return { fileName: file.name, headers, rows };
}

export function autoMatchColumns(headers: string[]): Record<StudentFieldKey, string> {
  const mapping = {} as Record<StudentFieldKey, string>;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));

  for (const field of STUDENT_FIELD_DEFINITIONS) {
    let matched = '';
    for (const syn of field.synonyms) {
      const synNorm = normalize(syn);
      const exact = normalizedHeaders.find((h) => h.norm === synNorm);
      if (exact) {
        matched = exact.raw;
        break;
      }
    }
    if (!matched) {
      for (const syn of field.synonyms) {
        const synNorm = normalize(syn);
        const partial = normalizedHeaders.find((h) => h.norm.includes(synNorm) || synNorm.includes(h.norm));
        if (partial && partial.norm.length >= 3) {
          matched = partial.raw;
          break;
        }
      }
    }
    mapping[field.key] = matched;
  }
  return mapping;
}

export function validateMappedImportRows(
  rawRows: Array<Record<string, string>>,
  mapping: Record<StudentFieldKey, string>,
  existingStudents: EnrolledStudent[]
): ValidatedImportRow[] {
  const seenCodes = new Set(existingStudents.map((s) => s.employeeCode.trim().toLowerCase()));

  return rawRows.map((rawRow, idx) => {
    const rowNumber = idx + 1;
    const draft = {} as MappedStudentDraft;
    for (const field of STUDENT_FIELD_DEFINITIONS) {
      const sourceCol = mapping[field.key];
      const rawVal = sourceCol && !FORBIDDEN_KEYS.has(sourceCol) ? String(rawRow[sourceCol] ?? '').trim() : '';
      draft[field.key] = rawVal;
    }

    if (draft.dateOfBirth) draft.dateOfBirth = normalizeDateString(draft.dateOfBirth);
    if (draft.registrationDate) draft.registrationDate = normalizeDateString(draft.registrationDate);
    if (draft.panNumber) draft.panNumber = draft.panNumber.toUpperCase();
    if (draft.email) draft.email = draft.email.toLowerCase();

    const codeKey = draft.employeeCode.trim().toLowerCase();
    if (!draft.employeeCode) {
      return { rowNumber, data: draft, status: 'invalid', reason: 'Missing Employee Code' };
    }
    if (!draft.studentName) {
      return { rowNumber, data: draft, status: 'invalid', reason: 'Missing Student Name' };
    }
    if (seenCodes.has(codeKey)) {
      return {
        rowNumber,
        data: draft,
        status: 'duplicate',
        reason: `Duplicate Employee Code "${draft.employeeCode}"`,
      };
    }

    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      return { rowNumber, data: draft, status: 'invalid', reason: `Invalid Email "${draft.email}"` };
    }

    if (draft.mobileNumber) {
      if (/[eE][+-]?\d+/.test(draft.mobileNumber)) {
        return { rowNumber, data: draft, status: 'invalid', reason: 'Mobile Number has scientific notation' };
      }
      const digits = draft.mobileNumber.replace(/[\s+\-()]/g, '');
      if (!/^\d{10,15}$/.test(digits)) {
        return { rowNumber, data: draft, status: 'invalid', reason: 'Mobile Number must be 10–15 digits' };
      }
    }

    if (draft.aadhaarNumber) {
      if (/[eE][+-]?\d+/.test(draft.aadhaarNumber)) {
        return { rowNumber, data: draft, status: 'invalid', reason: 'Aadhaar has scientific notation' };
      }
      const aadhaarDigits = draft.aadhaarNumber.replace(/[\s-]/g, '');
      if (!/^\d{12}$/.test(aadhaarDigits)) {
        return { rowNumber, data: draft, status: 'invalid', reason: 'Aadhaar ID must be 12 digits' };
      }
      draft.aadhaarNumber = aadhaarDigits;
    }

    if (draft.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(draft.panNumber)) {
      return { rowNumber, data: draft, status: 'invalid', reason: 'Invalid PAN format (e.g. ABCDE1234F)' };
    }

    if (draft.abcId && /[eE][+-]?\d+/.test(draft.abcId)) {
      return { rowNumber, data: draft, status: 'invalid', reason: 'ABC ID has scientific notation' };
    }

    const g = draft.gender.toLowerCase();
    if (g === 'male' || g === 'm') draft.gender = 'Male';
    else if (g === 'female' || g === 'f') draft.gender = 'Female';
    else if (g === 'other' || g === 'o' || g === 'transgender') draft.gender = 'Other';
    else if (g !== '') {
      return { rowNumber, data: draft, status: 'invalid', reason: `Invalid Gender "${draft.gender}"` };
    }

    const st = draft.status.toLowerCase();
    if (st === '' || st === 'active' || st === '1' || st === 'yes' || st === 'enrolled') {
      draft.status = 'Active';
    } else if (st === 'inactive' || st === '0' || st === 'no' || st === 'disabled') {
      draft.status = 'Inactive';
    } else {
      return { rowNumber, data: draft, status: 'invalid', reason: `Invalid Status "${draft.status}"` };
    }

    seenCodes.add(codeKey);
    return { rowNumber, data: draft, status: 'valid' };
  });
}

function buildTextWorkbook(headers: string[], rows: string[][], sheetName: string): XLSX.WorkBook {
  const wsData: XLSX.CellObject[][] = [];
  wsData.push(headers.map((h) => ({ t: 's', v: h })));
  for (const row of rows) {
    wsData.push(row.map((val) => ({ t: 's', v: String(val ?? ''), z: '@' })));
  }

  const ws: XLSX.WorkSheet = {};
  const range = { s: { c: 0, r: 0 }, e: { c: Math.max(0, headers.length - 1), r: Math.max(0, wsData.length - 1) } };
  for (let r = 0; r < wsData.length; r++) {
    for (let c = 0; c < wsData[r].length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = wsData[r][c];
    }
  }
  ws['!ref'] = XLSX.utils.encode_range(range);
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(18, h.length + 4) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

export function exportStudentsToExcel(students: EnrolledStudent[], filename = 'AITM_Enrolled_Students.xlsx'): void {
  const headers = STUDENT_FIELD_DEFINITIONS.map((f) => f.label);
  const rows = students.map((s) => STUDENT_FIELD_DEFINITIONS.map((f) => String(s[f.key] ?? '')));
  const wb = buildTextWorkbook(headers, rows, 'Students');
  XLSX.writeFile(wb, filename);
}

function escapeCsvCell(val: string): string {
  const s = String(val ?? '');
  // Neutralize CSV formula injection if value starts with =, +, -, @
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function exportStudentsToCSV(students: EnrolledStudent[], filename = 'AITM_Enrolled_Students.csv'): void {
  const headers = STUDENT_FIELD_DEFINITIONS.map((f) => escapeCsvCell(f.label));
  const lines = [headers.join(',')];
  for (const s of students) {
    const vals = STUDENT_FIELD_DEFINITIONS.map((f) => escapeCsvCell(String(s[f.key] ?? '')));
    lines.push(vals.join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSampleStudentTemplate(format: 'xlsx' | 'csv'): void {
  const headers = STUDENT_FIELD_DEFINITIONS.map((f) => f.label);
  if (format === 'xlsx') {
    const wb = buildTextWorkbook(headers, [], 'Student_Import_Template');
    XLSX.writeFile(wb, 'AITM_Student_Enrollment_Template.xlsx');
  } else {
    const csvHeader = headers.map(escapeCsvCell).join(',');
    const blob = new Blob(['\uFEFF' + csvHeader + '\r\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AITM_Student_Enrollment_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
