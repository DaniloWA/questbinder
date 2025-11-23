import React from 'react';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; tooltip: string }> = ({ onClick, children, tooltip }) => (
  <button
    type="button"
    onClick={onClick}
    title={tooltip}
    className="p-2 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
  >
    {children}
  </button>
);

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ textareaRef, value, onChange }) => {
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText;
    if (selectedText) {
      newText = `${value.substring(0, start)}${prefix}${selectedText}${suffix || prefix}${value.substring(end)}`;
    } else {
      newText = `${value.substring(0, start)}${prefix}${suffix || prefix}${value.substring(end)}`;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
    onChange(newText);
  };
  
  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = `${value.substring(0, lineStart)}${prefix} ${value.substring(lineStart)}`;
    onChange(newText);
     setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length + 1, start + prefix.length + 1);
      }, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 bg-zinc-800 border-b border-zinc-700 p-1">
      <ToolbarButton onClick={() => applyFormatting('**')} tooltip="Negrito">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormatting('*')} tooltip="Itálico">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormatting('~~')} tooltip="Tachado">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-zinc-700 mx-1"></div>
      <ToolbarButton onClick={() => applyLinePrefix('#')} tooltip="Título 1">
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyLinePrefix('##')} tooltip="Título 2">
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyLinePrefix('###')} tooltip="Título 3">
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-zinc-700 mx-1"></div>
       <ToolbarButton onClick={() => applyLinePrefix('*')} tooltip="Lista">
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyLinePrefix('1.')} tooltip="Lista Numerada">
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
       <ToolbarButton onClick={() => applyLinePrefix('>')} tooltip="Citação">
        <Quote className="w-4 h-4" />
      </ToolbarButton>
       <div className="w-px h-5 bg-zinc-700 mx-1"></div>
       <ToolbarButton onClick={() => applyFormatting('`')} tooltip="Código">
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormatting('[', '](url)')} tooltip="Link">
        <Link className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};