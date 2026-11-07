import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED'];
const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        id,
        title,
        transaction_ids AS "transactionIds",
        status,
        priority,
        notes,
        created_at AS "createdAt"
      FROM investigation_cases
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ cases: result.rows });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load investigation cases.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === 'string' ? body.title.trim() : '';

    const transactionIds = body.transactionIds;
    const status = body.status ?? 'OPEN';
    const priority = body.priority;
    const notes = body.notes ?? [];

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: 'A valid case title is required (maximum 200 characters).' },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0 ||
      !transactionIds.every(
        (id: unknown) => typeof id === 'string' && id.trim().length > 0
      )
    ) {
      return NextResponse.json(
        { error: 'At least one valid transaction ID is required.' },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid case status.' },
        { status: 400 }
      );
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid case priority.' },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(notes) ||
      !notes.every((note: unknown) => typeof note === 'string')
    ) {
      return NextResponse.json(
        { error: 'Case notes must be an array of strings.' },
        { status: 400 }
      );
    }

    const id = `CASE-${randomUUID()}`;
    const createdAt = new Date().toISOString();

    const result = await db.query(
      `
        INSERT INTO investigation_cases (
          id, title, transaction_ids, status,
          priority, notes, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
        RETURNING
          id,
          title,
          transaction_ids AS "transactionIds",
          status,
          priority,
          notes,
          created_at AS "createdAt"
      `,
      [
        id,
        title,
        transactionIds,
        status,
        priority,
        JSON.stringify(notes),
        createdAt,
      ]
    );

    return NextResponse.json(
      { case: result.rows[0] },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to create investigation case.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json(
        { error: 'A valid case ID is required.' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [id];
    let parameter = 2;

    if (body.status !== undefined) {
      if (
        typeof body.status !== 'string' ||
        !validStatuses.includes(body.status)
      ) {
        return NextResponse.json(
          { error: 'Invalid case status.' },
          { status: 400 }
        );
      }

      updates.push(`status = $${parameter++}`);
      values.push(body.status);
    }

    if (body.note !== undefined) {
      if (
        typeof body.note !== 'string' ||
        !body.note.trim() ||
        body.note.trim().length > 2000
      ) {
        return NextResponse.json(
          { error: 'A valid note is required (maximum 2000 characters).' },
          { status: 400 }
        );
      }

      updates.push(`notes = notes || $${parameter++}::jsonb`);
      values.push(JSON.stringify([body.note.trim()]));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Provide a status or a note to update.' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');

    const result = await db.query(
      `
        UPDATE investigation_cases
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING
          id,
          title,
          transaction_ids AS "transactionIds",
          status,
          priority,
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Investigation case not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ case: result.rows[0] });
  } catch {
    return NextResponse.json(
      { error: 'Unable to update investigation case.' },
      { status: 500 }
    );
  }
}
