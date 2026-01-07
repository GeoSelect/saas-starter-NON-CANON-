import { NextRequest, NextResponse } from 'next/server';
import { recordHoaPacketDownload } from '@/lib/hoa-packet';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Download HOA Packet PDF
 * In production, this would:
 * 1. Generate a PDF with HOA documents
 * 2. Include property data from Esri
 * 3. Generate flood zone/risk data
 * 4. Package and stream as download
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const parcelId = searchParams.get('parcelId');

    if (!sessionId || !parcelId) {
      return NextResponse.json(
        { error: 'Missing sessionId or parcelId' },
        { status: 400 }
      );
    }

    // Verify purchase exists and is completed
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

    const { data: purchase, error } = await supabase
      .from('hoa_packet_purchases')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('parcel_id', parcelId)
      .eq('status', 'completed')
      .single();

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found or not completed' },
        { status: 404 }
      );
    }

    // Record download event
    await recordHoaPacketDownload(purchase.id);

    // TODO: In production, generate actual PDF
    // For now, return mock PDF content
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
(Property: ${purchase.property_address}) Tj
0 -20 Td
(Parcel ID: ${purchase.parcel_id}) Tj
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

    return new NextResponse(mockPdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="HOA-Packet-${parcelId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Download failed',
      },
      { status: 500 }
    );
  }
}
