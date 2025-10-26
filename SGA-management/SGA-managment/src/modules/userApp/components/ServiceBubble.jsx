import './ServiceBubble.css'

export function ServiceBubble({imgRef,title}){
    return(
        <div className="ServiceBubble">
            <img src={imgRef} alt="" />
            <span>{title}</span>
        </div>
    )
}