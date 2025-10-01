
import './ComponentsCard.css';

export function ComponentsCard ({title,description,children}){

    return (
        <div className="ComponentsCard">
            <div className="cardContent">
                <div className="cardContentImage">
                    {children}
                </div>
                <div className='cardModulo'>
                    <h4 className="cardTitle"><span className='color'>{title}</span></h4>
                    <p className="cardSubTitle">SGA</p>
                </div>
            </div>
            <p className="cardText">{description != undefined? description:'Integración directa de la Inteligencia Artificial'}</p>
        </div>
    )
}
