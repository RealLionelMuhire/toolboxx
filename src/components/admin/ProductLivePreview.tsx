'use client';

import React from 'react';

interface ProductLivePreviewProps {
  data?: {
    name?: string;
    description?: unknown;
    price?: number;
    image?: unknown;
    tags?: unknown[];
    refundPolicy?: string;
    isPrivate?: boolean;
  };
}

export const ProductLivePreview: React.FC<ProductLivePreviewProps> = ({ data }) => {
  const getImageUrl = (image: unknown) => {
    console.log('[getImageUrl] Processing image:', image);
    
    if (!image) {
      console.log('[getImageUrl] No image provided, returning null');
      return null;
    }

    try {
      // If it's a string, check if it's a valid URL or just an ID
      if (typeof image === 'string') {
        console.log('[getImageUrl] Image is string:', image);
        
        // Check if it looks like a MongoDB ObjectId (24 hex characters)
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (objectIdPattern.test(image)) {
          console.log('[getImageUrl] Detected ObjectId pattern, constructing media URL');
          return `/api/media/file/${image}`;
        }
        
        // If it starts with http/https, it's already a URL
        if (image.startsWith('http://') || image.startsWith('https://')) {
          console.log('[getImageUrl] Image is already a full URL');
          return image;
        }
        
        // If it's just an ID, construct the media URL
        console.log('[getImageUrl] Image is ID, constructing media URL');
        return `/api/media/file/${image}`;
      }

      // If it's an object with url property
      if (typeof image === 'object' && image !== null && 'url' in image) {
        console.log('[getImageUrl] Image object has url property:', (image as { url: string }).url);
        return (image as { url: string }).url;
      }

      // If it's an object with filename property
      if (typeof image === 'object' && image !== null && 'filename' in image) {
        console.log('[getImageUrl] Image object has filename property:', (image as { filename: string }).filename);
        return `/api/media/file/${(image as { filename: string }).filename}`;
      }

      // If it's an object with id property (during upload)
      if (typeof image === 'object' && image !== null && 'id' in image) {
        console.log('[getImageUrl] Image object has id property:', (image as { id: string }).id);
        const id = (image as { id: string }).id;
        
        // Double-check that this ID looks valid before using it
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (objectIdPattern.test(id)) {
          return `/api/media/file/${id}`;
        } else {
          console.warn('[getImageUrl] ID does not look like valid ObjectId:', id);
          return null;
        }
      }

      console.log('[getImageUrl] Could not process image, returning null');
      return null;
    } catch (error) {
      console.error('[getImageUrl] Error parsing image URL:', error, 'Image data:', image);
      return null;
    }
  };  const getDescriptionText = (description: unknown) => {
    if (!description) return '';
    if (typeof description === 'string') return description;
    
    // Extract text from rich text content
    try {
      if (typeof description === 'object' && description !== null && 'root' in description) {
        const root = (description as { root?: { children?: unknown[] } }).root;
        if (root?.children) {
          return root.children
            .map((child: unknown) => {
              if (typeof child === 'object' && child !== null && 'type' in child && 'children' in child) {
                const childObj = child as { type: string; children?: unknown[] };
                if (childObj.type === 'paragraph' && childObj.children) {
                  return childObj.children
                    .filter((item: unknown) => typeof item === 'object' && item !== null && 'type' in item && (item as { type: string }).type === 'text')
                    .map((item: unknown) => (item as { text: string }).text)
                    .join('');
                }
              }
              return '';
            })
            .filter(Boolean)
            .join(' ');
        }
      }
    } catch {
      // Fallback for any parsing errors
    }
    
    return '';
  };

  // More detailed logging before calling getImageUrl
  console.log('[ProductLivePreview] Received data:', data);
  console.log('[ProductLivePreview] Image field raw value:', data?.image);
  console.log('[ProductLivePreview] Image field type:', typeof data?.image);
  
  if (data?.image) {
    if (typeof data.image === 'string') {
      console.log('[ProductLivePreview] Image is string:', data.image);
    } else if (typeof data.image === 'object') {
      console.log('[ProductLivePreview] Image is object with keys:', Object.keys(data.image));
      console.log('[ProductLivePreview] Image object full structure:', JSON.stringify(data.image, null, 2));
    }
  }

  const imageUrl = getImageUrl(data?.image);
  console.log('[ProductLivePreview] Processed imageUrl:', imageUrl);
  
  // Safety check: if we detect a raw ObjectId that might cause URL constructor errors, don't render
  if (data?.image && typeof data.image === 'string') {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (objectIdPattern.test(data.image) && !imageUrl) {
      console.warn('[ProductLivePreview] Detected problematic ObjectId, skipping render to prevent URL constructor error');
      return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden max-w-sm">
          <div className="text-sm text-gray-500 p-3 border-b bg-gray-50">
            Customer View Preview (Loading...)
          </div>
          <div className="p-4 text-center text-gray-500">
            Image loading...
          </div>
        </div>
      );
    }
  }
  
  const descriptionText = getDescriptionText(data?.description);

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden max-w-sm">
      <div className="text-sm text-gray-500 p-3 border-b bg-gray-50">
        Customer View Preview
      </div>
      
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl}
              alt={data?.name || 'Product'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.image-fallback');
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
            <div className="image-fallback hidden flex flex-col items-center justify-center text-gray-400 absolute inset-0">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">📦</span>
              </div>
              <span className="text-sm">Image not found</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl">📦</span>
            </div>
            <span className="text-sm">No image selected</span>
          </div>
        )}
        
        {/* Private badge */}
        {data?.isPrivate && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Private
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {data?.name || 'Product Name'}
        </h3>
        
        {descriptionText && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {descriptionText}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-green-600">
            {data?.price ? `${data.price.toLocaleString()} RWF` : '0 RWF'}
          </span>
          
          {/* Rating placeholder */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-yellow-400 text-xs">★</span>
            ))}
            <span className="text-xs text-gray-500 ml-1">(0)</span>
          </div>
        </div>

        {/* Tags */}
        {data?.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {data.tags.slice(0, 3).map((tag: unknown, index: number) => {
              const tagName = typeof tag === 'string' ? tag : 
                (typeof tag === 'object' && tag !== null && 'name' in tag ? 
                  (tag as { name: string }).name : `Tag ${index + 1}`);
              return (
                <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {tagName}
                </span>
              );
            })}
            {data.tags.length > 3 && (
              <span className="bg-gray-50 text-gray-500 text-xs px-2 py-1 rounded border">
                +{data.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Refund policy */}
        {data?.refundPolicy && (
          <div className="text-xs text-gray-500 mb-3">
            Return policy: {data.refundPolicy}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white text-sm py-2 px-4 rounded font-medium">
            Add to Cart
          </button>
          <button className="bg-gray-100 text-gray-600 text-sm py-2 px-3 rounded">
            ♡
          </button>
        </div>
      </div>
      
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-400 text-center">
          This is how customers will see your product
        </div>
      </div>
    </div>
  );
};

export default ProductLivePreview;
