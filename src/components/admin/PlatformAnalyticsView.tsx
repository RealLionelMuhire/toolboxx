"use client";

import React from 'react';

export const PlatformAnalyticsView = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <iframe 
        src="/all-tenants" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Platform Analytics"
      />
    </div>
  );
};
