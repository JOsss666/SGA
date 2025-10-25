
import './FormButton.css'

export function FormButton({disabled,text,children,onClick,loading,negative}){
    return(
        <button disabled={disabled} className={`FormButton ${negative? "negativeButton":""}`} onClick={onClick}>
            {text}
            {!loading && children}
            {loading && (
                <i className="fa-solid fa-spinner fa-spin"></i>
            )}
        </button>

    )
}