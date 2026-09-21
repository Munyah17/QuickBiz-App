import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import { getOrgSettings } from "@/services/org";

export interface DocumentBranding {
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  bankDetails: string | null;
  terms: string | null;
  footerNote: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Branding + legal details shared by every printable document. */
export async function getDocumentBranding(supabase: SupabaseClient, orgId: string): Promise<DocumentBranding> {
  const s = await getOrgSettings(supabase, orgId);
  return {
    logoUrl: str(s["branding.logo_url"]),
    address: str(s["contact.address"]),
    phone: str(s["contact.phone"]),
    email: str(s["contact.email"]),
    website: str(s["contact.website"]),
    taxNumber: str(s["branding.tax_number"]),
    bankDetails: str(s["branding.bank_details"]),
    terms: str(s["branding.terms"]),
    footerNote: str(s["invoice.footer"]),
  };
}

/** Company letterhead block: logo (or name fallback) + contact details. */
export function Letterhead({
  orgName,
  branding,
  accent,
}: {
  orgName: string;
  branding: DocumentBranding;
  accent: string;
}) {
  const contact = [branding.phone, branding.email, branding.website].filter(Boolean).join("  ·  ");
  return (
    <div>
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- print doc, plain img is fine
        <img src={branding.logoUrl} alt={orgName} className="h-14 w-auto object-contain" />
      ) : (
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
          {orgName}
        </h1>
      )}
      {branding.logoUrl && (
        <p className="mt-1 text-lg font-semibold" style={{ color: accent }}>
          {orgName}
        </p>
      )}
      {branding.address && (
        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-500">{branding.address}</p>
      )}
      {contact && <p className="mt-0.5 text-xs text-slate-500">{contact}</p>}
      {branding.taxNumber && <p className="mt-0.5 text-xs text-slate-500">VAT / Tax No: {branding.taxNumber}</p>}
    </div>
  );
}

/** Banking details + Ts&Cs + footer note block for the bottom of documents. */
export function DocumentFooter({
  branding,
  orgName,
  docRef,
  currency,
}: {
  branding: DocumentBranding;
  orgName: string;
  docRef: string;
  currency: string;
}) {
  return (
    <>
      {(branding.bankDetails || branding.terms) && (
        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 sm:grid-cols-2">
          {branding.bankDetails && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Banking details</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{branding.bankDetails}</p>
            </div>
          )}
          {branding.terms && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Terms &amp; conditions</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{branding.terms}</p>
            </div>
          )}
        </div>
      )}
      {branding.footerNote && <p className="mt-6 text-center text-xs italic text-slate-500">{branding.footerNote}</p>}
      <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        {orgName} · {docRef} · {currency}
      </p>
    </>
  );
}
