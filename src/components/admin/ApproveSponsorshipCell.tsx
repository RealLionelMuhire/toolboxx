'use client';

import React, { useState } from 'react';

interface ApproveSponsorshipCellProps {
  cellData?: string;
  rowData?: {
    id: string;
    [key: string]: unknown;
  };
}

export const ApproveSponsorshipCell: React.FC<ApproveSponsorshipCellProps> = ({ cellData, rowData }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const status = cellData || 'pending';
  const sponsorshipId = rowData?.id;

  const handleUpdateStatus = async (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation(); // Prevent row click navigation
    if (!sponsorshipId) return;
    
    // Ask for confirmation when rejecting or ending
    if (newStatus === 'rejected' && !window.confirm('Are you sure you want to reject this sponsorship?')) return;
    if (newStatus === 'expired' && !window.confirm('Are you sure you want to end this active sponsorship?')) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sponsorships/${sponsorshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to update sponsorship');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <span style={{ padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Active</span>;
      case 'rejected':
        return <span style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Rejected</span>;
      case 'expired':
        return <span style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Expired</span>;
      default:
        return <span style={{ padding: '4px 8px', backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Pending</span>;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {getStatusBadge()}
      {status === 'pending' && (
        <>
          <button
            onClick={(e) => handleUpdateStatus(e, 'active')}
            disabled={isUpdating}
            style={{
              padding: '4px 8px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              opacity: isUpdating ? 0.7 : 1,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            {isUpdating ? '...' : '✓ Approve'}
          </button>
          <button
            onClick={(e) => handleUpdateStatus(e, 'rejected')}
            disabled={isUpdating}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              opacity: isUpdating ? 0.7 : 1,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            {isUpdating ? '...' : '✕ Reject'}
          </button>
        </>
      )}
      {status === 'active' && (
        <button
          onClick={(e) => handleUpdateStatus(e, 'expired')}
          disabled={isUpdating}
          style={{
            padding: '4px 8px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            opacity: isUpdating ? 0.7 : 1,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          {isUpdating ? '...' : '✕ End Sponsorship'}
        </button>
      )}
    </div>
  );
};
