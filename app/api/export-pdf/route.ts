import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(req: NextRequest) {
	const parcel = await req.json();

	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595, 842]); // A4 size

	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const { width, height } = page.getSize();

	page.drawText('Parcel Snapshot', {
		x: 50,
		y: height - 50,
		size: 24,
		font,
		color: rgb(0, 0.53, 0.71),
	});

	page.drawText(`Address: ${parcel.address || ''}`, { x: 50, y: height - 100, size: 16, font });
	page.drawText(`APN: ${parcel.apn || ''}`, { x: 50, y: height - 130, size: 16, font });
	// Add more fields as needed

	const pdfBytes = await pdfDoc.save();

	return new NextResponse(pdfBytes, {
		status: 200,
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'attachment; filename="parcel-snapshot.pdf"',
		},
	});
}
