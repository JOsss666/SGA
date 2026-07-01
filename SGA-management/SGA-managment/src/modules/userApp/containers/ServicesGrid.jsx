import { useParams } from "react-router-dom"
import './ServicesGrid.css'
import { useAppInfo } from "../../../context/context";


export function ServicesGrid(){
    const params = useParams();
    const {userConfig} = useAppInfo();

    let services = [
        ...(userConfig.access.modules.management.use == true ? [{
            text:'Administración',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png',
            path:`https://management.sga360.co/SGA_management/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.inventory.use == true ? [{
            text:'Inventarios',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1761582991/ChatGPT_Image_29_sept_2025_16_39_52_dozlku.png',
            path:`https://inventory.sga360.co/SGA_INVENTORY/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.process.use == true ? [{
            text:'Procesos',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1761582957/ChatGPT_Image_7_sept_2025_13_29_09_gkktlq.png',
            path:`https://process.sga360.co/SGA_process/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules["sga-home"].use == true ? [{
            text:'SGA',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1761514001/ChatGPT_Image_26_oct_2025_16_24_57_hgpkmn.png',
            path:`https://process.sga360.co/SGA_process/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.facturation.use == true ? [{
            text:'Facturación',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1761582962/ChatGPT_Image_7_sept_2025_16_22_25_vtvxph.png',
            path:`https://facturation.sga360.co/SGA_management/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.contability.use == true ? [{
            text:'Contabilidad',
            img:'https://i.pinimg.com/1200x/99/65/82/996582960c20e3b60a90ca86a74eedd4.jpg',
            path:`https://process.sga360.co/SGA_process/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.treasury.use == true ? [{
            text:'Tesoreria',
            img:'https://i.pinimg.com/1200x/0a/5b/83/0a5b8348a20c7f9e2eb608fd76719ed4.jpg',
            path:`https://treasury.sga360.co/SGA_treasury/${params.company_key}/${params.user_key}/`
        }] : []),
        ...(userConfig.access.modules.ctools.use == false ? [{
            text:'Ctools',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1765044183/ChatGPT_Image_6_dic_2025_13_01_36_1_adicoi.png',
            path:`https://process.sga360.co/SGA_process/${params.company_key}/${params.user_key}/`
        },] : []),
        ...(userConfig.access.modules.certicloud.use == false ? [{
            text:'CertiCloud',
            img:'https://res.cloudinary.com/djjxugmni/image/upload/v1759160717/logo_certicloud-_perfil_azul_2_ljka0q.png',
            path:`https://process.sga360.co/SGA_process/${params.company_key}/${params.user_key}/`
        }] : []),
    ].filter(Boolean); // Seguridad extra para eliminar cualquier nulo/falso
    

    return(
        <div className="ServicesGrid" onClick={()=>{
            console.log(userConfig.access.modules)
            console.log(userConfig.access.modules.management.use)
        }}>
            {services.map((element,index)=>(
                <div className="serviceBubble" key={index} onClick={()=>{
                    window.open(element.path, "_blank");
                }}>
                    <img src={element.img} alt="" />
                    <span>{element.text}</span>
                </div>
            ))}
            {services.length == 0 && (
                <span>No hay modulos disponibles</span>
            )}
        </div>
    )
}