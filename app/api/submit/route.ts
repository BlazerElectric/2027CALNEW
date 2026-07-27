import { NextRequest, NextResponse } from "next/server";
import { claimPackage, PACKAGES, type PackageId } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

interface SubmitBody {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  packageId: string;
}

const VALID_PACKAGE_IDS = new Set<string>(PACKAGES.map((p) => p.id));

export async function POST(req: NextRequest) {
  let body: SubmitBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Validation ---
  const { companyName, contactName, email, phone, packageId } = body;

  if (!companyName?.trim()) {
    return NextResponse.json(
      { error: "Company name is required" },
      { status: 400 }
    );
  }
  if (!contactName?.trim()) {
    return NextResponse.json(
      { error: "Contact name is required" },
      { status: 400 }
    );
  }
  if (!email?.trim()) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 }
    );
  }
  // Use a structural check instead of a backtracking regex to avoid ReDoS
  if (!isBasicEmailShape(email.trim())) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 }
    );
  }
  if (!packageId || !VALID_PACKAGE_IDS.has(packageId)) {
    return NextResponse.json(
      { error: "A valid sponsorship package must be selected" },
      { status: 400 }
    );
  }

  const submission = {
    companyName: companyName.trim(),
    contactName: contactName.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    packageId: packageId as PackageId,
    submittedAt: new Date().toISOString(),
  };

  // --- Atomic claim (race-condition-safe via SQLite PRIMARY KEY) ---
  const claimed = claimPackage(submission);

  if (!claimed) {
    return NextResponse.json(
      {
        error:
          "That sponsorship spot was just claimed by another vendor. Please choose a different package.",
      },
      { status: 409 }
    );
  }

  // --- Send email notification (non-blocking failure) ---
  try {
    await sendConfirmationEmail(submission);
  } catch (emailErr) {
    // Log but don't fail the request if email delivery fails
    console.error("[api/submit] Email notification failed:", emailErr);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

/**
 * Basic structural email check that avoids catastrophic backtracking (ReDoS).
 * Ensures the address has exactly one "@" with at least one character before it,
 * a domain part, and a TLD with at least one character after the final dot.
 */
function isBasicEmailShape(email: string): boolean {
  const atIdx = email.indexOf("@");
  // Must have "@" that is neither the first nor last character
  if (atIdx < 1 || atIdx === email.length - 1) return false;
  // Must not have a second "@"
  if (email.indexOf("@", atIdx + 1) !== -1) return false;
  // Domain part must contain a "." that is not at the very start or end
  const domain = email.slice(atIdx + 1);
  const dotIdx = domain.lastIndexOf(".");
  return dotIdx > 0 && dotIdx < domain.length - 1;
}
