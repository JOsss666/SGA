
import './ButtonAccounts.css';


export function ButtonAccounts({icon, text}){
    return(
        <div className="ButtonAccounts">
            <button className="btn btnAccounts" onClick={() => alert('Funcionalidad pendiente')}>
                <i className={icon + " btnIcon"} />
                <p className='btnText'>{text}</p>
            </button>
        </div>
    )
}