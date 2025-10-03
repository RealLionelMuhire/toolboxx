'use client';

import React from 'react';

interface TenantVerificationUIProps {
  value?: string;
  onChange?: (value: string) => void;
  path?: string;
  data?: {
    id: string;
    verificationStatus?: string;
    verificationNotes?: string;
  };
  user?: {
    roles?: string[];
  };
}

export const TenantVerificationUI: React.FC<TenantVerificationUIProps> = ({ 
  data, 
  user 
}) => {
  // Only show for super admins
  if (!user?.roles?.includes('super-admin')) {
    return null;
  }

  const handleVerification = async (status: string) => {
    if (!data?.id) return;
    
    const notes = prompt('Add verification notes (optional):');
    
    try {
      const response = await fetch(`/api/tenants/${data.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: status,
          verificationNotes: notes || '',
          isVerified: status !== 'rejected',
          verifiedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('Verification status updated successfully!');
        window.location.reload();
      } else {
        alert('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating verification status');
    }
  };

  const currentStatus = data?.verificationStatus || 'pending';

  const buttonStyle = {
    padding: '8px 16px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundColor: '#0070f3',
    color: 'white',
  };

  const secondaryButton = {
    ...buttonStyle,
    backgroundColor: '#666',
    color: 'white',
  };

  const dangerButton = {
    ...buttonStyle,
    backgroundColor: '#e53e3e',
    color: 'white',
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #0070f3', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#0070f3', marginTop: 0 }}>
        🔐 Super Admin Verification Actions
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Current Status: </strong>
        <span style={{ 
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: currentStatus === 'pending' ? '#fff3cd' : 
                          currentStatus === 'document_verified' ? '#d1ecf1' :
                          currentStatus === 'physically_verified' ? '#d4edda' :
                          '#f8d7da',
          color: currentStatus === 'pending' ? '#856404' : 
                 currentStatus === 'document_verified' ? '#0c5460' :
                 currentStatus === 'physically_verified' ? '#155724' :
                 '#721c24'
        }}>
          {currentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '15px' }}>
        {currentStatus === 'pending' && (
          <>
            <button 
              style={primaryButton}
              onClick={() => handleVerification('document_verified')}
            >
              ✅ Verify Documents
            </button>
            <button 
              style={dangerButton}
              onClick={() => handleVerification('rejected')}
            >
              ❌ Reject
            </button>
          </>
        )}

        {currentStatus === 'document_verified' && (
          <>
            <button 
              style={primaryButton}
              onClick={() => handleVerification('physically_verified')}
            >
              🏠 Mark Physically Verified
            </button>
            <button 
              style={dangerButton}
              onClick={() => handleVerification('rejected')}
            >
              ❌ Reject
            </button>
          </>
        )}

        {(currentStatus === 'physically_verified' || currentStatus === 'rejected') && (
          <>
            <button 
              style={secondaryButton}
              onClick={() => handleVerification('document_verified')}
            >
              📄 Reset to Document Verified
            </button>
            <button 
              style={secondaryButton}
              onClick={() => handleVerification('pending')}
            >
              🔄 Reset to Pending
            </button>
          </>
        )}
      </div>

      {data?.verificationNotes && (
        <div style={{ 
          padding: '10px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>Admin Notes:</strong>
          <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
            {data.verificationNotes}
          </div>
        </div>
      )}
    </div>
  );
};
