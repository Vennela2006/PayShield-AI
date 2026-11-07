import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sourceFile =
      typeof body.sourceFile === 'string' ? body.sourceFile.trim() : '';
    const mode =
      typeof body.mode === 'string' ? body.mode.trim() : '';
    const extractedText =
      typeof body.extractedText === 'string' ? body.extractedText : '';
    const extractedFields = body.extractedFields;

    if (!sourceFile || !mode || !extractedFields ||
        typeof extractedFields !== 'object' ||
        Array.isArray(extractedFields)) {
      return NextResponse.json(
        { error: 'Valid evidence metadata and extracted fields are required.' },
        { status: 400 }
      );
    }

    if (sourceFile.length > 255 || mode.length > 50 || extractedText.length > 500000) {
      return NextResponse.json(
        { error: 'Evidence metadata or extracted text exceeds the allowed size.' },
        { status: 413 }
      );
    }

    const id = `EVIDENCE-${randomUUID()}`;

    const result = await db.query(
      `
        INSERT INTO evidence_records (
          id, source_file, mode, extracted_text,
          extracted_fields, reviewed_fields, acknowledged, verified_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NULL, FALSE, NULL)
        RETURNING
          id,
          source_file AS "sourceFile",
          mode,
          created_at AS "createdAt"
      `,
      [
        id,
        sourceFile,
        mode,
        extractedText,
        JSON.stringify(extractedFields),
      ]
    );

    return NextResponse.json(
      { evidence: result.rows[0] },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to save evidence record.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const acknowledged = body.acknowledged;
    const reviewedFields = body.reviewedFields;

    if (!id || typeof acknowledged !== 'boolean') {
      return NextResponse.json(
        { error: 'A valid evidence ID and acknowledgement are required.' },
        { status: 400 }
      );
    }

    if (acknowledged) {
      if (
        !reviewedFields ||
        typeof reviewedFields !== 'object' ||
        Array.isArray(reviewedFields)
      ) {
        return NextResponse.json(
          { error: 'Reviewed fields are required for verification.' },
          { status: 400 }
        );
      }

      const amount = Number(reviewedFields.amount);
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        typeof reviewedFields.transactionId !== 'string' ||
        !reviewedFields.transactionId.trim() ||
        typeof reviewedFields.date !== 'string' ||
        !reviewedFields.date.trim() ||
        typeof reviewedFields.recipient !== 'string' ||
        !reviewedFields.recipient.trim()
      ) {
        return NextResponse.json(
          { error: 'All reviewed transaction fields must be valid.' },
          { status: 400 }
        );
      }
    }

    const result = await db.query(
      `
        UPDATE evidence_records
        SET
          reviewed_fields = $2::jsonb,
          acknowledged = $3,
          verified_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          acknowledged,
          verified_at AS "verifiedAt",
          updated_at AS "updatedAt"
      `,
      [
        id,
        acknowledged ? JSON.stringify(reviewedFields) : null,
        acknowledged,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Evidence record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ evidence: result.rows[0] });
  } catch {
    return NextResponse.json(
      { error: 'Unable to update evidence verification.' },
      { status: 500 }
    );
  }
}
