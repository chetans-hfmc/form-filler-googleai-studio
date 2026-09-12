import React, { useState } from 'react';
import { FormData } from '../types';
import { FormField, getInputClassName } from './FormField';

interface StepPersonalProps {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export function StepPersonal({ data, update, errors = {}, showErrors = false }: StepPersonalProps) {
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
          <h3 className="text-lg font-medium text-neutral-900">Applicant Details</h3>
          <span className="text-xs text-neutral-500">
            <span className="text-rose-500 font-bold">*</span> Mandatory fields required by UAE Central Bank
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="First Name" name="firstName" required error={getError('firstName')}>
            <input 
              name="firstName" 
              value={data.firstName} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Mohammed"
              className={getInputClassName(Boolean(getError('firstName')))} 
            />
          </FormField>

          <FormField label="Middle Name" name="middleName">
            <input 
              name="middleName" 
              value={data.middleName} 
              onChange={handleChange} 
              className={getInputClassName(false)} 
            />
          </FormField>

          <FormField label="Last Name" name="lastName" required error={getError('lastName')}>
            <input 
              name="lastName" 
              value={data.lastName} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. Al Hashimi"
              className={getInputClassName(Boolean(getError('lastName')))} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Date of Birth" name="dob" required error={getError('dob')}>
            <input 
              type="date" 
              name="dob" 
              value={data.dob} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={getInputClassName(Boolean(getError('dob')))} 
            />
          </FormField>

          <FormField label="Gender" name="gender" required error={getError('gender')}>
            <select 
              name="gender" 
              value={data.gender} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={getInputClassName(Boolean(getError('gender')), "bg-white")}
            >
              <option value="">Select Gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nationality" name="nationality" required error={getError('nationality')}>
            <input 
              name="nationality" 
              value={data.nationality} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. United Arab Emirates"
              className={getInputClassName(Boolean(getError('nationality')))} 
            />
          </FormField>

          <FormField label="Resident of UAE Since" name="residentOfUaeSince">
            <input 
              type="date" 
              name="residentOfUaeSince" 
              value={data.residentOfUaeSince} 
              onChange={handleChange} 
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Emirates ID No." name="emiratesId" required error={getError('emiratesId')}>
            <input 
              name="emiratesId" 
              value={data.emiratesId} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="784-1990-1234567-1"
              className={getInputClassName(Boolean(getError('emiratesId')))} 
            />
          </FormField>

          <FormField label="Emirates ID Expiry" name="emiratesIdExpiry">
            <input 
              type="date" 
              name="emiratesIdExpiry" 
              value={data.emiratesIdExpiry} 
              onChange={handleChange} 
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Passport No." name="passportNo" required error={getError('passportNo')}>
            <input 
              name="passportNo" 
              value={data.passportNo} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. N1234567"
              className={getInputClassName(Boolean(getError('passportNo')))} 
            />
          </FormField>

          <FormField label="Passport Expiry" name="passportExpiry">
            <input 
              type="date" 
              name="passportExpiry" 
              value={data.passportExpiry} 
              onChange={handleChange} 
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mobile Number" name="mobileNumber" required error={getError('mobileNumber')}>
            <input 
              name="mobileNumber" 
              value={data.mobileNumber} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="+971 50 123 4567"
              className={getInputClassName(Boolean(getError('mobileNumber')))} 
            />
          </FormField>

          <FormField label="Personal Email" name="personalEmail" required error={getError('personalEmail')}>
            <input 
              type="email" 
              name="personalEmail" 
              value={data.personalEmail} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="applicant@example.com"
              className={getInputClassName(Boolean(getError('personalEmail')))} 
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Marital Status" name="maritalStatus" required error={getError('maritalStatus')}>
            <select 
              name="maritalStatus" 
              value={data.maritalStatus} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={getInputClassName(Boolean(getError('maritalStatus')), "bg-white")}
            >
              <option value="">Select Status...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </FormField>

          <FormField label="Mother's Full Name" name="mothersFullName">
            <input 
              name="mothersFullName" 
              value={data.mothersFullName} 
              onChange={handleChange} 
              placeholder="Mother's maiden name"
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors">
          <input 
            type="checkbox" 
            checked={data.hasCoApplicant} 
            onChange={(e) => update({ hasCoApplicant: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div>
            <span className="text-sm font-semibold text-neutral-800 block">Add Co-Applicant Details</span>
            <span className="text-xs text-neutral-500">Joint mortgage application with spouse or business partner</span>
          </div>
        </label>
      </div>

      {data.hasCoApplicant && (
        <div className="space-y-4 pt-4 border-t border-neutral-200 animate-in fade-in">
          <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Co-Applicant Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Co-App First Name" name="coAppFirstName" required error={getError('coAppFirstName')}>
              <input 
                name="coAppFirstName" 
                value={data.coAppFirstName} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={getInputClassName(Boolean(getError('coAppFirstName')))} 
              />
            </FormField>

            <FormField label="Co-App Middle Name" name="coAppMiddleName">
              <input 
                name="coAppMiddleName" 
                value={data.coAppMiddleName} 
                onChange={handleChange} 
                className={getInputClassName(false)} 
              />
            </FormField>

            <FormField label="Co-App Last Name" name="coAppLastName" required error={getError('coAppLastName')}>
              <input 
                name="coAppLastName" 
                value={data.coAppLastName} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={getInputClassName(Boolean(getError('coAppLastName')))} 
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
