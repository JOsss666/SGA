import './VoiceMessage.css'

const waveBars = [6,11,17,10,15,8,13,18,9,14,7,12,16,10,8,13,6,11];

export function VoiceMessage({duration}){
    return(
        <div className="VoiceMessage">
            <div className="playBtn">
                <i className="fa-solid fa-play"/>
            </div>
            <div className="waveform">
                {waveBars.map((height,index)=>(
                    <span key={index} className="waveBar" style={{height:`${height}px`}}/>
                ))}
            </div>
            <span className="duration">{duration}</span>
        </div>
    )
}
