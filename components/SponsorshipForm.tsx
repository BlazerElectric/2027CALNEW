"use client";

import { useEffect, useState } from "react";

interface Package {
  id: string;
  label: string;
  price: number;
  popular: boolean;
}

const PACKAGES: Package[] = [
  { id: "three-month-view", label: "3-Month View Calendar", price: 3000, popular: true },
  { id: "desk-pad", label: "Desk Pad Calendar", price: 2000, popular: false },
  { id: "wall-muscle-car", label: "1-Month Wall Calendar: Muscle Car Theme", price: 1000, popular: false },
  { id: "wall-wildlife", label: "1-Month Wall Calendar: Wildlife Theme", price: 1000, popular: false },
  { id: "wall-golf", label: "1-Month Wall Calendar: Golf Theme", price: 1000, popular: false },
];

type FormStatus = "idle" | "loading" | "success" | "error";

export default function SponsorshipForm() {
  const [claimedSpots, setClaimedSpots] = useState<string[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);

  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState("");

  // Form submission state
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch claimed spots on mount
  useEffect(() => {
    async function fetchSpots() {
      try {
        const res = await fetch("/api/spots", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setClaimedSpots(data.claimed ?? []);
        }
      } catch {
        // Non-fatal: continue without claimed data
      } finally {
        setSpotsLoading(false);
      }
    }
    fetchSpots();
  }, []);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!companyName.trim()) errors.companyName = "Company name is required.";
    if (!contactName.trim()) errors.contactName = "Contact person name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = "A valid email address is required.";
    if (!packageId) errors.packageId = "Please select a sponsorship package.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, phone, packageId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Submission failed. Please try again.");
        setStatus("error");
        // If the spot was just claimed, refresh spot list
        if (res.status === 409) {
          const spotsRes = await fetch("/api/spots", { cache: "no-store" });
          if (spotsRes.ok) {
            const spotsData = await spotsRes.json();
            setClaimedSpots(spotsData.claimed ?? []);
          }
        }
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">🎉</div>
        <h2 className="mb-2 text-2xl font-bold text-green-700">
          Spot Claimed!
        </h2>
        <p className="text-green-800">
          Thank you, <strong>{companyName}</strong>. Your 2027 Calendar
          sponsorship spot has been reserved. A confirmation has been sent to
          our team and we will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          2027 Calendar Sponsorship
        </h1>
        <p className="mt-2 text-gray-500">
          Reserve your spot — first come, first served.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
      >
        {/* Company Name */}
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-semibold text-gray-700"
          >
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
            aria-describedby={fieldErrors.companyName ? "err-company" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.companyName
                ? "border-red-400 bg-red-50"
                : "border-gray-300"
            }`}
          />
          {fieldErrors.companyName && (
            <p id="err-company" className="mt-1 text-xs text-red-600">
              {fieldErrors.companyName}
            </p>
          )}
        </div>

        {/* Contact Person Name */}
        <div>
          <label
            htmlFor="contactName"
            className="block text-sm font-semibold text-gray-700"
          >
            Contact Person Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contactName"
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Jane Smith"
            aria-describedby={fieldErrors.contactName ? "err-contact" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.contactName
                ? "border-red-400 bg-red-50"
                : "border-gray-300"
            }`}
          />
          {fieldErrors.contactName && (
            <p id="err-contact" className="mt-1 text-xs text-red-600">
              {fieldErrors.contactName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            aria-describedby={fieldErrors.email ? "err-email" : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.email
                ? "border-red-400 bg-red-50"
                : "border-gray-300"
            }`}
          />
          {fieldErrors.email && (
            <p id="err-email" className="mt-1 text-xs text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700"
          >
            Phone Number{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sponsorship Package */}
        <fieldset>
          <legend className="block text-sm font-semibold text-gray-700">
            Sponsorship Package <span className="text-red-500">*</span>
          </legend>
          {fieldErrors.packageId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.packageId}</p>
          )}
          <div className="mt-3 space-y-3">
            {spotsLoading ? (
              <p className="text-sm text-gray-400">Loading availability…</p>
            ) : (
              PACKAGES.map((pkg) => {
                const isClaimed = claimedSpots.includes(pkg.id);
                const isSelected = packageId === pkg.id;
                return (
                  <label
                    key={pkg.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      isClaimed
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                        : isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      disabled={isClaimed}
                      checked={isSelected}
                      onChange={() => setPackageId(pkg.id)}
                      aria-label={`${pkg.label} – $${pkg.price.toLocaleString()}${isClaimed ? " (Claimed)" : ""}`}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800">
                        {pkg.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-gray-500">
                        ${pkg.price.toLocaleString()}
                        {pkg.popular && (
                          <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            Most Popular
                          </span>
                        )}
                      </span>
                    </div>
                    {isClaimed && (
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                        Claimed
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </fieldset>

        {/* Server-side error */}
        {status === "error" && errorMsg && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <>
              <Spinner />
              Submitting…
            </>
          ) : (
            "Claim My Spot"
          )}
        </button>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
