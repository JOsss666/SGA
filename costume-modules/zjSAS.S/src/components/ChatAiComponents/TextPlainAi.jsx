import './TextPlainAi.css'

export function TextPlainAi({text,children}){
    return(
        <p className="TextPlainAI">
            {text}
            {children}
        </p>
    )
}