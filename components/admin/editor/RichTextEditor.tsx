"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  RemoveFormatting,
  Strikethrough,
  Table,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center border transition-colors",
        active
          ? "border-secondary bg-secondary text-white"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: RichTextEditorProps) {
  const t = useTranslations("Dashboard.admin");
  const ref = useRef<HTMLDivElement>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [tablePicker, setTablePicker] = useState(false);
  const [pickSize, setPickSize] = useState({ rows: 3, cols: 3 });
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("p");

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshState = () => {
    try {
      const fmt = document.queryCommandValue("formatBlock").toLowerCase();
      setBlock(fmt === "h2" ? "h2" : fmt === "h3" ? "h3" : "p");
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
      });
    } catch {
      /* noop */
    }
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
    refreshState();
  };

  const applyLink = () => {
    if (!linkUrl.trim()) {
      setLinkMode(false);
      return;
    }
    exec("createLink", linkUrl.trim());
    setLinkUrl("");
    setLinkMode(false);
  };

  const cellStyle = "border:1px solid #f0e6d6;padding:6px 10px;";
  const insertTable = (rows: number, cols: number) => {
    const r = Math.max(1, Math.min(8, rows));
    const c = Math.max(1, Math.min(8, cols));
    const th = () => `<th style="${cellStyle}background:#fff2e6;text-align:left;"><br></th>`;
    const td = () => `<td style="${cellStyle}"><br></td>`;
    const headCells = Array.from({ length: c }, () => th()).join("");
    const bodyRow = `<tr>${Array.from({ length: c }, () => td()).join("")}</tr>`;
    const bodyRows = Array.from({ length: Math.max(0, r - 1) }, () => bodyRow).join("");
    const html =
      `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:14px;">` +
      `<thead><tr>${headCells}</tr></thead>` +
      `<tbody>${bodyRows}</tbody></table><p><br></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(ref.current?.innerHTML ?? "");
    refreshState();
    setTablePicker(false);
  };

  const placeCaret = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    ref.current?.focus();
    refreshState();
  };

  const handleTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    let node: Node | null = sel.anchorNode;
    let cell: HTMLTableCellElement | null = null;
    let table: HTMLTableElement | null = null;
    while (node && node !== ref.current) {
      if (node instanceof HTMLElement) {
        if ((node.tagName === "TD" || node.tagName === "TH") && !cell) {
          cell = node as HTMLTableCellElement;
        }
        if (node.tagName === "TABLE" && !table) {
          table = node as HTMLTableElement;
        }
      }
      node = node.parentNode;
    }
    if (!cell || !table) return;
    e.preventDefault();
    const cells = [...table.querySelectorAll("th, td")];
    const idx = cells.indexOf(cell);
    const dir = e.shiftKey ? -1 : 1;
    const nextIdx = idx + dir;
    if (nextIdx >= cells.length) {
      const colCount = table.rows[0]?.cells.length ?? 1;
      const tbody = table.tBodies[0] ?? table.createTBody();
      const tr = document.createElement("tr");
      for (let i = 0; i < colCount; i++) {
        const td = document.createElement("td");
        td.setAttribute("style", "border:1px solid #f0e6d6;padding:6px 10px;");
        td.appendChild(document.createElement("br"));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
      onChange(ref.current?.innerHTML ?? "");
      placeCaret([...table.querySelectorAll("th, td")].slice(-colCount)[0]);
      return;
    }
    placeCaret(cells[Math.max(0, nextIdx)]);
  };

  const deleteTable = () => {
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    while (node && node !== ref.current) {
      if (node instanceof HTMLElement && node.tagName === "TABLE") {
        node.remove();
        onChange(ref.current?.innerHTML ?? "");
        refreshState();
        return;
      }
      node = node.parentNode;
    }
  };

  const isActive = (key: string) => !!active[key];
  const isBlock = (tag: string) => block === tag;

  return (
    <div className="flex flex-col border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
        <ToolButton label={t("editor.bold")} active={isActive("bold")} onClick={() => exec("bold")}>
          <Bold className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.italic")} active={isActive("italic")} onClick={() => exec("italic")}>
          <Italic className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.underline")} active={isActive("underline")} onClick={() => exec("underline")}>
          <Underline className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.strike")} active={isActive("strikeThrough")} onClick={() => exec("strikeThrough")}>
          <Strikethrough className="size-4" aria-hidden="true" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label={t("editor.h2")} active={isBlock("h2")} onClick={() => exec("formatBlock", "h2")}>
          <Heading2 className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.h3")} active={isBlock("h3")} onClick={() => exec("formatBlock", "h3")}>
          <Heading3 className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.paragraph")} active={isBlock("p")} onClick={() => exec("formatBlock", "p")}>
          <Pilcrow className="size-4" aria-hidden="true" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label={t("editor.bullets")} active={isActive("insertUnorderedList")} onClick={() => exec("insertUnorderedList")}>
          <List className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.numbers")} active={isActive("insertOrderedList")} onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="size-4" aria-hidden="true" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label={t("editor.alignLeft")} active={false} onClick={() => exec("justifyLeft")}>
          <AlignLeft className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.alignCenter")} active={isActive("justifyCenter")} onClick={() => exec("justifyCenter")}>
          <AlignCenter className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.alignRight")} active={isActive("justifyRight")} onClick={() => exec("justifyRight")}>
          <AlignRight className="size-4" aria-hidden="true" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label={t("editor.link")} active={linkMode} onClick={() => setLinkMode((v) => !v)}>
          <Link2 className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.clear")} active={false} onClick={() => exec("removeFormat")}>
          <RemoveFormatting className="size-4" aria-hidden="true" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label={t("editor.table")} active={tablePicker} onClick={() => { setTablePicker((v) => !v); setLinkMode(false); }}>
          <Table className="size-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label={t("editor.deleteTable")} active={false} onClick={deleteTable}>
          <Trash2 className="size-4" aria-hidden="true" />
        </ToolButton>
      </div>

      {tablePicker ? (
        <div className="flex items-center gap-3 border-b border-border p-2">
          <div
            className="grid shrink-0"
            style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}
            role="group"
            aria-label={t("editor.tablePick")}
          >
            {Array.from({ length: 64 }, (_, i) => {
              const r = Math.floor(i / 8) + 1;
              const c = (i % 8) + 1;
              const lit = r <= pickSize.rows && c <= pickSize.cols;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setPickSize({ rows: r, cols: c })}
                  onFocus={() => setPickSize({ rows: r, cols: c })}
                  onClick={() => insertTable(r, c)}
                  aria-label={`${r} x ${c}`}
                  className={`size-4 border transition-colors ${
                    lit ? "border-secondary bg-secondary/60" : "border-border bg-card hover:bg-muted"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-bold text-secondary">
              {pickSize.rows} × {pickSize.cols}
            </span>
            <span className="text-[11px] text-muted-foreground">{t("editor.tablePick")}</span>
          </div>
        </div>
      ) : null}

      {linkMode ? (
        <div className="flex items-center gap-2 border-b border-border p-1.5">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            className="h-8 bg-card font-mono text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <Button size="sm" className="h-8 shrink-0" onClick={applyLink}>
            {t("editor.applyLink")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0"
            onClick={() => {
              setLinkMode(false);
              setLinkUrl("");
            }}
            aria-label={t("editor.cancelLink")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder ?? ""}
        onInput={() => {
          onChange(ref.current?.innerHTML ?? "");
          refreshState();
        }}
        onKeyDown={handleTab}
        onMouseUp={refreshState}
        onKeyUp={refreshState}
        className="px-3 py-2 text-sm leading-relaxed outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-secondary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:bg-white [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-[#1a0d00] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-[#1a0d00]"
        style={{ minHeight }}
      />
    </div>
  );
}
