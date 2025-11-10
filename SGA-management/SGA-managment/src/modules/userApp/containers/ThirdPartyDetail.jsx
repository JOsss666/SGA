import { useEffect, useState } from 'react'
import { BoldTitle } from '../components/BoldTitle'
import { ButtonMenu } from '../components/ButtonMenu'
import { CardRankingAnalytics } from '../components/CardRankingAnalytics'
import { TagIndicator } from '../components/TagIndicator'
import './ThirdPartyDetail.css'
import { FormNewUser } from './forms/FormNewUser'
import { GeneralInfo } from './ThirdPartiesDetailsSections/GeneralInfo'
import { ComercialInfo } from './ThirdPartiesDetailsSections/ComercialInfo'
import { postInfo } from '../../../utils/functions'
import { useParams } from 'react-router-dom'
import { useAppInfo } from '../../../context/context'
import { LoadingSpace } from './LoadingSpace'

export function ThirdPartyDetail(){

    // dependencias
    const params = useParams();
    const {appInfo} = useAppInfo();

    // control 
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({})
    const [actualSection,setActualSection] = useState(0)

    const menuSections = [
        "Información General",
        "Información Comercial",
        "Infrmación Tributaria",
        "Estadisticas",
        "Actividad"
    ]

    const dictionaryWords = {
        supplier:'Proveedor',
        client:'Cliente',
        employee:'Empleado',
        contractor:'Contratista',
        partner:'Socio',
        other:'Otro'
    }

    // información

    const getThirdPartyInfo = async()=>{
        setDisabled(true);
        setLoading(true)
        let res = await postInfo('/getThirdPartyDetails',{
            id:params.thirdparty_id,
            company_id:appInfo.company_id
        })
        console.log(res);
        if(res[0]){
            setThirdPartyInfo(res[1][0])
        }
        setLoading(false)
        setDisabled(false)
    }

    useEffect(()=>{
        getThirdPartyInfo();
    },[])


    return(
        <div className="ThirdPartyDetail">
            <div className="headerThirdParty">
                <div className="bgImage">
                    <img className='bgImgTag' src="https://i.pinimg.com/1200x/d9/b1/a1/d9b1a1416f466987cc2491c8ce5f83a3.jpg" alt="" />
                    <div className="userCard">
                        <img src="https://i.pinimg.com/1200x/f0/c8/2a/f0c82a3d92bed43977eaff0f64c6a5f0.jpg" alt="" />
                        <BoldTitle text={thirdPartyInfo.names}/>
                        <div className="RelationThirdPartyC">
                            <h5>{dictionaryWords[thirdPartyInfo.type]}</h5>
                        </div>
                    </div>
                </div>
                <div className="scoreAndContact">
                    <div className="scoreContainer">
                        <CardRankingAnalytics value={10} title={'Documentos'} icon={<i className="fa-regular fa-file"/>}/>
                        <CardRankingAnalytics value={10} title={'Transacciones'} icon={<i className="fa-regular fa-file"/>}/>
                        <CardRankingAnalytics value={10} title={'Posición'} icon={<i className="fa-regular fa-file"/>}/>
                    </div>
                    <div className="contactContainer">
                        <ButtonMenu title={'Correo'} children={<i className="fa-solid fa-envelope"/>}/>
                        <ButtonMenu title={'Telefono'} children={<i className="fa-solid fa-phone"/>}/>
                        <ButtonMenu title={'Compartir'} children={<i className="fa-solid fa-share-nodes"/>}/>
                        <ButtonMenu title={'Eliminar'} children={<i className="fa-solid fa-trash-can"/>}/>
                    </div>
                </div>
                <div className="bodyThirdPartyDetails">
                    <div className="menuSectionBody">
                        {menuSections.map((element,index)=>(
                            <h4 onClick={()=>{
                                setActualSection(index)
                            }} className={index == actualSection? 'selectedSecMenu':''} key={index}>{element}</h4>
                        ))}
                        <div className="selectedIndicator" style={{left:`${((actualSection/menuSections.length)*100)}%`}}/>
                    </div>
                    <div className="contentSection">
                        <BoldTitle text={`${menuSections[actualSection]}`}/>
                        <div className="variableContent">
                            {!loading && actualSection == 0 && (
                                <GeneralInfo info={thirdPartyInfo}/>
                            )}
                            {!loading && actualSection == 1 && (
                                <ComercialInfo info={thirdPartyInfo}/>
                            )}
                            {loading && (
                                <LoadingSpace title={'Cargando información del tercero'} description={'Esto no debe tardar mucho...'}/>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}