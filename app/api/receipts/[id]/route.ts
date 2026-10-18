// app/api/receipts/[id]/route.ts — Receipt fetch + independent verification

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReceipt, signReceipt } from "@/lib/policy/receipt";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: row, error } = await supabase.from("receipts").select("*").eq("id", id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "not_found", message: "receipt not found" }, { status: 404 });
  }

  const body = row.canonical_body;
  const secret = process.env.POLICY_SIGNING_SECRET ?? "kindred-demo-secret";

  const hashValid = verifyReceipt(body);
  const signatureValid = signReceipt(body, secret) === row.signature;
  const hashMatchesStored = body?.hashes?.receiptHash === row.hash;

  return NextResponse.json({
    receipt: {
      id: row.id,
      mandateId: row.mandate_id,
      orderId: row.order_id,
      hash: row.hash,
      prevHash: row.prev_hash,
      signature: row.signature,
      createdAt: row.created_at,
      body,
    },
    verification: {
      hashValid,
      signatureValid,
      hashMatchesStored,
      verified: hashValid && signatureValid && hashMatchesStored,
    },
  });
}
