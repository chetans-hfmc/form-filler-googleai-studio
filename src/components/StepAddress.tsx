import React from 'react';
import { FormData } from '../types';

export function StepAddress({ data, update }: { data: FormData, update: (d: Partial<FormData>) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Residence Address (UAE)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Building & Flat No.</label>
            <input name="residenceBuilding" value={data.residenceBuilding} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Area / Street</label>
            <input name="residenceArea" value={data.residenceArea} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">City / Emirate</label>
            <input name="residenceCity" value={data.residenceCity} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">P.O. Box</label>
            <input name="residencePoBox" value={data.residencePoBox} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select name="residenceStatus" value={data.residenceStatus} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
              <option value="">Select...</option>
              <option value="Owned">Owned</option>
              <option value="Tenant">Tenant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Office / Current Company Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
            <input name="officeCompany" value={data.officeCompany} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Building Name</label>
            <input name="officeBuilding" value={data.officeBuilding} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Area / Street</label>
            <input name="officeArea" value={data.officeArea} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">City / Emirate</label>
            <input name="officeCity" value={data.officeCity} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">HR Email</label>
            <input type="email" name="officeHrEmail" value={data.officeHrEmail} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Home Country Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Building Name & Unit No.</label>
            <input name="homeBuilding" value={data.homeBuilding} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Area / Street</label>
            <input name="homeArea" value={data.homeArea} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">City / State</label>
            <input name="homeCity" value={data.homeCity} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
            <input name="homeCountry" value={data.homeCountry} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Telephone</label>
            <input name="homeTelephone" value={data.homeTelephone} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
