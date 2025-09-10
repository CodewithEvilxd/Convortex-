import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, password, permissions } = await request.json();

    if (!pdfBase64 || !password) {
      return NextResponse.json(
        { error: 'PDF data and password are required' },
        { status: 400 }
      );
    }

    // Convert base64 to Uint8Array
    const pdfBytes = Uint8Array.from(atob(pdfBase64.split(',')[1] || pdfBase64), c => c.charCodeAt(0));

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Set encryption options
    const encryptionOptions = {
      userPassword: password,
      ownerPassword: password, // Same as user password for simplicity
      permissions: {
        printing: permissions?.printing === 'lowResolution' ? 'lowResolution' :
                 permissions?.printing === 'highResolution' ? 'highResolution' :
                 permissions?.printing === false ? false : 'highResolution',
        modifying: permissions?.modifying || false,
        copying: permissions?.copying || false,
        annotating: permissions?.annotating || false,
        fillingForms: permissions?.fillingForms || false,
        contentAccessibility: permissions?.contentAccessibility || false,
        documentAssembly: permissions?.documentAssembly || false,
      },
    };

    // Encrypt the PDF
    const encryptedPdfBytes = await pdfDoc.save({
      ...encryptionOptions,
      useObjectStreams: true,
    });

    // Convert back to base64
    const encryptedPdfBase64 = `data:application/pdf;base64,${Buffer.from(encryptedPdfBytes).toString('base64')}`;

    return NextResponse.json({
      success: true,
      pdf: encryptedPdfBase64,
      message: 'PDF password protection added successfully'
    });

  } catch (error) {
    console.error('Password protection error:', error);
    return NextResponse.json(
      { error: 'Failed to add password protection to PDF' },
      { status: 500 }
    );
  }
}