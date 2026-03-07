import './BlueRoundButton.css'

export function BlueRoundButton({title,action}) {
    return(
        <button className="BlueRoundButton" onClick={action}>{title}</button>
    )
}