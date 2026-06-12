
import './ButtonAccounts.css';


export function ButtonAccounts({icon,children, text}){
    return(
        <button className="ButtonAccounts" onClick={() => alert('Funcionalidad pendiente')}>
            <div className="buttonContent">
                {!children && (
                    <i className={icon + " btnIcon"} />
                )}
                {children}
                <p className='btnText'>{text}</p>
            </div>
        </button>
    )
}