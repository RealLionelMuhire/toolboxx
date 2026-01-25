import { NextRequest, NextResponse } from "next/server";
import { getPayloadSingleton } from "@/lib/payload-singleton";
import { headers as getHeaders } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadSingleton();
    const headers = await getHeaders();

    // Check authentication
    const session = await payload.auth({ headers });

    // Diagnostic logging for session
    console.log('[Media GET] Session:', {
      hasUser: !!session.user,
      userId: session.user?.id,
      userRoles: session.user?.roles,
      userEmail: session.user?.email,
    });

    if (!session.user) {
      console.error('[Media GET] Unauthorized - no user in session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get media IDs from query string
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      console.error('[Media GET] No IDs provided');
      return NextResponse.json({ error: "Media IDs required" }, { status: 400 });
    }

    const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);

    // Diagnostic logging for requested IDs
    console.log('[Media GET] Requesting media IDs:', ids);

    let sortedDocs: any[] = [];

    // If only one ID, use findByID for more reliable results
    if (ids.length === 1) {
      try {
        console.log('[Media GET] Querying single ID:', ids[0]);

        const doc = await payload.findByID({
          collection: "media",
          id: ids[0]!,
          overrideAccess: true, // Bypass access control - we already verified auth
        });

        console.log('[Media GET] Found document:', {
          id: doc.id,
          filename: doc.filename,
          hasUrl: !!doc.url,
        });

        sortedDocs = [doc];
      } catch (error) {
        console.error('[Media GET] Failed to find ID:', ids[0], error);
        sortedDocs = [];
      }
    } else {
      // For multiple IDs, use find with where clause
      console.log('[Media GET] Querying multiple IDs:', ids.length);

      const result = await payload.find({
        collection: "media",
        where: {
          id: {
            in: ids,
          },
        },
        limit: ids.length, // Set limit to exact number needed
        pagination: false, // Disable pagination to get all matching docs
        overrideAccess: true, // Bypass access control - we already verified auth
      });

      console.log('[Media GET] Query result:', {
        totalDocs: result.docs.length,
        foundIds: result.docs.map(d => d.id),
        requestedIds: ids,
      });

      // Sort docs to match the order of IDs in the request
      sortedDocs = ids
        .map(id => result.docs.find(doc => doc.id === id))
        .filter(Boolean); // Remove any undefined values

      console.log('[Media GET] After sorting:', {
        count: sortedDocs.length,
        expected: ids.length,
      });
    }

    const responseData = {
      success: true,
      docs: sortedDocs.map(doc => ({
        id: doc!.id,
        url: doc!.url,
        alt: doc!.alt,
        filename: doc!.filename,
        mimeType: doc!.mimeType,
      }))
    };

    console.log('[Media GET] Returning response:', {
      count: responseData.docs.length,
      expected: ids.length,
    });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("[Media GET] Unexpected error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Fetch failed"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadSingleton();
    const headers = await getHeaders();

    // Check authentication
    const session = await payload.auth({ headers });
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Check if this is a query request (has query params but no file)
    const { searchParams } = new URL(request.url);
    const hasQueryParams = searchParams.has("depth") || searchParams.has("where") ||
      Array.from(formData.keys()).some(key => key.startsWith("where"));

    // If this is a query request (Payload admin searching for media), redirect to Payload's API
    if (hasQueryParams && !file) {

      // Extract query parameters from FormData
      const where = formData.get("where") as string | null;
      const depth = formData.get("depth") as string | null;
      const limit = formData.get("limit") as string | null;

      // Build where clause from FormData entries
      const whereClause: any = {};
      const formDataEntries = Array.from(formData.entries());

      // Parse where[and][0][id][in][0] format
      formDataEntries.forEach(([key, value]) => {
        if (key.startsWith("where[and][0][id][in]")) {
          if (!whereClause.id) whereClause.id = { in: [] };
          whereClause.id.in.push(value as string);
        }
      });

      // If we have IDs to search for, use our GET logic
      if (whereClause.id?.in?.length > 0) {
        const ids = whereClause.id.in;

        let sortedDocs: any[] = [];

        if (ids.length === 1) {
          try {
            const doc = await payload.findByID({
              collection: "media",
              id: ids[0],
            });
            sortedDocs = [doc];
          } catch (error) {
            console.error('[Media POST Query] findByID failed:', error);
            sortedDocs = [];
          }
        } else {
          const result = await payload.find({
            collection: "media",
            where: {
              id: {
                in: ids,
              },
            },
            limit: ids.length,
            pagination: false,
          });

          sortedDocs = ids
            .map((id: string) => result.docs.find(doc => doc.id === id))
            .filter(Boolean);
        }

        return NextResponse.json({
          docs: sortedDocs.map(doc => ({
            id: doc!.id,
            url: doc!.url,
            alt: doc!.alt,
            filename: doc!.filename,
            mimeType: doc!.mimeType,
            width: doc!.width,
            height: doc!.height,
            filesize: doc!.filesize,
          })),
          totalDocs: sortedDocs.length,
          limit: Number(limit) || sortedDocs.length,
          totalPages: 1,
          page: 1,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
        });
      }

      // Fallback: return empty result
      return NextResponse.json({
        docs: [],
        totalDocs: 0,
        limit: 10,
        totalPages: 0,
        page: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
      });
    }

    // File upload request
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!file.name || file.name === 'undefined' || file.name === 'null') {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const altFromForm = formData.get("alt") as string;

    // Ensure we always have a valid alt text (never empty or null)
    const alt = altFromForm && altFromForm.trim() !== ""
      ? altFromForm.trim()
      : file.name.replace(/\.[^/.]+$/, "") || "Product image";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }

    // Validate video size (60MB limit for 1-minute video)
    if (isVideo && file.size > 60 * 1024 * 1024) {
      return NextResponse.json({
        error: `Video file too large. Maximum size is 60MB (${(file.size / 1024 / 1024).toFixed(1)}MB uploaded). Please compress your video before uploading.`
      }, { status: 400 });
    }

    // Convert File to Buffer for Payload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create media record in Payload
    const media = await payload.create({
      collection: "media",
      data: {
        alt,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    });

    // Fetch the created media to get the full URL (important for Vercel Blob Storage)
    const fullMedia = await payload.findByID({
      collection: "media",
      id: media.id,
    });

    return NextResponse.json({
      success: true,
      doc: {
        id: fullMedia.id,
        url: fullMedia.url,
        alt: fullMedia.alt,
        filename: fullMedia.filename,
        mimeType: fullMedia.mimeType,
      }
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Upload failed"
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayloadSingleton();
    const headers = await getHeaders();

    // Check authentication
    const session = await payload.auth({ headers });

    // Diagnostic logging for session
    console.log('[Media DELETE] Session:', {
      hasUser: !!session.user,
      userId: session.user?.id,
      userRoles: session.user?.roles,
    });

    if (!session.user) {
      console.error('[Media DELETE] Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ID from query params only (DELETE shouldn't use request body)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || id.trim() === '') {
      console.error('[Media DELETE] No ID provided');
      return NextResponse.json({
        error: "Media ID required",
        received: id
      }, { status: 400 });
    }

    const cleanId = id.trim();
    console.log('[Media DELETE] Attempting to delete ID:', cleanId);

    // Verify media exists and user has access
    try {
      const media = await payload.findByID({
        collection: "media",
        id: cleanId,
        overrideAccess: true, // Bypass access control - we already verified auth
      });

      console.log('[Media DELETE] Found media:', {
        id: media.id,
        filename: media.filename,
      });
    } catch (findError) {
      console.error('[Media DELETE] Media not found:', cleanId, findError);
      return NextResponse.json({
        error: "Media not found",
        id: cleanId
      }, { status: 404 });
    }

    // Delete the media using Payload's local API
    console.log('[Media DELETE] Executing delete...');

    await payload.delete({
      collection: "media",
      id: cleanId,
      overrideAccess: true, // Bypass access control - we already verified auth
    });

    console.log('[Media DELETE] Delete successful:', cleanId);

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
      id: cleanId
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Media DELETE] Unexpected error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Delete failed",
    }, { status: 500 });
  }
}
