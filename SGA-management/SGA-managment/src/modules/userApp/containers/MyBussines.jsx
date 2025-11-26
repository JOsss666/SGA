
import './MyBussines.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussines } from '../components/CardMyBussines';
import {useAppInfo} from '../../../context/context'

export function MyBussines(){
    const {appInfo} = useAppInfo();
    console.log(appInfo)
    const info= [
        {
            name: "Unidades de negoció",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'
        },{
            name: "Centros de costo",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'
        },{
            name: "Clientes y proveedores",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930685/ChatGPT_Image_23_nov_2025_15_41_45_xvrjtd.png'
        },{
            name: "Personal",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1764082062/ChatGPT_Image_25_nov_2025_09_47_22_lmd5sy.png'
        },
    ]
    
    return(
        <div className="MyBussines">
            <div className="headMyBussines">
                <DescriptionSpan text={'¿Que hay de nuevo?'}/>
                <BoldTitle text={appInfo.legal_name}/>
            </div>
            <div className='carouselMyBussines'>
                {info.map((element,index)=>(
                    <CardMyBussines info={element} key={index} />
                ))}
            </div>
        </div>
    )
}