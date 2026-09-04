import { useEffect, useState } from "react";
import { useAlert, useAppInfo } from "../../../context/context";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { postInfo } from "../../../utils/functions";
import { PathLocation } from "../components/PathLocation";
import { ButtonMenu } from "../components/ButtonMenu";
import { FormButton } from "../components/FormButton";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormNewCostCenter } from "./forms/FormNewCostCenter";
import './Bussines.css'
import { NormalCard } from "../components/NormalCard";
import { NoResults } from "./NoResults";
import { LoadingSpace } from "./LoadingSpace";
import { FormNewBussines } from "./forms/FormNewBussines";
import { useNavigate, useParams } from "react-router-dom";

export function Bussines(){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [bussines,setBussines] = useState([]);
    const params = useParams();
    const navigate = useNavigate();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [searchVal,setSearchVal] = useState('');
    const [displayGird,setDisplayGrid] = useState('grid')

    // Functions

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/myBussines/Bussines/${path}`)
    }

    const getBussines = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/getBussines',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            setBussines(res[1]);
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getBussines();
    },[])

    return(
        <div className="Bussines">
            <div className="headSection">
                <PathLocation/>
                <BoldTitle text={'Negocios'}/>
                <DescriptionSpan text={'Crea y administra multiples líneas de negociosBussines'}/>
            </div>
            <div className="searchOptions">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                <ButtonMenu noRotate={true} onClick={()=>{
                        displayGird == 'grid'? setDisplayGrid('line'):setDisplayGrid('grid')
                    }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-border-all':'fa-solid fa-folder-tree'}/>
                </ButtonMenu>
                <FormButton disabled={disabled} text={'Crear nuevo'} onClick={()=>{
                    popInAlert(<FormNewBussines reloadFun={getBussines}/>)
                }} children={<i className="fa-solid fa-plus"/>}/>
            </div>
            <div className="gridBussines">
                {!loading && bussines.length >0 && bussines.map((element,index)=>(
                    <NormalCard
                        key={index} 
                        title={element.name}
                        onlyTitle={true}
                        img={element.img != undefined? element.img:'https://cdnmain.sga360.co/static/ChatGPT_Image_16_dic_2025_11_41_43_zhakuf.webp'}
                        onClick={()=>{
                            handleNavigate(element.id)
                        }}
                    />
                ))}
                {!loading && bussines.length == 0 && (
                    <NoResults title={'No hay lineas de negocios,'} newOption={'Crea tu primer inea  de negocios'}>
                        <FormNewBussines reloadFun={getBussines}/>
                    </NoResults>
                )}
                {loading && (
                    <LoadingSpace title={'Cargando lineas de negócio'} description={'Esto no debe tardar muchho...'}/>
                )}
            </div>
        </div>
    )
}