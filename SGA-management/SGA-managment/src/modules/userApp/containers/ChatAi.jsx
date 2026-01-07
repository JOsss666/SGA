
import { useEffect, useRef, useState } from 'react'
import { ButtonMenu } from '../components/ButtonMenu'
import { InputBarChat } from '../components/InputBarChat'
import './ChatAi.css'
import { DespleList } from '../components/DespleList';
import { CardTitleLogo } from '../components/CardTitleLogo';
import {getAttached, postInfo} from '../../../utils/functions'
import { useAiAssistant, useAppInfo, useNotifications } from '../../../context/context';
import { ChatMessage } from '../components/ChatMessage';
import { BoldTitle } from '../components/BoldTitle';
import { AttachedCard } from '../components/AttachedCard';
import { MainTitleAi } from '../components/ChatAiComponents/MainTitleAi';


export function ChatAi({visible}){
    const {chat,addMessage} = useAiAssistant();
    const {addNotification} = useNotifications();
    const {userInfo,appInfo} = useAppInfo();
    const fileInput = useRef();
    const [visibleAddOptions,setVisibleAddOptions] = useState(false);
    const [disabled,setDisable] = useState(false);
    const {loading,setLoading} = useAiAssistant();
    const [loadingAttached,setLoadingAttached] = useState(false);
    const [attached,setAttached] = useState([]);

    // Search Options
    const [searchVal,setSearchVal] = useState('');

    const loadFiles = (multiple,types)=>{
        if(types != undefined){
            fileInput.current.accept=types
        }
        if(multiple){
            fileInput.current.multiple = true
        }
        fileInput.current.click();
    }

    const sendAiPrompt = async()=>{
        setDisable(true);
        setLoading(true);
        await addMessage({
            text:searchVal,
            user_id:userInfo.user_id,
        })

        let res = await postInfo('/processAiRequest',{
            text:searchVal,
            userInfo,
            attached
        });
        setAttached([]);
        setSearchVal('');
        console.log(res)
        console.log(typeof res)
        if(res.relevant){
            if(res.AI_response[0]){
                addMessage({
                    children:JSON.parse(res.AI_response[1]),
                    user_id:0
                })
            }else{
                addMessage({
                    text:`❌ Error, hubo un problema al intentar procesar tu solicitud, intentalo de nuevo.`,
                    user_id:0,
                    user_name:'Asistente AI'
                })
            }
        }else{
            addMessage({
                text:`❌ "${searchVal}" no es un texto valido para su análisis, por favor ajustalo`,
                user_id:0,
                user_name:'Asistente AI'
            })
        }
        setLoading(false);
        setDisable(false);
    }

    const dictinaryPathType = {
        'reportOPS':'report',
        'reportOCS':'report',
        'reportDCS':'report',
        'reportFVS':'report',
        'reportCIS':'report',
    }

    let chatAppInfo = {
        company_id:appInfo.company_id,
        user_id:appInfo.user_id,
        user_name:appInfo.user_name
    }

    const handleAddAttahced = async(path)=>{
        setVisibleAddOptions(false); 
        setDisable(true)
        const exists = attached.some(el => el.name === path);
        if (!exists) {
            let newAttachedElement = await getAttached(dictinaryPathType[path], path, chatAppInfo);
            setAttached(prev => [
                ...prev,
                { name: path, type: dictinaryPathType[path], content: newAttachedElement }
            ]);
        }
        setDisable(false)
    }

    const deleteAttached = (nameDelete)=>{
        let C = []
        attached.forEach(element => {
            if(element.name != nameDelete){
                C.push(element)
            }
        });
        setAttached(C);
    }

    useEffect(()=>{
        console.log(attached)
    },[attached])

    return(
        <div className={`ChatAi ${visible? 'appearChatAi':'desapearChatAi'}`}>
            <div className="headChat">
                <BoldTitle text={'Asistente AI'}/>
                <span className='modelAi'>
                    <span>OpenAi - GPT-4o-mini</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M260.4 249.8L260.4 201.2C260.4 197.1 261.9 194 265.5 192L363.3 135.7C376.6 128 392.5 124.4 408.9 124.4C470.3 124.4 509.3 172 509.3 222.7C509.3 226.3 509.3 230.4 508.8 234.5L407.3 175.1C401.2 171.5 395 171.5 388.9 175.1L260.4 249.8zM488.7 439.2L488.7 323C488.7 315.8 485.6 310.7 479.5 307.1L351 232.4L393 208.3C396.6 206.3 399.7 206.3 403.2 208.3L501 264.7C529.2 281.1 548.1 315.9 548.1 349.7C548.1 388.6 525.1 424.5 488.7 439.3L488.7 439.3zM230.2 336.8L188.2 312.2C184.6 310.2 183.1 307.1 183.1 303L183.1 190.4C183.1 135.6 225.1 94.1 281.9 94.1C303.4 94.1 323.4 101.3 340.3 114.1L239.4 172.5C233.3 176.1 230.2 181.2 230.2 188.4L230.2 336.9L230.2 336.9zM320.6 389L260.4 355.2L260.4 283.5L320.6 249.7L380.8 283.5L380.8 355.2L320.6 389zM359.3 544.7C337.8 544.7 317.8 537.5 300.9 524.7L401.8 466.3C407.9 462.7 411 457.6 411 450.4L411 301.9L453.5 326.5C457.1 328.5 458.6 331.6 458.6 335.7L458.6 448.3C458.6 503.1 416.1 544.6 359.3 544.6L359.3 544.6zM237.8 430.5L140.1 374.2C111.9 357.8 93 323 93 289.2C93 249.8 116.6 214.4 152.9 199.6L152.9 316.3C152.9 323.5 156 328.6 162.1 332.2L290.1 406.4L248.1 430.5C244.5 432.5 241.4 432.5 237.9 430.5zM232.2 514.5C174.3 514.5 131.8 471 131.8 417.2C131.8 413.1 132.3 409 132.8 404.9L233.7 463.3C239.8 466.9 246 466.9 252.1 463.3L380.6 389.1L380.6 437.7C380.6 441.8 379.1 444.9 375.5 446.9L277.7 503.2C264.4 510.9 248.5 514.5 232.1 514.5L232.1 514.5zM359.2 575.4C421.2 575.4 472.9 531.4 484.6 473C541.9 458.1 578.8 404.4 578.8 349.6C578.8 313.8 563.4 278.9 535.8 253.9C538.4 243.1 539.9 232.4 539.9 221.6C539.9 148.4 480.5 93.6 411.9 93.6C398.1 93.6 384.8 95.6 371.5 100.3C348.5 77.8 316.7 63.4 281.9 63.4C219.9 63.4 168.2 107.4 156.5 165.8C99.2 180.6 62.3 234.4 62.3 289.2C62.3 325 77.7 359.9 105.3 384.9C102.7 395.7 101.2 406.4 101.2 417.2C101.2 490.4 160.6 545.2 229.2 545.2C243 545.2 256.3 543.2 269.6 538.5C292.6 561 324.4 575.4 359.2 575.4z"/></svg>
                </span>
                <ButtonMenu title={'Como usar Asistente AI'}><i className="fa-solid fa-question"/></ButtonMenu>
            </div>
            {chat.length >0 && (
                <div className={`spaceChatAi`}>
                    {chat.map((element,index)=>(
                        <ChatMessage info={element} key={index}/>
                    ))}
                </div>
            )}
            {chat.length == 0 && (
                <div className="noChatIMg">
                    <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1759180939/ChatGPT_Image_29_sept_2025_16_21_31_shjyfv.png" alt="" />
                    <MainTitleAi text={`Hola ${userInfo.user_name}, ¿Listo para empezar?`}/>
                </div>
            )}
            
            <div className={`chatAiInput ${attached.length >0? 'activeAttachedSpace':''}`}>
                <ButtonMenu onClick={()=>{setVisibleAddOptions(!visibleAddOptions)}} noRotate={true} title={'Agregar'}><i className="fa-solid fa-plus"/></ButtonMenu>
                <InputBarChat sendAction={sendAiPrompt} loading={loading} disabled={disabled} value={searchVal} searchAction={setSearchVal} placeholder={'Pregunta lo que necesites'}/>
            </div>
            {visibleAddOptions && (
                <div className="addOptions">
                    <div onClick={()=>{setVisibleAddOptions(false)}} className="closeAddOp">
                        <i className="fa-solid fa-xmark"/>
                    </div>
                    <ul>
                        <CardTitleLogo onClick={()=>{loadFiles(false,"image/*")}} title={'Imágen'}><i className="fa-solid fa-image"/></CardTitleLogo>
                        <CardTitleLogo onClick={()=>{loadFiles(false,".doc,.docx,.xls,.xlsx,.pdf")}} title={'Archivo'}><i className="fa-solid fa-file"/></CardTitleLogo>
                        <CardTitleLogo title={'Carpeta'}><i className="fa-solid fa-folder-open"/></CardTitleLogo>
                        <DespleList children={<i className="fa-solid fa-book"/>} father={{
                            title:'Informes'
                            }} options={[
                                {title:'Documentos reportados',children:<i className="fa-solid fa-book"/>},
                                {title:'Ordenes de producción',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportOps'},
                                {title:'Ordenes de cliente',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportOCS'},
                                {title:'Documentos de compra',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportDCS'},
                                {title:'Facturas de venta',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportFVS'},
                                {title:'Consumos de inventario',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportCIS'},
                                {title:'Volumen ordenes de clientes',children:<i className="fa-solid fa-file-lines"/>},
                        ]}/>
                        <DespleList children={<i className="fa-solid fa-chart-pie"></i>} father={{
                            title:'Estadisticas'
                            }} options={[
                                {title:'Productividad Empresa',children:<i className="fa-solid fa-chart-simple"/>},
                                {title:'Eficiencia Procesos',children:<i className="fa-regular fa-chart-bar"/>},
                                {title:'Estadisticas usuarios',children:<i className="fa-regular fa-chart-bar"/>},
                        ]}/>
                    </ul>
                    <input type="file" hidden ref={fileInput}/>
                </div>
            )}
            {attached.length >0 && (
                <div className="attachedHolder">
                    {attached.map((element,index)=>(
                        <AttachedCard info={element} key={index} deleteAct={deleteAttached}/>
                    ))}
                </div>
            )}
        </div>
    )
}