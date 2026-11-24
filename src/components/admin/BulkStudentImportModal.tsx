import React, { useState, useMemo } from 'react';
import type { EnrolledStudent } from '../../types';
import {
  STUDENT_FIELD_DEFINITIONS,
  type StudentFieldKey,
  type ParsedSpreadsheet,
  parseSpreadsheetFile,
  autoMatchColumns,
  validateMappedImportRows,
  downloadSampleStudentTemplate,
} from '../../lib/studentSpreadsheet';
import { api } from '../../lib/api';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface BulkStudentImportModalProps {
  isOpen: boolean;
  existingStudents: EnrolledStudent[];
  onClose: () => void;
  onImportComplete: (importedCount: number, skippedCount: number) => Promise<void>;
}

export const BulkStudentImportModal: React.FC<BulkStudentImportModalProps> = ({
  isOpen,
  existingStudents,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<'upload' | 'map_preview' | 'result'>('upload');
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<StudentFieldKey, string>>(
    {} as Record<StudentFieldKey, string>
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedDuplicates: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
    invalidRows: Array<{ rowNumber: number; employeeCode: string; studentName: string; reason: string }>;
  } | null>(null);

  const validatedRows = useMemo(() => {
    if (!parsed) return [];
    return validateMappedImportRows(parsed.rows, columnMapping, existingStudents);
  }, [parsed, columnMapping, existingStudents]);

  const validCount = useMemo(() => validatedRows.filter((r) => r.status === 'valid').length, [validatedRows]);
  const duplicateCount = useMemo(() => validatedRows.filter((r) => r.status === 'duplicate').length, [validatedRows]);
  const invalidCount = useMemo(() => validatedRows.filter((r) => r.status === 'invalid').length, [validatedRows]);

  if (!isOpen) return null;

  const resetWizard = () => {
    setStep('upload');
    setParsed(null);
    setParseError(null);
    setImportResult(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setParseError(null);
    setIsProcessing(true);
    try {
      const result = await parseSpreadsheetFile(file);
      setParsed(result);
      setColumnMapping(autoMatchColumns(result.headers));
      setStep('map_preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unable to read spreadsheet file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    const validRowsToSend = validatedRows.filter((r) => r.status === 'valid').map((r) => r.data);
    if (validRowsToSend.length === 0) {
      setParseError('No valid non-duplicate rows are ready to import.');
      return;
    }

    setIsProcessing(true);
    setParseError(null);
    try {
      const serverResult = await api.bulkImportEnrolledStudents(validRowsToSend);
      setImportResult({
        importedCount: serverResult.importedCount,
        skippedDuplicates: [
          ...validatedRows
            .filter((r) => r.status === 'duplicate')
            .map((r) => ({
              rowNumber: r.rowNumber,
              employeeCode: r.data.employeeCode,
              studentName: r.data.studentName,
              reason: r.reason || 'Duplicate Employee Code',
            })),
          ...serverResult.skippedDuplicates,
        ],
        invalidRows: [
          ...validatedRows
            .filter((r) => r.status === 'invalid')
            .map((r) => ({
              rowNumber: r.rowNumber,
              employeeCode: r.data.employeeCode,
              studentName: r.data.studentName,
              reason: r.reason || 'Invalid row',
            })),
          ...serverResult.invalidRows,
        ],
      });
      setStep('result');
      await onImportComplete(serverResult.importedCount, duplicateCount + serverResult.skippedDuplicates.length);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Bulk import failed on server.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
              Bulk Import Pipeline · Excel (.xlsx / .xls) & CSV
            </span>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Import Students from Spreadsheet
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">Download Official 17-Column Import Template</h4>
                  <p className="text-slate-600 mt-0.5">
                    Includes all required fields with text-safe formatting so Aadhaar, Mobile &amp; ABC IDs are never converted to scientific notation.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadSampleStudentTemplate('xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-950 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleStudentTemplate('csv')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Template</span>
                  </button>
                </div>
              </div>

              <label className="block border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/20">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => void handleFileSelected(e.target.files?.[0])}
                />
                <Upload className="w-10 h-10 text-blue-900 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900">
                  {isProcessing ? 'Parsing spreadsheet...' : 'Click to upload Excel (.xlsx, .xls) or CSV file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Up to 5,000 rows · Automatic column matching · Duplicate Employee Code protection
                </p>
              </label>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {step === 'map_preview' && parsed && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">{parsed.fileName}</span>
                    <span className="text-[11px] text-slate-500">
                      Detected {parsed.rows.length} data row(s) and {parsed.headers.length} column(s)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetWizard}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Validation Summary Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{validatedRows.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Ready to Import</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{validCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Duplicates Skipped</span>
                  <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">{duplicateCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Invalid Rows</span>
                  <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">{invalidCount}</div>
                </div>
              </div>

              {/* Column Mapping Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Map Spreadsheet Columns to Database Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STUDENT_FIELD_DEFINITIONS.map((field) => (
                    <div key={field.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">-- Not Mapped (Blank) --</option>
                        {parsed.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                  <span>Import Validation Preview (Showing up to first 100 rows)</span>
                  <span className="text-[11px] text-slate-500">
                    Duplicates &amp; invalid rows are automatically excluded
                  </span>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase">
                        <th className="py-2 px-3">Row</th>
                        <th className="py-2 px-3">Validation</th>
                        <th className="py-2 px-3">Employee Code</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Location</th>
                        <th className="py-2 px-3">Mobile</th>
                        <th className="py-2 px-3">Aadhaar (Text)</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validatedRows.slice(0, 100).map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={
                            row.status === 'invalid'
                              ? 'bg-rose-50/70'
                              : row.status === 'duplicate'
                              ? 'bg-amber-50/70'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-slate-500">#{row.rowNumber}</td>
                          <td className="py-2 px-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span
                                title={row.reason}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Duplicate
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span
                                title={row.reason}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {row.reason}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold">{row.data.employeeCode || '—'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.data.studentName || '—'}</td>
                          <td className="py-2 px-3">{row.data.location || '—'}</td>
                          <td className="py-2 px-3 font-mono">{row.data.mobileNumber || '—'}</td>
                          <td className="py-2 px-3 font-mono">{row.data.aadhaarNumber || '—'}</td>
                          <td className="py-2 px-3">{row.data.status || 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && importResult && (
            <div className="space-y-4 py-4">
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-emerald-900">
                    Successfully Imported {importResult.importedCount} Student Record(s)
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    All valid students have been permanently saved to SQLite and synchronized across active Admin views.
                  </p>
                </div>
              </div>

              {importResult.skippedDuplicates.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-amber-900">
                    Skipped Duplicate Employee Codes ({importResult.skippedDuplicates.length})
                  </h5>
                  <ul className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-amber-800 font-mono">
                    {importResult.skippedDuplicates.map((d, i) => (
                      <li key={i}>
                        Row #{d.rowNumber}: {d.employeeCode} ({d.studentName || 'Unknown'}) — {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.invalidRows.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-rose-900">
                    Skipped Invalid Rows ({importResult.invalidRows.length})
                  </h5>
                  <ul className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-rose-800 font-mono">
                    {importResult.invalidRows.map((d, i) => (
                      <li key={i}>
                        Row #{d.rowNumber}: {d.employeeCode || '(No Code)'} ({d.studentName || 'Unknown'}) — {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {step === 'map_preview' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || validCount === 0}
                onClick={() => void handleConfirmImport()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
              >
                <span>{isProcessing ? 'Importing to Database...' : `Confirm Import (${validCount} Students)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
