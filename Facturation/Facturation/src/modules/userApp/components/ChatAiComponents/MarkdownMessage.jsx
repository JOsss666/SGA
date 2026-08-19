import { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { copyToClipBoard } from '../../../../utils/functions';
import { stripAgentDebugMarker } from './agentText';
import { ChartMessage } from './ChartMessage';
import { ComponentMessage } from './ComponentMessage';
import './MarkdownMessage.css';

function CodeBlock({ inline, className, children }) {
    const [copied, setCopied] = useState(false);
    const code = String(children ?? '').replace(/\n$/, '');
    const language = /language-(\w+)/.exec(className || '')?.[1];

    if (inline) return <code className="mdInlineCode">{children}</code>;

    // El agente pide una gráfica emitiendo un bloque ```chart con su spec.
    // Mientras el stream no ha cerrado el JSON, parsear falla: se muestra un
    // marcador en lugar del JSON a medio escribir.
    if (language === 'chart' || language === 'component') {
        let spec = null;
        try { spec = JSON.parse(code); } catch { spec = null; }
        if (spec) {
            return language === 'chart'
                ? <ChartMessage spec={spec}/>
                : <ComponentMessage spec={spec}/>;
        }
        return (
            <div className="chartPending">
                <i className="fa-solid fa-spinner"/>
                {language === 'chart' ? 'Preparando gráfica…' : 'Preparando contenido…'}
            </div>
        );
    }

    return (
        <div className="mdCodeBlock">
            <div className="mdCodeHead">
                <span>{language || 'código'}</span>
                <button
                    type="button"
                    onClick={() => {
                        copyToClipBoard(code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                    }}
                >
                    <i className={`fa-regular ${copied ? 'fa-circle-check' : 'fa-copy'}`} />
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            </div>
            <pre><code className={className}>{code}</code></pre>
        </div>
    );
}

const components = {
    code: CodeBlock,
    // Las tablas se desbordan con facilidad: cada una scrollea dentro de su
    // propio contenedor para no romper el ancho del chat.
    table: ({ children }) => (
        <div className="mdTableWrap">
            <table>{children}</table>
        </div>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    )
};

export function MarkdownMessage({ text, streaming }) {
    const clean = useMemo(() => stripAgentDebugMarker(text) || '', [text]);

    return (
        <div className={`MarkdownMessage ${streaming ? 'mdStreaming' : ''}`}>
            <Markdown remarkPlugins={[remarkGfm]} components={components}>
                {clean}
            </Markdown>
            {streaming && <span className="mdCaret" aria-hidden="true" />}
        </div>
    );
}
