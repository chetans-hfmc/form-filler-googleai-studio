import React, { useState } from 'react';
import { FormData } from '../types';
import { FormField, getInputClassName } from './FormField';

interface StepPropertyProps {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export function StepProperty({ data, update, errors = {}, showErrors = false }: StepPropertyProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const getError = (name: string) => {
    return (showErrors || touched[name]) ? errors[name] : undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-medium text-neutral-900">Security / Property Details</h3>
        <span className="text-xs text-neutral-500">
          <span className="text-rose-500 font-bold">*</span> Mandatory for loan assessment
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Property Usage" name="propertyUsage" required error={getError('propertyUsage')}>
          <select 
            name="propertyUsage" 
            value={data.propertyUsage} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={getInputClassName(Boolean(getError('propertyUsage')), "bg-white")}
          >
            <option value="">Select Usage...</option>
            <option value="Personal Use">Personal Use / Live in</option>
            <option value="Investment">Investment</option>
          </select>
        </FormField>

        <FormField label="Property Status" name="propertyStatus" required error={getError('propertyStatus')}>
          <select 
            name="propertyStatus" 
            value={data.propertyStatus} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={getInputClassName(Boolean(getError('propertyStatus')), "bg-white")}
          >
            <option value="">Select Status...</option>
            <option value="Finalized">Finalized</option>
            <option value="Yet to be finalized">Yet to be finalized</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Ownership Type" name="ownershipType" required error={getError('ownershipType')}>
          <select 
            name="ownershipType" 
            value={data.ownershipType} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={getInputClassName(Boolean(getError('ownershipType')), "bg-white")}
          >
            <option value="">Select Ownership...</option>
            <option value="Single">Single</option>
            <option value="Joint">Joint</option>
          </select>
        </FormField>

        <FormField label="Market Type" name="marketType" required error={getError('marketType')}>
          <select 
            name="marketType" 
            value={data.marketType} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={getInputClassName(Boolean(getError('marketType')), "bg-white")}
          >
            <option value="">Select Market Type...</option>
            <option value="Primary">Primary (Off-plan / Developer)</option>
            <option value="Secondary">Secondary (Resale)</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="Building Name & Number" 
          name="propertyBuilding" 
          required={data.propertyStatus === 'Finalized'} 
          error={getError('propertyBuilding')}
        >
          <input 
            name="propertyBuilding" 
            value={data.propertyBuilding} 
            onChange={handleChange} 
            onBlur={handleBlur}
            placeholder="e.g. Burj Crown, Unit 1204"
            className={getInputClassName(Boolean(getError('propertyBuilding')))} 
          />
        </FormField>

        <FormField label="Area / Street / Community" name="propertyArea">
          <input 
            name="propertyArea" 
            value={data.propertyArea} 
            onChange={handleChange} 
            placeholder="e.g. Downtown Dubai"
            className={getInputClassName(false)} 
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Developer Name" name="propertyDeveloper">
          <input 
            name="propertyDeveloper" 
            value={data.propertyDeveloper} 
            onChange={handleChange} 
            placeholder="e.g. Emaar Properties"
            className={getInputClassName(false)} 
          />
        </FormField>

        <FormField label="Project Name" name="propertyProject">
          <input 
            name="propertyProject" 
            value={data.propertyProject} 
            onChange={handleChange} 
            placeholder="e.g. Dubai Creek Harbour"
            className={getInputClassName(false)} 
          />
        </FormField>
      </div>
    </div>
  );
}
