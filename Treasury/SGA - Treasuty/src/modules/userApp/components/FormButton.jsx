
import './FormButton.css'

export function FormButton({disabled,text,children,onClick,loading,negative, className, type, ariaLabel, ariaExpanded}){
    return(
        <button type={type} aria-label={ariaLabel} aria-expanded={ariaExpanded} disabled={disabled} className={`FormButton ${negative? "negativeButton":""} ${className}`} onClick={onClick}>
            {text}
            {!loading && children}
            {loading && (
                <i className="fa-solid fa-spinner fa-spin"></i>
            )}
        </button>

    )
}
