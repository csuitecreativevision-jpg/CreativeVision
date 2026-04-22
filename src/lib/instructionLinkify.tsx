import React from 'react';

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

/** Strip tags for read-only instruction views (e.g. modal) while keeping visible text. */
export function stripHtmlToPlainText(html: string): string {
    if (!html) return '';
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').trim();
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

/** Read-only body: URLs become links (HTML input is flattened to text first). */
export function LinkifiedInstructionBody({ text, className }: { text: string; className?: string }) {
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
