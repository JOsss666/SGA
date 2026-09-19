import './PercentTimeIndicator.css'

export function PercentTimeIndicator({info}){
    return(
        <div className="PercentTimeIndicator">
            <strong className={info.value > 0? 'positive':'negative'}>{info.value>0 ? '+':''}{info.value}%</strong>
            <span>vs el {info.period} anterior</span>
        </div>
    )
}