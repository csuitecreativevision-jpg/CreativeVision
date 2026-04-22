import React from 'react';

/** Tags we allow in instruction HTML (assign project / deployment / contentEditable). */
const INSTRUCTION_ALLOWED_TAGS = new Set([
    'P', 'BR', 'B', 'I', 'U', 'STRONG', 'EM', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'DIV', 'SPAN', 'A',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'CODE', 'PRE', 'HR',
]);

/**
 * Remove scripts/iframes and unwrap unknown tags. Strip dangerous attributes.
 * Used before rendering or converting to plain text.
 */
export function sanitizeInstructionHtml(html: string): string {
    if (!html?.trim()) return '';
    const doc = new DOMParser().parseFromString(`<div class="ins-wrap-root">${html}</div>`, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return '';

    root
        .querySelectorAll('script,style,iframe,object,embed,form,button,textarea,select,meta,link,svg,math')
        .forEach(el => el.remove());

    let safety = 0;
    for (;;) {
        const bad = Array.from(root.querySelectorAll('*')).find(
            el => el !== root && !INSTRUCTION_ALLOWED_TAGS.has(el.tagName)
        ) as Element | undefined;
        if (!bad) break;
        if (safety++ > 3000) break;
        const parent = bad.parentNode;
        if (parent) {
            while (bad.firstChild) parent.insertBefore(bad.firstChild, bad);
            bad.remove();
        } else {
            bad.remove();
        }
    }

    for (const el of Array.from(root.querySelectorAll('*'))) {
        for (const a of Array.from(el.attributes)) {
            const n = a.name.toLowerCase();
            if (n.startsWith('on') || n === 'style') {
                el.removeAttribute(a.name);
            } else if (el.tagName === 'A') {
                if (n === 'href' && !/^https?:\/\//i.test(a.value)) {
                    el.removeAttribute('href');
                }
            } else if (n === 'href' || n === 'src') {
                el.removeAttribute(n);
            } else if (n === 'class' && el.tagName !== 'A') {
                el.removeAttribute('class');
            }
        }
        if (el.tagName === 'A' && el.hasAttribute('href')) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        }
    }

    return root.innerHTML;
}

/** True when stored content is rich HTML (from RichTextEditor or similar), not plain text. */
function looksLikeInstructionHtml(text: string): boolean {
    return /<(p|br|div|ul|ol|li|b|i|u|strong|em|a|span|h[1-6]|blockquote|s|strike|code|pre)\b/i.test(text);
}

/** Match http(s) URLs in plain text (conservative end — trim punctuation in safeHref). */
const URL_SPLIT_RE = /(https?:\/\/[^\s<]+)/gi;

function safeHref(raw: string): string | null {
    const trimmed = raw.replace(/[)\].,;:!?]+$/g, '');
    try {
        const u = new URL(trimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        return u.href;
    } catch {
        return null;
    }
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Strip to plain text for copy / search: preserves line breaks and list structure
 * more readably than raw textContent on full document.
 */
export function stripHtmlToPlainText(html: string): string {
    if (!html) return '';
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;
    const clean = sanitizeInstructionHtml(linkifyBareUrlsInHtml(html));
    const div = document.createElement('div');
    div.innerHTML = clean;
    return (div.innerText || div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Paste helper: plain text with URLs → safe HTML with <a> tags. */
export function linkifyPlainTextPasteToHtml(plain: string): string {
    if (!plain) return '';
    const parts = plain.split(URL_SPLIT_RE);
    let out = '';
    for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        if (!seg) continue;
        if (/^https?:\/\//i.test(seg)) {
            const href = safeHref(seg);
            if (href) {
                out += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(seg)}</a>`;
            } else {
                out += escapeHtml(seg);
            }
        } else {
            out += escapeHtml(seg);
        }
    }
    return out;
}

const URL_FIND_RE = /https?:\/\/[^\s<>"]+/gi;

/** Wrap bare http(s) in existing rich-text HTML (skips text inside <a>). */
export function linkifyBareUrlsInHtml(html: string): string {
    if (!html || !html.includes('http')) return html;
    const div = document.createElement('div');
    div.innerHTML = html;

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null);
    let n: Node | null;
    while ((n = walker.nextNode())) {
        let p: HTMLElement | null = n.parentElement;
        let skip = false;
        while (p && p !== div) {
            const tag = p.nodeName;
            if (tag === 'A' || tag === 'SCRIPT' || tag === 'STYLE') {
                skip = true;
                break;
            }
            p = p.parentElement;
        }
        if (!skip) textNodes.push(n as Text);
    }

    for (const tn of textNodes) {
        const t = tn.textContent || '';
        if (!t.includes('http')) continue;
        URL_FIND_RE.lastIndex = 0;
        if (!URL_FIND_RE.test(t)) continue;
        URL_FIND_RE.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = URL_FIND_RE.exec(t)) !== null) {
            const start = m.index;
            const url = m[0];
            const end = start + url.length;
            if (start > last) frag.appendChild(document.createTextNode(t.slice(last, start)));
            const href = safeHref(url);
            if (href) {
                const a = document.createElement('a');
                a.href = href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = url;
                a.className = 'text-violet-400 underline hover:text-violet-300 break-all';
                frag.appendChild(a);
            } else {
                frag.appendChild(document.createTextNode(url));
            }
            last = end;
        }
        if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
        tn.parentNode?.replaceChild(frag, tn);
    }

    return div.innerHTML;
}

const linkClass = 'text-violet-400 underline hover:text-violet-300 break-all';

const instructionHtmlProseClass =
    'max-w-none text-white/85 [overflow-wrap:anywhere] select-text ' +
    '[&_a]:text-violet-400 [&_a]:underline [&_a:hover]:text-violet-300 [&_a]:break-all ' +
    '[&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0 ' +
    '[&_ul]:my-1.5 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:pl-1 ' +
    '[&_ol]:my-1.5 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:pl-1 ' +
    '[&_li]:my-0.5 ' +
    '[&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 ' +
    '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 ' +
    '[&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:my-2 ' +
    '[&_code]:text-violet-200/90 [&_code]:text-[0.9em] ' +
    '[&_pre]:whitespace-pre-wrap [&_pre]:text-xs [&_pre]:my-2 ';

/**
 * Read-only: render rich HTML (from Assign Project) with lists / breaks preserved;
 * fall back to URL-linkified plain text for legacy notes.
 */
export function LinkifiedInstructionBody({ text, className }: { text: string; className?: string }) {
    if (looksLikeInstructionHtml(text)) {
        let s = text;
        if (s.includes('http')) s = linkifyBareUrlsInHtml(s);
        const clean = sanitizeInstructionHtml(s);
        if (clean.trim()) {
            return (
                <div
                    className={`${instructionHtmlProseClass} ${className || ''}`}
                    dangerouslySetInnerHTML={{ __html: clean }}
                />
            );
        }
    }

    const plain = stripHtmlToPlainText(text);
    const segments = plain.split(URL_SPLIT_RE);
    return (
        <div className={className}>
            {segments.map((seg, i) => {
                if (!seg) return null;
                if (/^https?:\/\//i.test(seg)) {
                    const href = safeHref(seg);
                    if (href) {
                        return (
                            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                {seg}
                            </a>
                        );
                    }
                }
                return <span key={i}>{seg}</span>;
            })}
        </div>
    );
}
