import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import {SearchBar} from '../../userApp/components/SearchBar'
import {BoldTitle} from '../../userApp/components/BoldTitle'
import {FormButton} from '../../userApp/components/FormButton'
import { Home } from './Home';
import { AboutUs } from './AboutUs';
import { FooterSugerence } from '../components/FooterSugerence';
import { MediaHandler } from '../../../../media/MediaHandler';
import { Contact } from './Contact';
import { Login } from '../../Login/Login';
import {SignUp} from '../../Login/SignUp'
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
        {name:'Iniciar Sesión',path:'logIn'}
    ]

    return(
        <div className="LandingPage">
            <header className="NavegationMenu">
                <BoldTitle children={<span>SGA - </span>} text={'Inventarios'}/>
                <SearchBar placeholder={'Buscar en SGA - Inventarios'}/>
                {menuOptions.map((element,index)=>(
                    <span onClick={()=>{
                        handleNavigate(element.path)
                    }} key={index}>
                        {element.name}
                    </span>
                ))}
                <FormButton text={'Registro'} onClick={()=>{
                    handleNavigate('signUp')
                }}/>
            </header>
            <div className="ContentLandingPage">
                <Routes>
                    <Route path='/' element={<Home/>}/>
                    <Route path='/aboutus' element={<AboutUs />}/>
                    <Route path='/contact' element={<Contact/>}/>
                    <Route path='/help' element={<span>Ayuda</span>}/>
                    <Route path='/logIn' element={<Login/>}/>
                    <Route path='/signup' element={<SignUp/>}/>
                </Routes>
            </div>
            <footer>
                <MediaHandler name={'oso5'}/>
                <BoldTitle text={'SGA - Inventarios'}/>
                <div className="girdSugerences">
                    <FooterSugerence title={'Información'} options={[
                        {text:'¿Como Empezar?',path:'newStart'},
                        {text:'Servicios',path:'Services'},
                        {text:'Planes',path:'Plans'}
                    ]}/>
                    <FooterSugerence title={'Más de SGA - Inventarios'} options={[
                        {text:'Sobre Nosotros',path:'newStart'},
                        {text:'Contacto',path:'Contact'},
                        {text:'Sobre Nosotros',path:'AboutUs'}
                    ]}/>
                    <FooterSugerence title={'Ayuda y Contacto'} options={[
                        {text:'Soporte técnico',path:'tecnicalSupport'},
                        {text:'correo@gmail.com'},
                        {text:'+51 123 456'}
                    ]}/>
                    <FooterSugerence title={'Más de SGA'} options={[
                        {text:'SGA - HomePage',path:'newStart'},
                        {text:'SGA - Contabilidad',path:'Services'},
                        {text:'SGA - Facturación',path:'Plans'},
                        {text:'SGA - Procesos',path:'Plans'},
                        {text:'SGA - Tesoreria',path:'Plans'}
                    ]}/>
                </div>
            </footer>
        </div>
    )
}