import './RedirectPanelSec.css'

export function RedirectPanelSec({title,elements}) {
    return (
        <div className="RedirectPanelSec">
            <h5>{title}</h5>
            <div className="redirectGrid">
                {elements.map((element,index) => (
                    <div key={index} className="redirectElement">
                        {element.type == 'main' && (
                            <h6 className='main'>{element.text}</h6>
                        )}
                        {element.type == 'sub' && (
                            <span className='sub'>{element.text}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}