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
        {title:'Almacenamiento en la nube',className:'CloudingStorage'},
        {title:'Mensajeria',className:'Messages'},
        {title:'Estadisticas',className:'Analitycs'},
        {title:'Publicidad',className:'Advertising'},
        {title:'Personalizados',className:'OwnServices'},
        {title:'Inteligencía Artificial',className:'Ai'},
        {title:'Correo profesional',className:'ProfesionalMail'},
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