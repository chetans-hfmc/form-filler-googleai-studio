import React, { useState } from 'react';
import { FormData } from '../types';
import { FormField, getInputClassName } from './FormField';

interface StepLiabilitiesProps {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
}

export function StepLiabilities({ data, update, errors = {}, showErrors = false }: StepLiabilitiesProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const getError = (name: string) => {
    return (showErrors || touched[name]) ? errors[name] : undefined;
  };

  const InputGrid = ({ title, prefix }: { title: string, prefix: string }) => {
    const isBankFilled = Boolean(((data as any)[`${prefix}Bank`] || '').trim());
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-neutral-800 text-sm">{title}</h4>
          {isBankFilled && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Active Facility
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Bank Name" name={`${prefix}Bank`} error={getError(`${prefix}Bank`)}>
            <input 
              name={`${prefix}Bank`} 
              value={(data as any)[`${prefix}Bank`]} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. ADCB"
              className={getInputClassName(Boolean(getError(`${prefix}Bank`)))} 
            />
          </FormField>

          <FormField label="Total Outstanding" name={`${prefix}Os`} required={isBankFilled} error={getError(`${prefix}Os`)}>
            <input 
              name={`${prefix}Os`} 
              value={(data as any)[`${prefix}Os`]} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. 50,000"
              className={getInputClassName(Boolean(getError(`${prefix}Os`)))} 
            />
          </FormField>

          <FormField label="Monthly EMI" name={`${prefix}Emi`} required={isBankFilled} error={getError(`${prefix}Emi`)}>
            <input 
              name={`${prefix}Emi`} 
              value={(data as any)[`${prefix}Emi`]} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="e.g. 1,850"
              className={getInputClassName(Boolean(getError(`${prefix}Emi`)))} 
            />
          </FormField>

          <FormField label="Remaining Term (m)" name={`${prefix}Term`}>
            <input 
              name={`${prefix}Term`} 
              value={(data as any)[`${prefix}Term`]} 
              onChange={handleChange} 
              placeholder="e.g. 24"
              className={getInputClassName(false)} 
            />
          </FormField>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-medium text-neutral-900">Liabilities & Central Bank AECB Disclosures</h3>
        <span className="text-xs text-neutral-500">Leave blank if no current liabilities</span>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-6">
        <InputGrid title="Personal Loan" prefix="personalLoan" />
        <div className="border-t border-neutral-200" />
        <InputGrid title="Auto / Car Loan" prefix="carLoan" />
        <div className="border-t border-neutral-200" />
        <InputGrid title="Existing Home Loan / Mortgage" prefix="homeLoan" />
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-medium text-neutral-900 border-b pb-2">Credit Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h4 className="font-medium text-neutral-800 text-sm">Credit Card 1</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bank Name" name="cc1Bank">
                <input 
                  name="cc1Bank" 
                  value={data.cc1Bank} 
                  onChange={handleChange} 
                  placeholder="e.g. Emirates NBD"
                  className={getInputClassName(false)} 
                />
              </FormField>

              <FormField label="Card Limit" name="cc1Limit" required={Boolean(data.cc1Bank)} error={getError('cc1Limit')}>
                <input 
                  name="cc1Limit" 
                  value={data.cc1Limit} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="e.g. 30,000"
                  className={getInputClassName(Boolean(getError('cc1Limit')))} 
                />
              </FormField>
            </div>
          </div>
          
          <div className="space-y-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h4 className="font-medium text-neutral-800 text-sm">Credit Card 2</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bank Name" name="cc2Bank">
                <input 
                  name="cc2Bank" 
                  value={data.cc2Bank} 
                  onChange={handleChange} 
                  placeholder="e.g. FAB"
                  className={getInputClassName(false)} 
                />
              </FormField>

              <FormField label="Card Limit" name="cc2Limit" required={Boolean(data.cc2Bank)} error={getError('cc2Limit')}>
                <input 
                  name="cc2Limit" 
                  value={data.cc2Limit} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="e.g. 20,000"
                  className={getInputClassName(Boolean(getError('cc2Limit')))} 
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
