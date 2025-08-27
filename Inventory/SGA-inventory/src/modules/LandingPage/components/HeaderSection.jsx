
import { MediaHandler } from '../../../../media/MediaHandler';
import { HeaderStats } from './HeaderStats';
import './HeaderSection.css';

export function HeaderSection(){

    return(
        <section className='HeaderSection'>
            <div className="Header">
                <div className="text">
                    <h1 className='headerTitle'>Controla tú inventario de manera <span className='highlight'>Simple</span> y <span className='highlight'>Eficiente</span></h1>
                </div>
                <div className="headerImage">
                    <MediaHandler name={'oso1'}/>
                </div>
            </div>
            <section className="headerStats" >
                <div className="backGroundStats">
                    <img src="https://i.pinimg.com/1200x/2e/03/eb/2e03eb6b7677a2121a97f58ad052396a.jpg" alt="" />
                </div>
                <div className="contentHeaderStats">
                    <div className="stat">
                        <div className="value">+ 5000</div>
                        <div className="label">Movimientos en<br/>SGA - Inventarios</div>
                    </div>
                    <div className="stat">
                        <div className="value">+ 7000</div>
                        <div className="label">Movimientos en<br/>SGA - Inventarios</div>
                    </div>
                    <div className="stat">
                        <div className="value">+ 4000</div>
                        <div className="label">Movimientos en<br/>SGA - Inventarios</div>
                    </div>
                    <div className="stat">
                        <div className="value">+ 5000</div>
                        <div className="label">Movimientos en<br/>SGA - Inventarios</div>
                    </div>
                    <div className="stat">
                        <div className="value">+ 21000</div>
                        <div className="label">Movimientos en<br/>SGA - Inventarios</div>
                    </div>
                </div>
            </section>
        </section>
    )
}


