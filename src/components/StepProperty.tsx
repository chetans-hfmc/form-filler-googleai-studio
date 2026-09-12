import React from 'react';
import { FormData } from '../types';

export function StepProperty({ data, update }: { data: FormData, update: (d: Partial<FormData>) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Property Usage</label>
          <select name="propertyUsage" value={data.propertyUsage} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
            <option value="">Select...</option>
            <option value="Personal Use">Personal Use / Live in</option>
            <option value="Investment">Investment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Property Status</label>
          <select name="propertyStatus" value={data.propertyStatus} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
            <option value="">Select...</option>
            <option value="Finalized">Finalized</option>
            <option value="Yet to be finalized">Yet to be finalized</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Ownership Type</label>
          <select name="ownershipType" value={data.ownershipType} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
            <option value="">Select...</option>
            <option value="Single">Single</option>
            <option value="Joint">Joint</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Market Type</label>
          <select name="marketType" value={data.marketType} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white">
            <option value="">Select...</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Building Name & Number</label>
          <input name="propertyBuilding" value={data.propertyBuilding} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Area / Street</label>
          <input name="propertyArea" value={data.propertyArea} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Developer Name</label>
          <input name="propertyDeveloper" value={data.propertyDeveloper} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Project Name</label>
          <input name="propertyProject" value={data.propertyProject} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
      </div>
    </div>
  );
}
