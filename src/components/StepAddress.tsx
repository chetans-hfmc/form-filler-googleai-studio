import React, { useState } from 'react';
import { FormData } from '../types';
import { FormField, getInputClassName } from './FormField';

interface StepAddressProps {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export function StepAddress({ data, update, errors = {}, showErrors = false }: StepAddressProps) {
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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-neutral-900">Residence Address (UAE)</h3>
          <span className="text-xs text-neutral-500">
            <span className="text-rose-500 font-bold">*</span> Mandatory fields
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Building & Flat No." name="residenceBuilding" required error={getError('residenceBuilding')}>
            <input 
              name="residenceBuilding" 
              value={data.residenceBuilding} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Marina Crown, Apt 1402"
              className={getInputClassName(Boolean(getError('residenceBuilding')))} 
            />
          </FormField>

          <FormField label="Area / Street" name="residenceArea" required error={getError('residenceArea')}>
            <input 
              name="residenceArea" 
              value={data.residenceArea} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Dubai Marina, King Salman St"
              className={getInputClassName(Boolean(getError('residenceArea')))} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="City / Emirate" name="residenceCity" required error={getError('residenceCity')}>
            <input 
              name="residenceCity" 
              value={data.residenceCity} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Dubai"
              className={getInputClassName(Boolean(getError('residenceCity')))} 
            />
          </FormField>

          <FormField label="P.O. Box" name="residencePoBox">
            <input 
              name="residencePoBox" 
              value={data.residencePoBox} 
              onChange={handleChange} 
              placeholder="e.g. 12345"
              className={getInputClassName(false)} 
            />
          </FormField>

          <FormField label="Residence Status" name="residenceStatus" required error={getError('residenceStatus')}>
            <select 
              name="residenceStatus" 
              value={data.residenceStatus} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={getInputClassName(Boolean(getError('residenceStatus')), "bg-white")}
            >
              <option value="">Select Status...</option>
              <option value="Owned">Owned</option>
              <option value="Tenant">Tenant</option>
            </select>
          </FormField>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-neutral-900">Office / Current Company Details</h3>
          <span className="text-xs text-neutral-500">Employment verification</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name" name="officeCompany" required error={getError('officeCompany')}>
            <input 
              name="officeCompany" 
              value={data.officeCompany} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Emirates Airlines LLC"
              className={getInputClassName(Boolean(getError('officeCompany')))} 
            />
          </FormField>

          <FormField label="Building Name" name="officeBuilding">
            <input 
              name="officeBuilding" 
              value={data.officeBuilding} 
              onChange={handleChange} 
              placeholder="e.g. Headquarters Tower"
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Area / Street" name="officeArea">
            <input 
              name="officeArea" 
              value={data.officeArea} 
              onChange={handleChange} 
              placeholder="e.g. Airport Road"
              className={getInputClassName(false)} 
            />
          </FormField>

          <FormField label="City / Emirate" name="officeCity" required error={getError('officeCity')}>
            <input 
              name="officeCity" 
              value={data.officeCity} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Dubai"
              className={getInputClassName(Boolean(getError('officeCity')))} 
            />
          </FormField>

          <FormField label="HR Official Email" name="officeHrEmail" error={getError('officeHrEmail')}>
            <input 
              type="email" 
              name="officeHrEmail" 
              value={data.officeHrEmail} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="hr@company.com"
              className={getInputClassName(Boolean(getError('officeHrEmail')))} 
            />
          </FormField>
        </div>
      </div>
      
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-neutral-900">Home Country Permanent Address</h3>
          <span className="text-xs text-neutral-500">Required for expat compliance</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Building Name & Unit No." name="homeBuilding">
            <input 
              name="homeBuilding" 
              value={data.homeBuilding} 
              onChange={handleChange} 
              placeholder="e.g. 42 Oakwood Street"
              className={getInputClassName(false)} 
            />
          </FormField>

          <FormField label="Area / Street" name="homeArea">
            <input 
              name="homeArea" 
              value={data.homeArea} 
              onChange={handleChange} 
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="City / State" name="homeCity" required error={getError('homeCity')}>
            <input 
              name="homeCity" 
              value={data.homeCity} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. London"
              className={getInputClassName(Boolean(getError('homeCity')))} 
            />
          </FormField>

          <FormField label="Country" name="homeCountry" required error={getError('homeCountry')}>
            <input 
              name="homeCountry" 
              value={data.homeCountry} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. United Kingdom"
              className={getInputClassName(Boolean(getError('homeCountry')))} 
            />
          </FormField>

          <FormField label="Telephone" name="homeTelephone">
            <input 
              name="homeTelephone" 
              value={data.homeTelephone} 
              onChange={handleChange} 
              placeholder="e.g. +44 20 7946 0912"
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
