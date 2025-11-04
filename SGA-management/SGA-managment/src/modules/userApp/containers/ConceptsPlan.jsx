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

export function ConceptsPlan(){

    // Prev info
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [loading,setLoading] = useState(true);
    const [concepts,setConcepts] = useState([]);
    const [taxes,setTaxes] = useState([]);
    const [searchValCon,setSearchValCon] = useState('');
    const [searchValTax,setSearchValTax] = useState('');
    const searchValConLowerCase = searchValCon.toLowerCase();
    const searchValTaxLowerCase = searchValTax.toLowerCase();
    const [visibleFormConc,setVisibleFormConc] = useState(false);

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

    const getTaxes = async(attached)=>{
        console.log('Cargando Impuestos');
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
        })
        console.log(res)
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                element.text = element.name,
                element.value = element.tax_id
                C.push({
                    text:element.name,
                    value:element
                })
            });
            setTaxes(C);
        }else{
            setTaxes('Error')
        }
    }

    const getInfo = async()=>{
        setLoading(true);
        await getConcepts();
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
                        {text:'Crear impuesto',icon:<i className="fa-solid fa-sack-dollar"/>,action:createNewTax}
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
                            <ConceptCard hidden={!handleSearchConcept(element)} info={element} key={index}/>
                        ))}
                        {loading && (
                            <LoadingSpace title={'Cargando Conceptos'} description={'Esto no debe tardar mucho...'}/>
                        )}
                    </div>
                </div>
                <div className="taxesSpaceC">
                    <h3>Impuestos en plan de cuentas</h3>
                    <SearchBar action={setSearchValTax} placeholder={'Buscar impuesto'}/>
                    <div className="taxesC">
                        {!loading && taxes.map((element,index)=>(
                            <TaxCard hidden={!handleSearchTax(element.value)} info={element.value} key={index}/>
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