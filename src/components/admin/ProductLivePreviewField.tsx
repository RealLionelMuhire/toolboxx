'use client';

import React from 'react';
import { useFormFields } from '@payloadcms/ui';
import { ProductLivePreview } from './ProductLivePreview';

export default function ProductLivePreviewField() {
  const [fields] = useFormFields(([fields, dispatch]) => {
    return fields;
  });

  // Debug logging to understand what data we're getting from Payload form fields
  console.log('[ProductLivePreviewField] Raw form fields:', fields);
  console.log('[ProductLivePreviewField] Image field specifically:', fields?.image);
  console.log('[ProductLivePreviewField] Image field type:', typeof fields?.image);
  
  // Check if image field has the problematic ObjectId structure
  if (fields?.image && typeof fields.image === 'object') {
    console.log('[ProductLivePreviewField] Image object keys:', Object.keys(fields.image));
    console.log('[ProductLivePreviewField] Image object values:', Object.values(fields.image));
  }

  return (
    <div className="product-live-preview-field">
      <ProductLivePreview data={fields} />
    </div>
  );
}
