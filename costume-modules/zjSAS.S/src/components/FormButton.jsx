
import './FormButton.css'

export function FormButton({disabled,text,children,onClick,loading,negative, className}){
    return(
        <button disabled={disabled} className={`FormButton ${negative? "negativeButton":""} ${className}`} onClick={onClick}>
            {text}
            {!loading && children}
            {loading && (
                <i className="fa-solid fa-spinner fa-spin"></i>
            )}
        </button>

    )
}