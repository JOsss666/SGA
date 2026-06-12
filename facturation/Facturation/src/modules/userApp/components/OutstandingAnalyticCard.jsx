import { BoldTitle } from './BoldTitle'
import './OutstandingAnalyticCard.css'

export function OutstandingAnalyticCard({color,children,icon,title,value,description}){
    if(typeof(value) == 'object'){
        console.log('Err - ',value)
    }
    return(
        <div className="OutstandingAnalyticCard">
            <div className="headCard">
                <div className="iconContainer" style={{
                    color:color,
                    backgroundColor:`${color}40`
                }}>
                    {icon}
                </div>
                <h6>{title}</h6>
            </div>
            {!children && (
                <BoldTitle text={value}/>
            )}
            {children && (
                <div className="chidrenC">
                    {children}
                </div>
            )}
            <span className='descCard'>{description}</span>
        </div>
    )
}