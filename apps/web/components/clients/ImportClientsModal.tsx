'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Modal, Button } from '@massage/ui';
import { CheckCircle, Upload, Download, FileText, AlertCircle } from 'lucide-react';

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
}

const CSV_HEADERS = [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'dateOfBirth',
  'address',
  'city',
  'state',
  'postalCode',
  'occupation',
  'goals',
  'healthNotes',
  'emergencyContactName',
  'emergencyContactPhone',
];

const EXAMPLE_ROW = [
  'Jane',
  'Smith',
  'jane@example.com',
  '555-123-4567',
  '1985-03-15',
  '42 Elm Street',
  'Austin',
  'TX',
  '78701',
  'Teacher',
  'Stress relief',
  'Mild lower back tension',
  'John Smith',
  '555-987-6543',
];

function downloadTemplate() {
  const rows = [CSV_HEADERS.join(','), EXAMPLE_ROW.join(',')];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clients_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const STEPS = [
  {
    n: 1,
    title: 'Download the CSV template',
    desc: 'Get a blank spreadsheet with the correct column headers.',
  },
  {
    n: 2,
    title: 'Fill in your client data',
    desc: 'Add one client per row. Only First Name and Last Name are required.',
  },
  {
    n: 3,
    title: 'Upload your file',
    desc: 'Select the completed CSV file to import all clients at once.',
  },
];

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ isOpen, onClose, businessId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      const firstNameIdx = headers.findIndex((h) => h.toLowerCase() === 'firstname');
      const lastNameIdx = headers.findIndex((h) => h.toLowerCase() === 'lastname');

      if (firstNameIdx === -1 || lastNameIdx === -1) {
        setResult({ imported: 0, errors: ['CSV must have "firstName" and "lastName" columns.'] });
        return;
      }

      const rows = lines.slice(1).filter((l) => l.trim());
      const errors: string[] = [];
      let imported = 0;

      for (let i = 0; i < rows.length; i++) {
        const cols = rows[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const record: Record<string, string> = {};
        headers.forEach((h, idx) => {
          record[h] = cols[idx] ?? '';
        });

        if (!record.firstName || !record.lastName) {
          errors.push(`Row ${i + 2}: missing first or last name — skipped.`);
          continue;
        }

        try {
          const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...record, businessId }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            errors.push(`Row ${i + 2} (${record.firstName} ${record.lastName}): ${body.error ?? 'failed'}`);
          } else {
            imported++;
          }
        } catch {
          errors.push(`Row ${i + 2}: network error.`);
        }
      }

      setResult({ imported, errors });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Clients" size="md">
      <div className="space-y-5">
        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-3">
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#EDE5F4',
                  color: '#5D4AA8',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {step.n}
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: '#1E1830', margin: 0 }}>
                  {step.title}
                </p>
                <p style={{ fontSize: 12.5, color: '#7A7090', margin: '2px 0 0' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Download template */}
        <button
          onClick={downloadTemplate}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px dashed #C4B8D8',
            background: '#FAFAF9',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Download style={{ width: 18, height: 18, color: '#5D4AA8', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#1E1830', margin: 0 }}>
              Download CSV Template
            </p>
            <p style={{ fontSize: 12, color: '#7A7090', margin: 0 }}>
              clients_import_template.csv · {CSV_HEADERS.length} columns
            </p>
          </div>
        </button>

        {/* File upload */}
        <div>
          <label
            style={{ fontSize: 12.5, fontWeight: 500, color: '#3D3450', display: 'block', marginBottom: 6 }}
          >
            Upload your completed CSV
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${file ? '#5D4AA8' : '#E5DEEC'}`,
              background: file ? '#F7F4FB' : '#FAFAF9',
              cursor: 'pointer',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <Upload style={{ width: 16, height: 16, color: file ? '#5D4AA8' : '#7A7090', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: file ? '#1E1830' : '#7A7090' }}>
              {file ? file.name : 'Choose CSV file…'}
            </span>
          </label>
        </div>

        {/* Result */}
        {result && (
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${result.errors.length === 0 ? '#B3E6C0' : '#F5C6CB'}`,
              background: result.errors.length === 0 ? '#F0FBF3' : '#FDF4F5',
              padding: '12px 16px',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.errors.length === 0 ? (
                <CheckCircle style={{ width: 16, height: 16, color: '#2D9652' }} />
              ) : (
                <AlertCircle style={{ width: 16, height: 16, color: '#C0392B' }} />
              )}
              <p style={{ fontSize: 13, fontWeight: 500, color: result.errors.length === 0 ? '#2D9652' : '#C0392B', margin: 0 }}>
                {result.imported} client{result.imported !== 1 ? 's' : ''} imported successfully
                {result.errors.length > 0 && `, ${result.errors.length} row${result.errors.length !== 1 ? 's' : ''} skipped`}
              </p>
            </div>
            {result.errors.length > 0 && (
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#7A4040', marginBottom: 2 }}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Note about exports */}
        <p style={{ fontSize: 12, color: '#7A7090', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText style={{ width: 13, height: 13, flexShrink: 0 }} />
          You can also export your existing clients from the{' '}
          <Link href="/exports" onClick={handleClose} style={{ color: '#5D4AA8', fontWeight: 500 }}>
            Exports page
          </Link>
          .
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!file || importing || !!result?.imported}
            isLoading={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Clients
          </Button>
        </div>
      </div>
    </Modal>
  );
};
