import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './LandingPage.css'
import { Home } from './Home';
import { Titles } from '../components/Titles';


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
                    <Route path='/' element={<Home/>}/>
                    <Route path='/aboutus' element={<Titles text={'Sobre Nosotros'}/>}/>
                    <Route path='/contact' element={<span><h2>Contacto</h2></span>}/>
                    <Route path='/help' element={<span>Ayuda</span>}/>
                    <Route path='/logIn' element={<span>Inicio de sesión</span>}/>
                    <Route path='/signup' element={<span>Registro</span>}/>
                </Routes>
            </div>
        </div>
    )
}