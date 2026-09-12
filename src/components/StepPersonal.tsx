import React from 'react';
import { FormData } from '../types';

export function StepPersonal({ data, update }: { data: FormData, update: (d: Partial<FormData>) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Applicant Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
            <input name="firstName" value={data.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Middle Name</label>
            <input name="middleName" value={data.middleName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
            <input name="lastName" value={data.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Date of Birth</label>
            <input type="date" name="dob" value={data.dob} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
            <select name="gender" value={data.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nationality</label>
            <input name="nationality" value={data.nationality} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Resident of UAE Since</label>
            <input type="date" name="residentOfUaeSince" value={data.residentOfUaeSince} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Emirates ID No.</label>
            <input name="emiratesId" value={data.emiratesId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Emirates ID Expiry</label>
            <input type="date" name="emiratesIdExpiry" value={data.emiratesIdExpiry} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Passport No.</label>
            <input name="passportNo" value={data.passportNo} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Passport Expiry</label>
            <input type="date" name="passportExpiry" value={data.passportExpiry} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number</label>
            <input name="mobileNumber" value={data.mobileNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Personal Email</label>
            <input type="email" name="personalEmail" value={data.personalEmail} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Marital Status</label>
            <select name="maritalStatus" value={data.maritalStatus} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Mother's Full Name</label>
            <input name="mothersFullName" value={data.mothersFullName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.hasCoApplicant} 
            onChange={(e) => update({ hasCoApplicant: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-neutral-800">Add Co-Applicant Details</span>
        </label>
      </div>

      {data.hasCoApplicant && (
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Co-Applicant Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
              <input name="coAppFirstName" value={data.coAppFirstName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Middle Name</label>
              <input name="coAppMiddleName" value={data.coAppMiddleName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
              <input name="coAppLastName" value={data.coAppLastName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
          {/* We can add other co-app fields as needed */}
        </div>
      )}
    </div>
  );
}
