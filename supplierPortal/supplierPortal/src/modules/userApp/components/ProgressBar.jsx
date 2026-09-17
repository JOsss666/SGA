import'./ProgressBar.css'

export function ProgressBar({simple,progress,total,actualVal}){
    return(
        <div className="ProgressBar">
            <div className="totalBar">
                <div className="progressIndicator" style={{
                    width:`${progress}%`
                }}/>
            </div>
            <strong>{progress}%</strong>
        </div>
    )
}