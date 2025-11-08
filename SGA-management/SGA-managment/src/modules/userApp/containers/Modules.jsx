import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';


export function Modules(){
    return(
        <div className="Modules">
            <Routes>
                <Route path='' element={
                    <div className='ModulesMain'>
                        // Coloca el contenido
                        <BoldTitle text={'Modulos'}/>
                    </div>
                }/>
                <Route path='/contability' element={<span>contabilidad</span>}/>
            </Routes>
        </div>
    )
}