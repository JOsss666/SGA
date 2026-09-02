
import { useCallback, useEffect, useRef, useState } from 'react'
import { ButtonMenu } from '../components/ButtonMenu'
import './ChatAi.css'
import { DespleList } from '../components/DespleList';
import { CardTitleLogo } from '../components/CardTitleLogo';
import {getAttached} from '../../../utils/functions'
import { AI_AGENTS, listAgents, streamAgentPrompt, readDocument } from '../../../services/aiPromptService';
import { useAiAssistant, useAppInfo, useNotifications } from '../../../context/context';
import { ChatMessage } from '../components/ChatMessage';
import { BoldTitle } from '../components/BoldTitle';
import { AttachedCard } from '../components/AttachedCard';
import { MainTitleAi } from '../components/ChatAiComponents/MainTitleAi';
import { OptionsChatAi } from '../components/ChatAiComponents/OptionsChatAi';
import { ChatComposer } from '../components/ChatAiComponents/ChatComposer';
import { ToolActivity, TypingIndicator } from '../components/ChatAiComponents/ToolActivity';
import { stripAgentDebugMarker } from '../components/ChatAiComponents/agentText';
import { ChatActionsContext } from '../components/ChatAiComponents/chatActionsContext';

// Debe coincidir con systemAIConfig.maxInputCharacters del backend.
const MAX_PROMPT_CHARACTERS = 12000;
// El backend recorta a maxHistoryMessages; se envía ya acotado para no gastar
// ancho de banda en turnos que se van a descartar.
const MAX_HISTORY_MESSAGES = 12;
const SCROLL_BOTTOM_THRESHOLD = 120;

const SUGGESTIONS = [
    { text: '¿Cuántas facturas de venta van este mes?', icon: 'fa-file-invoice-dollar' },
    { text: 'Resume los documentos de compra del último trimestre', icon: 'fa-cart-shopping' },
    { text: 'Muéstrame el balance de cuentas con saldo', icon: 'fa-scale-balanced' },
    { text: '¿Qué órdenes de producción están abiertas?', icon: 'fa-diagram-project' }
];

const DEFAULT_AGENT_OPTION = {
    text: 'Asistente general SGA',
    value: AI_AGENTS.GENERAL_ASSISTANT,
    children: <i className="fa-solid fa-robot" aria-hidden="true"/>
};

export function ChatAi({visible}){
    const {
        chat,
        addMessage,
        setChat,
        usedTokens,
        setUsedTokens,
        loading,
        setLoading,
        startAiTask,
        updateAiTask,
        completeAiTask,
        failAiTask,
        cancelAiTask
    } = useAiAssistant();
    const {addNotification} = useNotifications();
    const {userInfo,appInfo} = useAppInfo();
    const fileInput = useRef();
    const chatScrollRef = useRef();
    const composerRef = useRef();
    const abortRef = useRef();
    const addNotificationRef = useRef(addNotification);
    const stickToBottomRef = useRef(true);
    const [visibleAddOptions,setVisibleAddOptions] = useState(false);
    const [disabled,setDisable] = useState(false);
    const [attached,setAttached] = useState([]);
    const [toolActivities,setToolActivities] = useState([]);
    const [waitingFirstToken,setWaitingFirstToken] = useState(false);
    const [showScrollDown,setShowScrollDown] = useState(false);
    const [runInfo,setRunInfo] = useState(null);
    const [selectedAgentId,setSelectedAgentId] = useState(AI_AGENTS.GENERAL_ASSISTANT);
    const [agentOptions,setAgentOptions] = useState([DEFAULT_AGENT_OPTION]);
    const [tier,setTier] = useState();

    // Search Options
    const [searchVal,setSearchVal] = useState('');

    useEffect(() => {
        addNotificationRef.current = addNotification;
    }, [addNotification]);

    useEffect(() => {
        if (appInfo.company_id == null) return undefined;

        const controller = new AbortController();

        const loadAvailableAgents = async() => {
            try {
                const agents = await listAgents({
                    companyId: appInfo.company_id,
                    signal: controller.signal
                });
                const options = agents.map(agent => ({
                    text: agent.name,
                    value: agent.id,
                    children: <img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp'/>
                }));

                if (options.length > 0) {
                    setAgentOptions(options);
                    setSelectedAgentId(current => (
                        options.some(option => option.value === current)
                            ? current
                            : options[0].value
                    ));
                }
            } catch (error) {
                if (error?.name === 'AbortError') return;
                addNotificationRef.current?.({
                    title: 'No se pudieron cargar los agentes',
                    type: 'error',
                    description: error.message || 'Se usará el asistente general.'
                });
            }
        };

        loadAvailableAgents();
        return () => controller.abort();
    }, [appInfo.company_id]);

    const loadFiles = (multiple,types)=>{
        if(types != undefined){
            fileInput.current.accept=types
        }
        fileInput.current.multiple = !!multiple;
        fileInput.current.value = '';
        fileInput.current.click();
    }

    const scrollToBottom = useCallback((behavior = 'smooth')=>{
        const node = chatScrollRef.current;
        if(!node) return;
        stickToBottomRef.current = true;
        setShowScrollDown(false);
        node.scrollTo({ top: node.scrollHeight, behavior });
    },[]);

    // Solo se sigue el scroll si el usuario ya estaba abajo: si subió a leer
    // una respuesta anterior, el stream no le arrastra la vista.
    const handleScroll = ()=>{
        const node = chatScrollRef.current;
        if(!node) return;
        const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < SCROLL_BOTTOM_THRESHOLD;
        stickToBottomRef.current = nearBottom;
        setShowScrollDown(!nearBottom);
    }

    const buildHistory = (conversation)=> conversation
        .filter(message => typeof message.text === 'string' && message.text.trim() && !message.error)
        .map(message => ({
            role: message.user_id === 0 ? 'assistant' : 'user',
            content: stripAgentDebugMarker(message.text).trim()
        }))
        .filter(message => message.content)
        .slice(-MAX_HISTORY_MESSAGES);

    const runPrompt = async(prompt, priorChat)=>{
        const trimmed = (prompt || '').trim();
        if (!trimmed || disabled) return;

        const controller = new AbortController();
        abortRef.current = controller;
        setDisable(true);
        startAiTask({
            task:trimmed,
            process:selectedAgentId
        });
        setToolActivities([]);
        setWaitingFirstToken(true);

        const history = buildHistory(priorChat);
        const responseMessageId = `ai-${Date.now()}-${Math.random()}`;
        addMessage({
            message_id: responseMessageId,
            text: '',
            user_id: 0,
            user_name: 'Asistente AI',
            markdown: true,
            streaming: true
        });

        const patchResponse = patch => setChat(previous => previous.map(message =>
            message.message_id === responseMessageId ? { ...message, ...patch } : message
        ));

        try {
            const ready = attached.filter(element => !element.loading);
            const context = ready.length > 0
                ? `\n\nContexto adjunto por el usuario:\n${JSON.stringify(ready)}`
                : '';
            const result = await streamAgentPrompt({
                target: selectedAgentId,
                content: `${trimmed}${context}`,
                history,
                tier,
                companyId: appInfo.company_id,
                signal: controller.signal,
                onDelta: chunk => {
                    setWaitingFirstToken(false);
                    setChat(previous => previous.map(message =>
                        message.message_id === responseMessageId
                            ? { ...message, text: `${message.text || ''}${chunk}` }
                            : message
                    ));
                },
                onTool: ({ name }) => {
                    setWaitingFirstToken(false);
                    updateAiTask({process:name});
                    setToolActivities(previous => [
                        ...previous,
                        { id: `${name}-${previous.length}`, name, status: 'running' }
                    ]);
                },
                onToolResult: ({ name, total_count }) => {
                    updateAiTask({process:selectedAgentId});
                    setToolActivities(previous => {
                        const index = previous.findLastIndex(
                            activity => activity.name === name && activity.status === 'running'
                        );
                        if (index === -1) return previous;
                        const next = [...previous];
                        next[index] = { ...next[index], status: 'done', total_count };
                        return next;
                    });
                }
            });

            if (result?.aborted) {
                patchResponse({ streaming: false, aborted: true });
                cancelAiTask();
                return;
            }

            patchResponse({ streaming: false });
            setRunInfo({
                model: result?.model,
                agent: result?.agent?.name,
                provider: result?.provider
            });
            const spent = Number(result?.usage?.total_tokens);
            if (Number.isFinite(spent) && spent > 0) {
                setUsedTokens(previous => (Number(previous) || 0) + spent);
            }
            completeAiTask(result);
        } catch (error) {
            patchResponse({ streaming: false, error: true });
            failAiTask(error);
            addNotification?.({
                title: 'Error del asistente',
                type: 'error',
                description: error.message || 'Error al consultar el agente de IA.'
            });
        } finally {
            abortRef.current = undefined;
            setWaitingFirstToken(false);
            setLoading(false);
            setDisable(false);
        }
    }

    const sendAiPrompt = async()=>{
        const prompt = searchVal.trim();
        if (!prompt || disabled) return;
        const priorChat = chat;
        addMessage({
            text: prompt,
            user_id: userInfo.user_id,
        });
        setAttached([]);
        setSearchVal('');
        scrollToBottom();
        await runPrompt(prompt, priorChat);
    }

    // Reintentar reutiliza el último mensaje del usuario y descarta la
    // respuesta fallida en lugar de acumular burbujas de error.
    const retryLastPrompt = ()=>{
        const lastUserIndex = chat.findLastIndex(message => message.user_id !== 0);
        if (lastUserIndex === -1) return;
        const prompt = chat[lastUserIndex].text;
        const priorChat = chat.slice(0, lastUserIndex);
        setChat(chat.slice(0, lastUserIndex + 1));
        runPrompt(prompt, priorChat);
    }

    const stopStreaming = ()=>{
        abortRef.current?.abort();
    }

    const handleFilesSelected = async(event)=>{
        const files = [...(event.target.files || [])];
        if (!files.length) return;
        setVisibleAddOptions(false);

        for (const file of files) {
            if (attached.some(element => element.name === file.name)) continue;
            const placeholder = { name: file.name, type: 'document', loading: true };
            setAttached(previous => [...previous, placeholder]);
            try {
                const extraction = await readDocument({ file, companyId: appInfo.company_id });
                setAttached(previous => previous.map(element => element.name === file.name
                    ? { name: file.name, type: 'document', content: extraction?.output ?? null }
                    : element));
            } catch (error) {
                setAttached(previous => previous.filter(element => element.name !== file.name));
                addNotification?.({
                    title: 'No se pudo leer el archivo',
                    type: 'error',
                    description: error.message || `No fue posible procesar ${file.name}.`
                });
            }
        }
        event.target.value = '';
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
        setAttached(previous => previous.filter(element => element.name !== nameDelete));
    }

    useEffect(() => {
        if (!stickToBottomRef.current) return;
        const frame = requestAnimationFrame(() => {
            chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
        });
        return () => cancelAnimationFrame(frame);
    }, [chat]);

    return(
        <div className={`ChatAi ${visible? 'appearChatAi':'desapearChatAi'}`}>
            <div className="headChat">
                <BoldTitle text={'Asistente AI'}/>
                <span className='modelAi'>
                    <span>{runInfo?.model? `${runInfo.agent || 'SGA AI'} · ${runInfo.model}`:'Sin modelo'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M260.4 249.8L260.4 201.2C260.4 197.1 261.9 194 265.5 192L363.3 135.7C376.6 128 392.5 124.4 408.9 124.4C470.3 124.4 509.3 172 509.3 222.7C509.3 226.3 509.3 230.4 508.8 234.5L407.3 175.1C401.2 171.5 395 171.5 388.9 175.1L260.4 249.8zM488.7 439.2L488.7 323C488.7 315.8 485.6 310.7 479.5 307.1L351 232.4L393 208.3C396.6 206.3 399.7 206.3 403.2 208.3L501 264.7C529.2 281.1 548.1 315.9 548.1 349.7C548.1 388.6 525.1 424.5 488.7 439.3L488.7 439.3zM230.2 336.8L188.2 312.2C184.6 310.2 183.1 307.1 183.1 303L183.1 190.4C183.1 135.6 225.1 94.1 281.9 94.1C303.4 94.1 323.4 101.3 340.3 114.1L239.4 172.5C233.3 176.1 230.2 181.2 230.2 188.4L230.2 336.9L230.2 336.9zM320.6 389L260.4 355.2L260.4 283.5L320.6 249.7L380.8 283.5L380.8 355.2L320.6 389zM359.3 544.7C337.8 544.7 317.8 537.5 300.9 524.7L401.8 466.3C407.9 462.7 411 457.6 411 450.4L411 301.9L453.5 326.5C457.1 328.5 458.6 331.6 458.6 335.7L458.6 448.3C458.6 503.1 416.1 544.6 359.3 544.6L359.3 544.6zM237.8 430.5L140.1 374.2C111.9 357.8 93 323 93 289.2C93 249.8 116.6 214.4 152.9 199.6L152.9 316.3C152.9 323.5 156 328.6 162.1 332.2L290.1 406.4L248.1 430.5C244.5 432.5 241.4 432.5 237.9 430.5zM232.2 514.5C174.3 514.5 131.8 471 131.8 417.2C131.8 413.1 132.3 409 132.8 404.9L233.7 463.3C239.8 466.9 246 466.9 252.1 463.3L380.6 389.1L380.6 437.7C380.6 441.8 379.1 444.9 375.5 446.9L277.7 503.2C264.4 510.9 248.5 514.5 232.1 514.5L232.1 514.5zM359.2 575.4C421.2 575.4 472.9 531.4 484.6 473C541.9 458.1 578.8 404.4 578.8 349.6C578.8 313.8 563.4 278.9 535.8 253.9C538.4 243.1 539.9 232.4 539.9 221.6C539.9 148.4 480.5 93.6 411.9 93.6C398.1 93.6 384.8 95.6 371.5 100.3C348.5 77.8 316.7 63.4 281.9 63.4C219.9 63.4 168.2 107.4 156.5 165.8C99.2 180.6 62.3 234.4 62.3 289.2C62.3 325 77.7 359.9 105.3 384.9C102.7 395.7 101.2 406.4 101.2 417.2C101.2 490.4 160.6 545.2 229.2 545.2C243 545.2 256.3 543.2 269.6 538.5C292.6 561 324.4 575.4 359.2 575.4z"/></svg>
                </span>
                {usedTokens > 0 && (
                    <span className='tokensAi' title='Tokens consumidos en esta conversación'>
                        <i className="fa-solid fa-coins"/>{usedTokens.toLocaleString('es-CO')}
                    </span>
                )}
                {chat.length > 0 && (
                    <ButtonMenu onClick={()=>{setChat([]); setRunInfo(null); setToolActivities([]);}} noRotate={true} title={'Nueva conversación'}>
                        <i className="fa-solid fa-pen-to-square"/>
                    </ButtonMenu>
                )}
                <ButtonMenu title={'Como usar Asistente AI'}><i className="fa-solid fa-question"/></ButtonMenu>
            </div>
            {chat.length >0 && (
                <div className="chatScrollArea">
                    <div ref={chatScrollRef} onScroll={handleScroll} className="spaceChatAi">
                    <ChatActionsContext.Provider value={{ fillPrompt: value => {
                        setSearchVal(value);
                        composerRef.current?.focus();
                    } }}>
                        {chat.map((element,index)=>(
                            <ChatMessage
                                info={element}
                                key={element.message_id || index}
                                onRetry={(element.error || element.aborted)? retryLastPrompt:undefined}
                            />
                        ))}
                        {(toolActivities.length > 0 || waitingFirstToken) && (
                            <div className="agentActivity">
                                <ToolActivity activities={toolActivities}/>
                                {waitingFirstToken && <TypingIndicator/>}
                            </div>
                        )}
                    </ChatActionsContext.Provider>
                    </div>
                    {showScrollDown && (
                        <button type="button" className="scrollDownChat" onClick={()=>scrollToBottom()} title="Ir al final">
                            <i className="fa-solid fa-arrow-down"/>
                        </button>
                    )}
                </div>
            )}
            {chat.length == 0 && (
                <div className={`noChatIMg`}>
                    <img src="https://cdnmain.sga360.co/static/ChatGPT_Image_29_sept_2025_16_21_31_shjyfv.webp" alt="" />
                    <div className="mainChatWelcome">
                        <span>😎 Hola {userInfo.user_name}</span>
                        <MainTitleAi text={`¿ Listo para empezar ?`}/>
                        <div className="chatSuggestions">
                            {SUGGESTIONS.map(suggestion => (
                                <button
                                    type="button"
                                    key={suggestion.text}
                                    onClick={()=>{
                                        setSearchVal(suggestion.text);
                                        composerRef.current?.focus();
                                    }}
                                >
                                    <i className={`fa-solid ${suggestion.icon}`}/>
                                    {suggestion.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={`chatAiInput ${chat.length >0 ? 'fullWidthChat':''}`}>
                {attached.length >0 && (
                    <div className="attachedHolder">
                        {attached.map((element,index)=>(
                            <AttachedCard info={element} key={index} deleteAct={deleteAttached}/>
                        ))}
                    </div>
                )}
                <ChatComposer
                    inputRef={composerRef}
                    value={searchVal}
                    onChange={setSearchVal}
                    onSubmit={sendAiPrompt}
                    disabled={disabled}
                    maxLength={MAX_PROMPT_CHARACTERS}
                    placeholder={'Pregunta lo que necesites'}
                />
                <div className="toolsOptions">
                    <ButtonMenu onClick={()=>{setVisibleAddOptions(!visibleAddOptions)}} noRotate={true} title={'Agregar'}><i className="fa-solid fa-plus"/></ButtonMenu>
                    <OptionsChatAi
                        action={setSelectedAgentId}
                        options={agentOptions}
                        children={<i className="bi bi-sliders"/>}
                    />
                    <div className="rightAlOptions">
                        <OptionsChatAi action={setTier} options={[
                            {text:'Bajo consumo',value:'low-consume',children:<i className="fa-solid fa-leaf"/>},
                            {text:'Rápido',value:'fast',children:<i className="fa-solid fa-bolt"/>},
                            {text:'Razonamiento',value:'think',children:<i className="fa-regular fa-lightbulb"/>},
                            {text:'Pro',value:'pro',children:<i className="fa-solid fa-graduation-cap"/>}
                        ]}/>
                        {loading
                            ? <ButtonMenu onClick={stopStreaming} noRotate={true} title={'Detener'}><i className="fa-solid fa-stop"/></ButtonMenu>
                            : <ButtonMenu onClick={sendAiPrompt} noRotate={true} title={'Enviar'}><i className="fa-regular fa-paper-plane"/></ButtonMenu>
                        }
                    </div>
                </div>
            </div>
            {visibleAddOptions && (
                <div className="addOptions">
                    <div onClick={()=>{setVisibleAddOptions(false)}} className="closeAddOp">
                        <i className="fa-solid fa-xmark"/>
                    </div>
                    <ul>
                        <CardTitleLogo onClick={()=>{loadFiles(false,"image/png,image/jpeg")}} title={'Imágen'}><i className="fa-solid fa-image"/></CardTitleLogo>
                        <CardTitleLogo onClick={()=>{loadFiles(false,".pdf,.csv,.md")}} title={'Archivo'}><i className="fa-solid fa-file"/></CardTitleLogo>
                        <CardTitleLogo title={'Carpeta'}><i className="fa-solid fa-folder-open"/></CardTitleLogo>
                        <DespleList children={<i className="fa-solid fa-book"/>} father={{
                            title:'Informes'
                            }} options={[
                                {title:'Documentos reportados',children:<i className="fa-solid fa-book"/>},
                                {title:'Ordenes de producción',children:<i className="fa-solid fa-file-lines"/>,action:handleAddAttahced,path:'reportOPS'},
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
                </div>
            )}
            {/* Fuera del panel desplegable: si se desmonta antes de que el
                usuario elija el archivo, el evento change nunca llega. */}
            <input type="file" hidden ref={fileInput} onChange={handleFilesSelected}/>
        </div>
    )
}
