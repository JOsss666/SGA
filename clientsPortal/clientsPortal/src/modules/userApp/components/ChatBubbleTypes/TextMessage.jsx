import { MainTitleAi } from '../ChatAiComponents/MainTitleAi';
import { TextPlainAi } from '../ChatAiComponents/TextPlainAi';
import { SubTitleAi } from '../ChatAiComponents/SubTitleAi';
import { MarkdownMessage } from '../ChatAiComponents/MarkdownMessage';
import './TextMessage.css'

export function TextMessage({text,children,markdown,streaming}){

    function renderChildren(childrenStructure){
        return childrenStructure.map((block,index)=>{
            switch(block.type){
                case "MainTitle":
                    return <MainTitleAi key={index} text={block.content} />
                case "TextPlain":
                    return <TextPlainAi key={index} text={block.content} children={block.children}/>
                case "SubTitle":
                    return <SubTitleAi key={index} text={block.content}/>
                default:
                    return null
            }
        })
    }

    return(
        <div className="TextMessage">
            {/* Solo las respuestas del agente se interpretan como markdown; los
                mensajes entre personas se muestran tal cual los escribieron. */}
            {text != undefined && markdown && (
                <MarkdownMessage text={text} streaming={streaming}/>
            )}
            {text != undefined && !markdown && (
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
