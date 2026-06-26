'use client';

import React from 'react';
import { useForm, useFormFields } from '@payloadcms/ui';

export function ApproveSponsorshipButton() {
  const { dispatchFields, submit } = useForm();
  const statusField = useFormFields(([fields]) => fields.status);
  
  if (statusField?.value === 'active') {
    return (
      <div className="p-4 bg-green-100 text-green-800 rounded-md mb-4 border border-green-200">
        ✅ This sponsorship is currently active.
      </div>
    );
  }

  const handleApprove = () => {
    // Update the status field to active
    dispatchFields({
      type: 'UPDATE',
      path: 'status',
      value: 'active',
    });
    
    // Auto-save the form
    setTimeout(() => {
      submit();
    }, 100);
  };

  const handleReject = () => {
    dispatchFields({
      type: 'UPDATE',
      path: 'status',
      value: 'rejected',
    });
  };

  return (
    <div className="mb-4 p-4 border border-orange-200 bg-orange-50 rounded-md flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold text-orange-800">Sponsorship Approval</h3>
        <p className="text-sm text-orange-700">
          Review the requested dates. Click approve to activate this sponsorship immediately.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApprove}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
        >
          ✓ Approve Sponsorship
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}
