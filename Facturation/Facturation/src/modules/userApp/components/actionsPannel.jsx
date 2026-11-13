import './actionsPannel.css'

// actions: [{ title, actions: [{ icon, name, action }] }]
// Cada sección se dibuja como una tarjeta con su título; `action` (opcional) es la
// función que se ejecuta al pulsar la acción y recibe el objeto de la acción.
export function ActionsPannel({actions = []}){
    return(
        <div className="actionsPannel">
            {actions.map((section,sectionIndex)=>(
                <section className="actionsPannelSection" key={sectionIndex}>
                    {section.title && <h6 className="actionsPannelTitle">{section.title}</h6>}
                    <div className="actionsPannelList">
                        {(section.actions ?? []).map((element,index)=>(
                            <button
                                type="button"
                                className="actionsPannelItem"
                                key={index}
                                disabled={element.disabled}
                                onClick={()=>element.action?.(element)}
                            >
                                <span className="actionsPannelIcon" aria-hidden="true">{element.icon}</span>
                                <span className="actionsPannelName">{element.name}</span>
                                <i className="fa-solid fa-angle-right actionsPannelChevron" aria-hidden="true"/>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
