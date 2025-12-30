import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import {PathLocation} from '../components/PathLocation'
import {SelectOptions} from '../components/SelectOptions'
import {FormButton} from '../components/FormButton'
import {ButtonMenu} from '../components/ButtonMenu'
import { SearchBar } from "../components/SearchBar";
import { useEffect, useState } from "react";
import './CostCenters.css'
import { useAlert, useAppInfo } from "../../../context/context";
import { FormNewCostCenter } from "./forms/FormNewCostCenter";
import { arrayToTree, postInfo } from "../../../utils/functions";
import { LoadingSpace } from "./LoadingSpace";
import {NormalCard} from '../components/NormalCard'
import { useParams, useNavigate } from "react-router-dom";
import { TreeOrganizer } from "./TreeOrganizer";
import { SwitchOption } from "../components/SwitchOption";
import { NoResults } from "./NoResults";

export function CostCenters(){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [costCenters,setCostCenters] = useState([]);
    const navigate = useNavigate();
    const params = useParams(); 

    // Control
    const [disabled,setDisabled] = useState();
    const [loading,setLoading] = useState(false);
    const [displayGird,setDisplayGrid] = useState('tree');
    const [organizedTree,setOrganizedTree] = useState([]);
    const [searchValue,setSearchVal] = useState('');
    const [allOpenTree,setAllOpenTree] = useState(false);

    // Functions
    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/myBussines/costCenters/${path}`)
    }

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    const getCostCenters = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/getCostCenters',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            setCostCenters(res[1])
        }
        setLoading(false);
        setDisabled(false);
    }

    const createNewChild = (element)=>{
        popInAlert(<FormNewCostCenter info={element}/>)
    }

    useEffect(()=>{
        if(costCenters.length>0){
            let C = arrayToTree(costCenters);
            setOrganizedTree(C);
        }
    },[costCenters])

    // Previous Actions
    useEffect(()=>{
        getCostCenters();
    },[])

    return(
        <div className="CostCenters">
            <PathLocation/>
            <BoldTitle text={'Centros de costo'}/>
            <DescriptionSpan text={'Administra los centros de costo de tu empresa'}/>
            <div className="searchOptions">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                <ButtonMenu noRotate={true} onClick={()=>{
                        displayGird == 'grid'? setDisplayGrid('tree'):setDisplayGrid('grid')
                    }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-border-all':'fa-solid fa-folder-tree'}/>
                </ButtonMenu>
                <FormButton disabled={disabled} text={'Crear nuevo'} onClick={()=>{
                    popInAlert(<FormNewCostCenter reloadFun={getCostCenters}/>)
                }} children={<i className="fa-solid fa-plus"/>}/>
            </div>
            <div className="contentCostCenters">
                {! loading && costCenters.length>0 &&displayGird == 'grid' && (
                    <div className="gridCostCenters">
                        {costCenters.map((element,index)=>(
                            <>
                                {filterOptions(JSON.stringify(element)) && (
                                    <NormalCard onClick={()=>{
                                        handleNavigate(element.id)
                                    }}title={element.name}
                                    onlyTitle={true} 
                                    key={index}
                                    img={'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'}/>
                                )}
                            </>
                        ))}
                    </div>
                )}
                {!loading && costCenters.length>0 && displayGird == 'tree' && (
                    <div className="treeSpaceCostCenters">
                        <div className="showAll">
                            <span>Desplegar todo</span>
                            <SwitchOption action={setAllOpenTree}/>
                        </div>
                        {organizedTree.map((element,index)=>(
                            <TreeOrganizer list={[element]} key={index} allOpen={allOpenTree} popNewOption={createNewChild}/>
                        ))}
                    </div>
                )}
                {loading && (
                    <LoadingSpace title={'Cargando centros de costo'} description={'Esto no debe tardar mucho...'}/>
                )}
                {!loading && costCenters.length == 0 && (
                    <NoResults title={'No hay centros de costo'} newOption={'Crea tu primer centro de costo'} children={
                        <FormNewCostCenter reloadFun={getCostCenters}/>
                    }/>
                )}
            </div>
            
        </div>
    )
}