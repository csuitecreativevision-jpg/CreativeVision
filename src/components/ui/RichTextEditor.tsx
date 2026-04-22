import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';
import { linkifyBareUrlsInHtml, linkifyPlainTextPasteToHtml } from '../../lib/instructionLinkify';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

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
            className={`p-2 rounded-lg transition-colors ${active
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className={`
            w-full bg-[#0E0E1A] border rounded-xl overflow-hidden transition-colors flex flex-col
            ${isFocused ? 'border-violet-500' : 'border-white/10'}
            ${className}
        `}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/5 shrink-0">
                <ToolbarButton icon={Bold} command="bold" />
                <ToolbarButton icon={Italic} command="italic" />
                <ToolbarButton icon={Underline} command="underline" />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarButton icon={List} command="insertUnorderedList" />
                <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 bg-[#0E0E1A]">
                {!value && placeholder && (
                    <div className="absolute top-4 left-4 text-gray-500 pointer-events-none select-none z-10">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    className="p-4 min-h-[150px] text-white focus:outline-none prose prose-invert max-w-none text-sm relative z-0 [&_a]:text-violet-400 [&_a]:underline [&_a]:hover:text-violet-300 [&_a]:break-all"
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
