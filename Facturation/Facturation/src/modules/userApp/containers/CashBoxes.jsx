import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { ButtonMenu } from "../components/ButtonMenu";
import { NormalCard } from "../components/NormalCard";
import { postInfo } from "../../../utils/functions";
import { useAppInfo } from "../../../context/context";
import './CashBoxes.css'
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpace } from "./LoadingSpace";

export function CashBoxes(){

    // requierement control
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const navigate = useNavigate();
    const params = useParams();

    // control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [cashBoxes,setCashBoxes] = useState([]);
    const [searchValue,setSearchVal] = useState('');
    const [displayGird,setDisplayGrid] = useState('grid')

    const getCashBoxes = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/facturation/getCashBoxes',{
            company_id:appInfo.company_id,
            allowedCashBoxes:userConfig.access.sections.cashBoxes.overAll ? undefined:userConfig.access.sections.cashBoxes.enabled
            //user_id:userInfo.user_id
        })
        if(res[0]){
            setCashBoxes(res[1]);
        }
        setLoading(false);
        setDisabled(false);
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/cashBoxes/${path}`);
    }

    useEffect(()=>{
        getCashBoxes();
    },[])

    return (
        <div className="CashBoxes">
            <div className="headC">
                <BoldTitle text={'Cajas POS'}/>
                <DescriptionSpan text={'Administra las cajas POS de tu empresa'}/>
            </div>
            <div className="searchOptions">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                <ButtonMenu noRotate={true} onClick={()=>{
                        displayGird == 'grid'? setDisplayGrid('tree'):setDisplayGrid('grid')
                    }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-border-all':'fa-solid fa-folder-tree'}/>
                </ButtonMenu>
            </div>
            {!loading && (
                <div className="gridCashBoxes">
                        {cashBoxes.map((element,index)=>(
                            <NormalCard 
                                title={element.name}
                                key={index}
                                img={'https://cdnmain.sga360.co/static/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.webp'}
                                onlyTitle={true}
                                onClick={()=>{
                                    handleNavigate(element.id)
                                }}
                            />
                        ))}
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando cajas'} description={'Esto no debe tardar mucho...'}/>
            )}
        </div>
    )
}