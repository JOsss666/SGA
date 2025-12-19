import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './ConceptsPlan.css'
import { postInfo } from "../../../utils/functions";
import { useAlert, useAppInfo } from "../../../context/context";
import { ButtonMenu } from "../components/ButtonMenu";
import { FormNewConcept } from "./forms/FormNewConcept";
import { MoreOptions } from "../components/MoreOptions";
import { ConceptCard } from "../components/ConceptCard";
import { SearchBar } from "../components/SearchBar";
import { TaxCard } from "../components/TaxCard";
import { LoadingSpace } from "./LoadingSpace";
import { FormNewTax } from "./forms/FormNewTax";
import { SelectOptions } from "../components/SelectOptions";
import { arrayToTree } from "../../../utils/functions";
import { TreeOrganizer } from "./TreeOrganizer";
import { FormNewCategoryTaxes } from "./forms/FormNewCategoryTaxes";
import { SwitchOption } from "../components/SwitchOption";

export function ConceptsPlan(){

    // Control
    const [displayGird,setDisplayGrid] = useState('tree')
    const [loading,setLoading] = useState(true);
    const [disabled,setDisabled] = useState(false);

    // Prev info
    const [categories,setCategories] = useState([]);
    const [openTree,setOpenTree] = useState(false);
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [concepts,setConcepts] = useState([]);
    const [taxes,setTaxes] = useState([]);
    const [noOrganizedTaxes,setNoOrganizedTaxes] = useState([]);
    const [organizedTaxes,setOrganizedTaxes] = useState([]);
    const [searchValCon,setSearchValCon] = useState('');
    const [searchValTax,setSearchValTax] = useState('');
    const searchValConLowerCase = searchValCon.toLowerCase();
    const searchValTaxLowerCase = searchValTax.toLowerCase();

    const getConcepts = async()=>{
        let res = await postInfo('/getConcepts',{
            company_id:appInfo.company_id,
            typePlanAccount:appInfo.accountPlanType
        })
        console.log(res);
        if(res[0]){
            setConcepts(res[1])
        }
    }

    const getCategories = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/getTaxCategories',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            setCategories(res[1])
        }
        setLoading(false);
        setDisabled(false);
    }

    const getTaxes = async()=>{
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
        })
        console.log(res);
        if(res[0]){
            let C = []
            setNoOrganizedTaxes(res[1]);
            res[1].forEach(element => {
                element.text = element.name,
                element.value = element.tax_id
                C.push({
                    text:element.name,
                    value:element
                })
            });
            setTaxes(C);
        }
    }

    useEffect(()=>{
            let C = []
            categories.forEach(element => {
                C.push(element);
            });
            noOrganizedTaxes.forEach(element => {
                C.push(element)
            });
            console.log(C);
            let orgTaxes = arrayToTree(C);
            setOrganizedTaxes(orgTaxes)
    },[noOrganizedTaxes,categories])

    const getInfo = async()=>{
        setLoading(true);
        await getConcepts();
        await getCategories();
        await getTaxes();
        setLoading(false)
    }

    useEffect(()=>{
        getInfo();
    },[]);

    const handleSearchConcept = (element) =>{
        return searchValConLowerCase === '' 
            ? true 
            : JSON.stringify(element.id).includes(searchValConLowerCase) ||   
            element.name.toLowerCase().includes(searchValConLowerCase);
    }

    const handleSearchTax = (element) =>{
        return searchValTaxLowerCase === '' 
            ? true 
            : JSON.stringify(element.id).includes(searchValTaxLowerCase) ||   
            element.name.toLowerCase().includes(searchValTaxLowerCase);
    }

    const createNewConcept = ()=>{
        popInAlert(<FormNewConcept reloadInfo={getInfo}/>)
    }

    const createNewTax = ()=>{
        popInAlert(<FormNewTax reloadInfo={getInfo}/>)
    }

    const createtaxCategory = ()=>{
        popInAlert(<FormNewCategoryTaxes reloadFun={getTaxes}/>)
    }

    return(
        <div className="ConcenptsPlan">
            <div className="headSection">
                <BoldTitle text={'Conceptos e Impuestos'}/>
                <DescriptionSpan text={'Lista de conceptos de compra y venta.'}/>
                <div className="menuConcepts">
                    <ButtonMenu title={'Buscar y filtrar'} children={<i className="fa-solid fa-magnifying-glass"/>}/>
                    <ButtonMenu onClick={()=>{
                        getInfo();
                    }} title={'Volver a cargar'} children={<i className="fa-solid fa-rotate-right"/>}/>
                    <MoreOptions options={[
                        {text:'Crear concepto',icon:<i className="fa-solid fa-cash-register"/>,action:createNewConcept},
                        {text:'Crear impuesto',icon:<i className="fa-solid fa-sack-dollar"/>,action:createNewTax},
                        {text:'Crear categoría impuesto',icon:<i className="fa-solid fa-folder-plus"/>,action:createtaxCategory}
                    ]}>
                        <i className="fa-solid fa-plus"/>
                    </MoreOptions>
                    <ButtonMenu title={'Eliminar concepto o inmpuesto'} children={<i className="fa-solid fa-trash-can"/>}/>
                    <MoreOptions options={[
                        {text:'Descargar conceptos',icon:<i className="fa-solid fa-arrow-down-long"/>},
                        {text:'Descargar Impuestos',icon:<i className="fa-solid fa-arrow-down-long"/>},
                        {text:'Ver estadisticas',icon:<i className="fa-solid fa-chart-column"/>},
                        {text:'Ver movimientos',icon:<i className="fa-solid fa-eye"/>}
                    ]}/>
                </div>
            </div>
            <div className="spaceCards">
                <div className="conceptsSpaceC">
                    <h3>Conceptos de bienes, servicios y compras</h3>
                    <SearchBar action={setSearchValCon} placeholder={'Buscar Concepto'}/>
                    <div className="conceptsC">
                        {!loading && concepts.map((element,index)=>(
                            <ConceptCard hidden={!handleSearchConcept(element)} info={element} key={index} reloadFun={getConcepts} />
                        ))}
                        {loading && (
                            <LoadingSpace title={'Cargando Conceptos'} description={'Esto no debe tardar mucho...'}/>
                        )}
                    </div>
                </div>
                <div className="taxesSpaceC">
                    <h3>Impuestos en plan de cuentas</h3>
                    <div className="searchOptions">
                        <SearchBar placeholder={'Buscar  impuesto'} action={setSearchValTax} />
                        <SelectOptions title={'Filtro'} options={['ninguno']}/>
                        <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                        <ButtonMenu noRotate={true} onClick={()=>{
                                displayGird == 'grid'? setDisplayGrid('tree'):setDisplayGrid('grid')
                            }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-grip-lines':'fa-solid fa-folder-tree'}/>
                        </ButtonMenu>
                        {displayGird == 'tree' && (
                            <SwitchOption action={setOpenTree}/>
                        )}
                    </div>
                    <div className="taxesC">
                        {!loading && displayGird == 'grid' && taxes.map((element,index)=>(
                            <TaxCard hidden={!handleSearchTax(element.value)} info={element.value} key={index} reloadFun={getTaxes} />
                        ))}
                        {!loading && displayGird == 'tree' && organizedTaxes.map((element,index)=>(
                            <TreeOrganizer allOpen={openTree} list={[element]} key={index} popNewOption={()=>{
                                popInAlert(<FormNewTax reloadInfo={getTaxes}/>)
                            }}/>
                        ))}
                        {loading && (
                            <LoadingSpace title={'Cargando Impuestos'} description={'Esto no debe tardar mucho...'}/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}