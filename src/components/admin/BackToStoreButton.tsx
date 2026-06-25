"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BackToStoreButton() {
  return (
    <div style={{ 
      padding: '16px', 
      borderTop: '1px solid var(--theme-elevation-150)',
      marginTop: 'auto'
    }}>
      <a 
        href="/admin/collections/products" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          textDecoration: 'none', 
          color: 'var(--theme-text)', 
          fontWeight: '500',
          fontSize: '14px',
          padding: '8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          backgroundColor: 'var(--theme-elevation-100)'
        }}
      >
        <ArrowLeft size={16} />
        Back to Product Listing
      </a>
      
      <a 
        href="/my-store" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          textDecoration: 'none', 
          color: 'var(--theme-text)', 
          fontWeight: '500',
          fontSize: '14px',
          padding: '8px',
          marginTop: '8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
      >
        <ArrowLeft size={16} />
        Go to Frontend Store
      </a>
    </div>
  );
}
