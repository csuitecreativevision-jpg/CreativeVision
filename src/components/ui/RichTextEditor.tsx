import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';
import { linkifyBareUrlsInHtml, linkifyPlainTextPasteToHtml } from '../../lib/instructionLinkify';
import { usePortalThemeOptional } from '../../contexts/PortalThemeContext';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const theme = usePortalThemeOptional();
    const isDark = theme?.isDark ?? (localStorage.getItem('portal_ui_dark_mode') !== 'false');

    // Sync external value to editor content
    useEffect(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            // Avoid loop and cursor jumping
            if (currentHtml === '<br>' && value === '') return;

            if (value === '' && currentHtml !== '') {
                editorRef.current.innerHTML = '';
            } else if (value !== currentHtml) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html === '<br>' ? '' : html);
        }
    };

    const applyLinkifyToEditor = () => {
        if (!editorRef.current) return;
        const before = editorRef.current.innerHTML;
        const next = linkifyBareUrlsInHtml(before);
        if (next !== before) {
            editorRef.current.innerHTML = next;
            handleInput();
        }
    };

    const execCommand = (command: string, arg: string | undefined = undefined) => {
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            editorRef.current.focus();
        }
        handleInput(); // Update state after command
    };

    const ToolbarButton = ({ icon: Icon, command, active = false }: { icon: any, command: string, active?: boolean }) => (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                execCommand(command);
            }}
            className={`p-2 rounded-lg transition-colors ${
                active
                    ? (isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-200 text-zinc-800')
                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
            }`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className={`
            w-full border rounded-xl overflow-hidden transition-colors flex flex-col
            ${isDark ? 'bg-[#0E0E1A]' : 'bg-white'}
            ${isFocused ? (isDark ? 'border-violet-500' : 'border-zinc-500') : (isDark ? 'border-white/10' : 'border-zinc-200')}
            ${className}
        `}>
            {/* Toolbar */}
            <div className={`flex items-center gap-1 p-2 border-b shrink-0 ${isDark ? 'border-white/5 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                <ToolbarButton icon={Bold} command="bold" />
                <ToolbarButton icon={Italic} command="italic" />
                <ToolbarButton icon={Underline} command="underline" />
                <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-zinc-300'}`} />
                <ToolbarButton icon={List} command="insertUnorderedList" />
                <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
            </div>

            {/* Editor Area */}
            <div className={`relative flex-1 ${isDark ? 'bg-[#0E0E1A]' : 'bg-white'}`}>
                {!value && placeholder && (
                    <div className={`absolute top-4 left-4 pointer-events-none select-none z-10 ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    className={`p-4 min-h-[150px] focus:outline-none max-w-none text-sm relative z-0 [&_a]:underline [&_a]:break-all ${
                        isDark
                            ? 'text-white prose prose-invert [&_a]:text-violet-400 [&_a]:hover:text-violet-300'
                            : 'text-zinc-900 prose [&_a]:text-zinc-700 [&_a]:hover:text-zinc-900'
                    }`}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        applyLinkifyToEditor();
                    }}
                    onPaste={(e) => {
                        const clip = e.clipboardData;
                        if (!clip) return;
                        const html = clip.getData('text/html');
                        const plain = clip.getData('text/plain') || '';
                        if (!html && plain && /https?:\/\//i.test(plain)) {
                            e.preventDefault();
                            const fragment = linkifyPlainTextPasteToHtml(plain);
                            document.execCommand('insertHTML', false, fragment);
                            handleInput();
                        }
                    }}
                />
            </div>
        </div>
    );
}
