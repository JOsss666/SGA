import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './LandingPage.css'
export function LandingPage(){

    const navigate = useNavigate();

    const handleNavigate = (path)=>{
        navigate(`/SGA_Inventarios/${path}`)
    }

    const menuOptions = [
        {name:'Inicio',path:''},
        {name:'Sobre Nosotros',path:'aboutUs'},
        {name:'Contacto',path:'contact'},
        {name:'Ayuda',path:'help'},
        {name:'Iniciar Sesión',path:'logIn'},
        {name:'Registro',path:'signup'}
    ]

    return(
        <div className="LandingPage">
            <div className="NavegationMenu">
                {menuOptions.map((element,index)=>(
                    <span onClick={()=>{
                        handleNavigate(element.path)
                    }} key={index}>
                        {element.name}
                    </span>
                ))}
            </div>
            <div className="ContentLandingPage">
                <Routes>
                    <Route path='/' element={<span>Inicio Landing page</span>}/>
                    <Route path='/aboutus' element={<span>Sobre Nosotros</span>}/>
                    <Route path='/contact' element={<span>Contacto</span>}/>
                    <Route path='/help' element={<span>Ayuda</span>}/>
                    <Route path='/logIn' element={<span>Inicio de sesión</span>}/>
                    <Route path='/signup' element={<span>Registro</span>}/>
                </Routes>
            </div>
        </div>
    )
}