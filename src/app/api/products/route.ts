import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const refundPolicy = formData.get('refundPolicy') as string;
    const content = formData.get('content') as string;
    const isPrivate = formData.get('isPrivate') === 'true';
    const tagsString = formData.get('tags') as string;
    
    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (e) {
        console.warn('Failed to parse tags:', e);
      }
    }

    // Handle file uploads
    let imageId: string | undefined;
    let coverId: string | undefined;

    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      try {
        const buffer = await imageFile.arrayBuffer();
        const imageResult = await payload.create({
          collection: 'media',
          data: {
            alt: name || 'Product image',
          },
          file: {
            data: Buffer.from(buffer),
            mimetype: imageFile.type,
            name: imageFile.name,
            size: imageFile.size,
          },
        });
        imageId = imageResult.id;
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    const coverFile = formData.get('cover') as File;
    if (coverFile && coverFile.size > 0) {
      try {
        const buffer = await coverFile.arrayBuffer();
        const coverResult = await payload.create({
          collection: 'media',
          data: {
            alt: `${name} cover image` || 'Product cover image',
          },
          file: {
            data: Buffer.from(buffer),
            mimetype: coverFile.type,
            name: coverFile.name,
            size: coverFile.size,
          },
        });
        coverId = coverResult.id;
      } catch (error) {
        console.error('Error uploading cover:', error);
      }
    }

    // Create the product with proper type casting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productData: any = {
      name: name || '',
      price: price || 0,
      refundPolicy: refundPolicy as '30-day' | '14-day' | '7-day' | '3-day' | '1-day' | 'no-refunds' || '30-day',
      isPrivate: isPrivate || false,
    };

    // Add optional fields only if they exist
    if (description && description.trim()) {
      productData.description = description;
    }
    
    if (content && content.trim()) {
      productData.content = content;
    }
    
    if (category) {
      productData.category = category;
    }
    
    if (tags.length > 0) {
      productData.tags = tags;
    }
    
    if (imageId) {
      productData.image = imageId;
    }
    
    if (coverId) {
      productData.cover = coverId;
    }

    const result = await payload.create({
      collection: 'products',
      data: productData,
    });

    return NextResponse.json({
      success: true,
      doc: result,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
