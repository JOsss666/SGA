import { useEffect, useImperativeHandle, useRef } from 'react';
import './ChatComposer.css';

const MAX_HEIGHT_VH = 18;

/**
 * Caja de texto del chat: crece con el contenido, envía con Enter y deja
 * saltos de línea con Shift+Enter. Reemplaza al FormInput genérico, que es de
 * una sola línea y lo usa el resto del módulo.
 */
export function ChatComposer({
    value,
    onChange,
    onSubmit,
    disabled,
    placeholder,
    maxLength,
    inputRef
}) {
    const textAreaRef = useRef();

    useImperativeHandle(inputRef, () => ({
        focus: () => textAreaRef.current?.focus()
    }));

    // El alto se recalcula en cada cambio: se colapsa a 'auto' para que
    // scrollHeight refleje el contenido real y no el alto anterior.
    useEffect(() => {
        const node = textAreaRef.current;
        if (!node) return;
        node.style.height = 'auto';
        const maxHeight = (window.innerHeight * MAX_HEIGHT_VH) / 100;
        node.style.height = `${Math.min(node.scrollHeight, maxHeight)}px`;
        node.style.overflowY = node.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [value]);

    const handleKeyDown = event => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        if (disabled || !value.trim()) return;
        onSubmit?.();
    };

    const remaining = maxLength != null ? maxLength - value.length : null;
    const showCounter = remaining != null && remaining <= maxLength * 0.1;

    return (
        <div className="ChatComposer">
            <textarea
                ref={textAreaRef}
                rows={1}
                value={value}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={event => onChange?.(event.target.value)}
                onKeyDown={handleKeyDown}
            />
            {showCounter && (
                <span className={`composerCounter ${remaining <= 0 ? 'composerCounterFull' : ''}`}>
                    {remaining.toLocaleString('es-CO')}
                </span>
            )}
        </div>
    );
}
