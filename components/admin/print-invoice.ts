"use client";

function collectPageStyles(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];
      chunks.push(rules.map((rule) => rule.cssText).join("\n"));
    } catch {
      /* cross-origin stylesheets are unreadable – skip */
    }
  }
  return chunks.join("\n");
}

/**
 * Prints the #invoice-print element in an isolated window so dialog
 * transforms, overflow clipping and app chrome can never break output.
 * Falls back to the native dialog when popups are blocked.
 */
export function printInvoiceDoc(title = "Invoice"): void {
  const el = document.getElementById("invoice-print");
  if (!el) {
    window.print();
    return;
  }
  const popup = window.open("", "_blank", "width=960,height=720");
  if (!popup) {
    window.print();
    return;
  }
  const styles = collectPageStyles();
  popup.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>` +
      `<style>${styles}</style>` +
      `<style>@page{size:A4;margin:10mm}html,body{margin:0;padding:0;background:#fff !important}</style>` +
      `</head><body><div id="invoice-print">${el.innerHTML}</div>` +
      `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},350);};</script>` +
      `</body></html>`
  );
  popup.document.close();
}
