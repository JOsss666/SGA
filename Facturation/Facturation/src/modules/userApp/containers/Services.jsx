import './Services.css'
import {BoldTitle} from '../components/BoldTitle'
import { DescriptionSpan } from '../components/DescriptionSpan'
import { useState } from 'react'
import { ServiceCard } from '../components/ServiceCard';
import { useNavigate, useParams } from 'react-router-dom';

export function Services(){

    const navigate = useNavigate();
    const params = useParams(); 

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/services/${path}`)
    }

    const [services,setServices] = useState([
        {title:'Almacenamiento en la nube',className:'CloudingStorage',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png'},
        {title:'Mensajeria',className:'Messages',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044345/mensajes_eygd9a.png'},
        {title:'Estadisticas',className:'Analitycs',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044500/Estadisticas_phv9hy.png'},
        {title:'Publicidad',className:'Advertising',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png'},
        {title:'Personalizados',className:'OwnServices',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png'},
        {title:'Inteligencía Artificial',className:'Ai',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png'},
        {title:'Correo profesional',className:'ProfesionalMail',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png'},
    ]);

    return(
        <div className="Services">
            <BoldTitle text={'SGA - Servicios'}/>
            <DescriptionSpan text={'Una suit de servicios como ninguna otra.'}/>
            <div className="gridServices">
                {services.length>0 && services.map((element,index)=>(
                    <ServiceCard info={element} key={index} onClick={(e)=>{
                        e.target.classList.add("SelectedServiceCard");
                        setTimeout(() => {
                            handleNavigate(element.className)
                        }, 400);
                    }}/>
                ))}
            </div>
        </div>
    )
}