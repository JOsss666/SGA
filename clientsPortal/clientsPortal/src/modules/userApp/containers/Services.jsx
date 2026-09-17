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
        {title:'Almacenamiento en la nube',className:'CloudingStorage',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.webp'},
        {title:'Mensajeria',className:'Messages',img:'https://cdnmain.sga360.co/static/mensajes_eygd9a.webp'},
        {title:'Estadisticas',className:'Analitycs',img:'https://cdnmain.sga360.co/static/Estadisticas_phv9hy.webp'},
        {title:'Publicidad',className:'Advertising',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.webp'},
        {title:'Personalizados',className:'OwnServices',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.webp'},
        {title:'Inteligencía Artificial',className:'Ai',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.webp'},
        {title:'Correo profesional',className:'ProfesionalMail',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.webp'},
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