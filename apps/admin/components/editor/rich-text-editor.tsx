"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const safeProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-64 rounded-b-md border-x border-b border-zinc-300 bg-white px-4 py-3 text-sm leading-7 outline-none focus:ring-2 focus:ring-emerald-100",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) {
      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  function setLink() {
    if (!editor) {
      return;
    }

    const currentHref = editor.getAttributes("link").href;
    const rawUrl = window.prompt(
      "Link URL",
      typeof currentHref === "string" ? currentHref : "",
    );
    const safeUrl = normalizeSafeUrl(rawUrl);

    if (rawUrl === null) {
      return;
    }

    if (!safeUrl) {
      window.alert("Only http, https, mailto, and tel links are allowed.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: safeUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      })
      .run();
  }

  if (!editor) {
    return (
      <div className="rounded-md border border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t-md border border-zinc-300 bg-zinc-50 p-2">
        <ToolbarButton
          label="Paragraph"
          isActive={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
          disabled={disabled}
        >
          <Pilcrow size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={disabled}
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Strike"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet List"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered List"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Code"
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
        >
          <Code size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
        >
          <Redo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          isActive={editor.isActive("link")}
          onClick={setLink}
          disabled={disabled}
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Remove Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled || !editor.isActive("link")}
        >
          <Unlink size={16} />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-zinc-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-zinc-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-zinc-950 [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:text-zinc-50 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
      />
    </div>
  );
}

function ToolbarButton({
  label,
  isActive = false,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex size-8 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:text-zinc-400 ${
        isActive
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function normalizeSafeUrl(rawUrl: string | null): string | null {
  if (rawUrl === null) {
    return null;
  }

  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  const candidateUrl = /^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const url = new URL(candidateUrl);

    return safeProtocols.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
