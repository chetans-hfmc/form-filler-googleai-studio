import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormData } from '../types';

export function StepKyc({ data, update }: { data: FormData, update: (d: Partial<FormData>) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new window.FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/parse-kyc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      const parsedData = await response.json();
      
      update({
        firstName: parsedData.firstName || '',
        middleName: parsedData.middleName || '',
        lastName: parsedData.lastName || '',
        dob: parsedData.dob || '',
        nationality: parsedData.nationality || '',
        gender: parsedData.gender || '',
        passportNo: parsedData.passportNo || '',
        passportExpiry: parsedData.passportExpiry || '',
        emiratesId: parsedData.emiratesId || '',
        emiratesIdExpiry: parsedData.emiratesIdExpiry || '',
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during parsing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-sm text-blue-800">
        <h3 className="font-semibold text-blue-900 mb-2">Automated Data Entry</h3>
        <p>Upload a clear photo or scan of your Emirates ID or Passport. Our AI will securely extract your personal details and pre-fill the form for you.</p>
      </div>

      <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors relative cursor-pointer group">
        <input 
          type="file" 
          accept="image/*,.pdf" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileUpload}
          disabled={loading}
        />
        
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-neutral-600">Extracting details with AI...</p>
            </>
          ) : success ? (
            <>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-green-700">Document parsed successfully!</p>
              <p className="text-xs text-neutral-500">You can review and edit the extracted details in the next step.</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-700">Click or drag document to upload</p>
              <p className="text-xs text-neutral-500">Supports JPG, PNG, PDF (Max 5MB)</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
