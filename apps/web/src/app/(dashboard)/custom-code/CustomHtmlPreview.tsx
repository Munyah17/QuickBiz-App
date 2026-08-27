"use client";

// Genuinely safe regardless of what's pasted in: no `allow-scripts` means
// <script> tags and inline event handlers simply never execute, and no
// `allow-same-origin` means even if something did run, it couldn't read
// this origin's cookies or call the Supabase session. This is what makes
// rendering arbitrary org-supplied HTML honest rather than a fake preview
// or an XSS hole - the sandbox does the enforcing, not string sanitization.
export function CustomHtmlPreview({ content }: { content: string }) {
  return (
    <iframe
      srcDoc={content}
      sandbox="allow-forms"
      title="Custom HTML preview"
      className="h-64 w-full rounded-md border border-border bg-white"
    />
  );
}
