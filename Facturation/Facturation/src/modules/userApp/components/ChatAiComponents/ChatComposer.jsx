import { useEffect, useImperativeHandle, useRef } from 'react';
import { AttachedCard } from '../AttachedCard';
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
    inputRef,
    attachments = [],
    onRemoveAttachment,
    onKeyDown
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
        if (onKeyDown?.(event)) return;
        if (event.key === 'Backspace' && !value && attachments.length > 0) {
            event.preventDefault();
            onRemoveAttachment?.(attachments[attachments.length - 1].name);
            return;
        }
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        if (disabled || !value.trim()) return;
        onSubmit?.();
    };

    const remaining = maxLength != null ? maxLength - value.length : null;
    const showCounter = remaining != null && remaining <= maxLength * 0.1;
    const imageAttachments = attachments.filter(attachment => attachment.type === 'image');
    const inlineAttachments = attachments.filter(attachment => attachment.type !== 'image');

    return (
        <div className="ChatComposer">
            {imageAttachments.length > 0 && (
                <div className="composerImages" aria-label="Imágenes adjuntas">
                    {imageAttachments.map(attachment => (
                        <AttachedCard
                            info={attachment}
                            deleteAct={onRemoveAttachment}
                            key={attachment.name}
                        />
                    ))}
                </div>
            )}
            <div className="composerInputRow">
                {inlineAttachments.map(attachment => (
                    <span
                        className={`composerAttachment ${attachment.loading ? 'composerAttachmentLoading' : ''}`}
                        key={attachment.name}
                        title={attachment.label || attachment.name}
                    >
                        <i className={`fa-solid ${attachment.icon || 'fa-paperclip'}`} aria-hidden="true"/>
                        <span>{attachment.label || attachment.name}</span>
                        {attachment.loading && <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"/>}
                    </span>
                ))}
                <textarea
                    ref={textAreaRef}
                    rows={1}
                    value={value}
                    disabled={disabled}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    onChange={event => onChange?.(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
            {showCounter && (
                <span className={`composerCounter ${remaining <= 0 ? 'composerCounterFull' : ''}`}>
                    {remaining.toLocaleString('es-CO')}
                </span>
            )}
        </div>
    );
}
