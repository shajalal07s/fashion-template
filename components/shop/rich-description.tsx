import { cn } from "@/lib/utils";

export function isHtmlDescription(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function plainDescription(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const RICH_STYLES =
  "leading-relaxed [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-heading [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_a]:text-secondary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5";

export function RichDescription({ html, className }: { html: string; className?: string }) {
  return (
    <div className={cn(RICH_STYLES, className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
