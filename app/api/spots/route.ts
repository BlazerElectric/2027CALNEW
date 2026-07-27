import { NextResponse } from "next/server";
import { getClaimedPackageIds } from "@/lib/db";

export const runtime = "nodejs";
// Disable caching so every request reflects the live DB state
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const claimed = getClaimedPackageIds();
    return NextResponse.json({ claimed });
  } catch (err) {
    console.error("[api/spots] Error fetching claimed spots:", err);
    return NextResponse.json(
      { error: "Failed to fetch spots" },
      { status: 500 }
    );
  }
}
