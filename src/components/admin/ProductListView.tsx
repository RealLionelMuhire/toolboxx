import React, { useEffect } from 'react';
import { DefaultListView } from '@payloadcms/ui';
import { useAuth } from '@payloadcms/ui';

interface ProductListViewProps {
  [key: string]: unknown;
}

export const ProductListView: React.FC<ProductListViewProps> = (props) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('super-admin');

  useEffect(() => {
    // Hide tenant column for non-super-admin users
    if (!isSuperAdmin) {
      const style = document.createElement('style');
      style.textContent = `
        th[data-column="tenant"],
        td[data-column="tenant"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, [isSuperAdmin]);

  return <DefaultListView {...props} />;
};

export default ProductListView;
