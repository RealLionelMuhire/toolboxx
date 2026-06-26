"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BackToStoreButton() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      marginRight: '16px',
      zIndex: 100
    }}>
      <a 
        href="/" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          textDecoration: 'none', 
          color: 'var(--theme-text)', 
          fontWeight: '500',
          fontSize: '14px',
          padding: '6px 12px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          backgroundColor: 'var(--theme-elevation-100)'
        }}
      >
        <ArrowLeft size={16} />
        Product Listing
      </a>
      
      <a 
        href="/my-store" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          textDecoration: 'none', 
          color: 'var(--theme-text)', 
          fontWeight: '500',
          fontSize: '14px',
          padding: '6px 12px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          backgroundColor: 'var(--theme-elevation-100)'
        }}
      >
        Go to Store
      </a>
    </div>
  );
}
