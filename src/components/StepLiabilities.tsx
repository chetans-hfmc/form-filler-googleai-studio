import React from 'react';
import { FormData } from '../types';

export function StepLiabilities({ data, update }: { data: FormData, update: (d: Partial<FormData>) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  const InputGrid = ({ title, prefix }: { title: string, prefix: string }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-neutral-800">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Bank Name</label>
          <input name={`${prefix}Bank`} value={(data as any)[`${prefix}Bank`]} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Total Outstanding</label>
          <input name={`${prefix}Os`} value={(data as any)[`${prefix}Os`]} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Monthly EMI</label>
          <input name={`${prefix}Emi`} value={(data as any)[`${prefix}Emi`]} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Remaining Term (m)</label>
          <input name={`${prefix}Term`} value={(data as any)[`${prefix}Term`]} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-6">
        <InputGrid title="Personal Loan" prefix="personalLoan" />
        <div className="border-t border-neutral-200" />
        <InputGrid title="Car Loan" prefix="carLoan" />
        <div className="border-t border-neutral-200" />
        <InputGrid title="Home Loan" prefix="homeLoan" />
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Credit Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="font-medium text-neutral-800 text-sm">Credit Card 1</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Bank Name</label>
                <input name="cc1Bank" value={data.cc1Bank} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Card Limit</label>
                <input name="cc1Limit" value={data.cc1Limit} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-neutral-800 text-sm">Credit Card 2</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Bank Name</label>
                <input name="cc2Bank" value={data.cc2Bank} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Card Limit</label>
                <input name="cc2Limit" value={data.cc2Limit} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
