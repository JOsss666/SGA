import { MainTitleAi } from '../ChatAiComponents/MainTitleAi';
import { TextPlainAi } from '../ChatAiComponents/TextPlainAi';
import { SubTitleAi } from '../ChatAiComponents/SubTitleAi';
import './TextMessage.css'

export function TextMessage({text,children}){

    function renderChildren(childrenStructure){
        return childrenStructure.map((block,index)=>{
            switch(block.type){
                case "MainTitle":
                    return <MainTitleAi key={index} text={block.content} />
                case "TextPlain":
                    return <TextPlainAi key={index} text={block.content} children={block.children}/>
                case "SubTitle":
                    return <SubTitleAi key={index} text={block.content}/>
            }
        })
    }

    return(
        <div className="TextMessage">
            {text != undefined && (
                <span>{text}</span>
            )}
            {children != undefined && (
                <div className="childrenMess">
                    {renderChildren(children)}
                </div>
            )}
        </div>
    )
}
