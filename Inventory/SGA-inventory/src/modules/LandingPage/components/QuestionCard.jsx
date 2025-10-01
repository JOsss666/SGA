
import { useState } from 'react';
import './QuestionCard.css';

export function QuestionCard({icon, title, question, children}){

    const [visible, setVisible] = useState(false);


    return(
        <div className="QuestionCard">
            <div className="VisibleContent">
                <div className="icon">
                    {icon}
                </div>
                <div className="title">
                    {title} 
                </div>
                <i onClick={()=>{
                    setVisible(!visible)
                }} className={`fa-solid fa-angle-${visible ? "up":"down"} iconDefault`}/>
            </div>
            {visible && (
                <div className="HiddenContent">
                    <p className="QuestionText">{question}</p>
                    <a href="#">{children}</a>
                </div>
            )}
        </div>
    )
}