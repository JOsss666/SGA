import './CapsuleButtonAi.css';

export function CapsuleButtonAi({
    onClick,
    title,
    children,
    className = '',
    type = 'button',
    ...buttonProps
}) {
    return (
        <button
        onClick={onClick}
        title={title}
            className={`CapsuleButtonAi ${className}`.trim()}
            type={type}
            {...buttonProps}
        >
            <span className="CapsuleButtonAiContent">{children}</span>
        </button>
    );
}
