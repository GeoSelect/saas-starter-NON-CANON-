import { NextRequest, NextResponse } from 'next/server';
import { assertHoaPacketAccess, recordHoaPacketDownload } from '@/lib/hoa-packet';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/parcel/hoa-packet/download?session_id=cs_test_...
 * 
 * Download HOA Packet PDF
 * 
 * Access control:
 * - Calls assertHoaPacketAccess() to enforce permissions
 * - Throws if user has no access or entitlement is revoked
 * 
 * In production, this would:
 * 1. Generate a PDF with HOA documents
 * 2. Include property data from Esri
 * 3. Generate flood zone/risk data
 * 4. Package and stream as download
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // === Get current user ===
    let userId: string | null = null;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // In middleware
            }
          },
        },
      }
    );

    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        userId = data.user.id;
      }
    } catch (err) {
      // Not authenticated
    }

    // === Query purchase to get parcel_id ===
    const { data: purchase, error: purchaseError } = await supabase
      .from('hoa_packet_purchases')
      .select('id, parcel_ref')
      .eq('stripe_session_id', sessionId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // === Extract parcel_id from normalized parcel_ref ===
    // parcel_ref format: "parcel:40023" or "apn:123|jur:TX"
    let parcelId = '';
    if (purchase.parcel_ref.startsWith('parcel:')) {
      parcelId = purchase.parcel_ref.replace('parcel:', '');
    } else if (purchase.parcel_ref.startsWith('apn:')) {
      // For apn format, use as-is for now
      // In production, would need to resolve to parcel_id
      parcelId = purchase.parcel_ref;
    }

    // === ENFORCE ACCESS CONTROL ===
    // This throws if access is denied
    try {
      await assertHoaPacketAccess({
        user_id: userId,
        parcel_id: parcelId,
      });
    } catch (accessError) {
      const message = accessError instanceof Error ? accessError.message : 'Access denied';
      console.warn(`[/download] Access denied for ${userId || 'guest'}: ${message}`);
      return NextResponse.json(
        { error: message },
        { status: 403 }
      );
    }

    // === Record download event ===
    await recordHoaPacketDownload(purchase.id);

    // === Generate mock PDF for development ===
    // TODO: In production, generate actual PDF from Esri data + templates
    const mockPdfContent = Buffer.from(
      `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 250 >>
stream
BT
/F1 24 Tf
50 700 Td
(HOA PACKET REPORT) Tj
0 -50 Td
/F1 12 Tf
(Property: ${parcelId}) Tj
0 -20 Td
(Downloaded: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(This is a sample HOA packet.) Tj
0 -20 Td
(In production, this would include:) Tj
0 -20 Td
(- HOA bylaws and CC&Rs) Tj
0 -20 Td
(- Meeting minutes and financials) Tj
0 -20 Td
(- Property assessment data) Tj
0 -20 Td
(- Flood zone and risk analysis) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000514 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
593
%%EOF`,
      'utf-8'
    );

    console.log(
      `[/download] ✓ Downloaded packet for parcel ${parcelId} (user: ${userId || 'guest'})`
    );

    return new NextResponse(mockPdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="HOA-Packet-${parcelId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    console.error('[/download] Error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
