import './CapsuleButtonAi.css';

export function CapsuleButtonAi({
    title,
    children,
    className = '',
    type = 'button',
    ...buttonProps
}) {
    return (
        <button
        title={title}
            className={`CapsuleButtonAi ${className}`.trim()}
            type={type}
            {...buttonProps}
        >
            <span className="CapsuleButtonAiContent">{children}</span>
        </button>
    );
}
