
import './MyBussinesUnits.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussinesUnits } from '../components/CardMyBussinesUnits';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { PathLocation } from '../components/PathLocation';
import { useEffect, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { useAlert, useAppInfo } from '../../../context/context';
import { LoadingSpace } from './LoadingSpace';
import { FormNewStore } from './forms/FormNewStore';
import { useNavigate, useParams } from 'react-router-dom';
import { ButtonMenu } from '../components/ButtonMenu';


export function MyBussinesUnits(){

    const {popInAlert} = useAlert();
    const {appInfo,userConfig} = useAppInfo();
    const navigate = useNavigate();
    const params = useParams();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [stores,setStores] = useState([]);

    console.log(userConfig.access.stores)
    
    const getStores = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getStores',{
            company_id:appInfo.company_id,
            allowedStores:userConfig.access.stores.overAll ? undefined:userConfig.access.stores.enabled
        })
        if(res[0]){
            setStores(res[1])
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getStores();
    },[])

    const handleNavigateStore = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/myBussines/Units/${path}`)
    }



    return(
        <div className='MyBussinesUnits'>
            <div className="headMyBussinesUnits">
                <PathLocation/>
                <BoldTitle text={'Unidades de Negocio'} />
                <DescriptionSpan text={'Analiza, gestiona y parametriza los módulos de tu empresa'}/>
            </div>
            <div className="bodyMyBussinesUnits">
                <div className="StoresContainer">
                    <div className="FilterUnits">
                        <SearchBar placeholder={'Buscar'} />
                        <SelectOptions title={'Filtro'} options={['']}/>
                        <FormButton text={'+ Crear Nuevo'} disabled={disabled} onClick={()=>{
                            popInAlert(<FormNewStore/>)
                        }}/>
                    </div>
                    <div className="GaleryUnists">
                        {!loading && (
                                <>
                                    {stores.map((element,index)=>(
                                        <CardMyBussinesUnits onClick={()=>{
                                            handleNavigateStore(element.id)
                                        }} info={element} image={element.image != undefined? element.image:'https://res.cloudinary.com/djjxugmni/image/upload/v1764436577/ChatGPT_Image_29_nov_2025_12_15_47_kxqs81.png'} key={index} reloadFun={getStores}/>
                                    ))}
                                </>
                        )}
                        {loading && (
                            <LoadingSpace title={'Cargando tus unidades de negocio'} description={'Esto no debe tardar mucho...'}/>
                        )}
                    </div>
                </div>
                <div className="maps">
                    <div className="map">
                        <iframe title='map' src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.218263201659!2d-74.0817496852292!3d4.609710343512634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f99f6f1f39edb%3A0x7c9375a5a6c5a5e2!2sBogot%C3%A1%2C%20Colombia!5e0!3m2!1ses-419!2sus!4v1696354867975!5m2!1ses-419!2sus" style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                    <div className="mapMenu">
                        <ButtonMenu children={<i className="fa-solid fa-magnifying-glass"/>} title={'Buscar'}/>
                        <ButtonMenu children={<i className="fa-solid fa-store"/>} noRotate={true} title={'Tiendas'}/>
                        <ButtonMenu children={<i className="fa-solid fa-dolly"/>} noRotate={true} title={'Bodegas'}/>
                        <ButtonMenu children={<i className="fa-solid fa-truck"/>} noRotate={true} title={'Transportes'}/>
                        <ButtonMenu children={<i className="fa-solid fa-child-reaching"/>} title={'Clientes'} noRotate={true}/>
                        <ButtonMenu children={<i className="fa-solid fa-people-group"/>} noRotate={true} title={'Proveedores'}/>
                        <ButtonMenu children={<i className="fa-solid fa-truck-fast"/>} title={'Envios'} noRotate={true}/>
                        <ButtonMenu children={<i className="fa-solid fa-people-carry-box"/>} title={'Entegas'} noRotate={true}/>
                    </div>
                </div>
            </div>
        </div>
    )
}
