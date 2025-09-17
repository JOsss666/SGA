import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './ConceptsPlan.css'
import { postInfo } from "../../../utils/functions";
import { useAppInfo } from "../../../context/context";
import { SearchinList } from "../components/SearchInList";
import { FormInput } from "../components/FormInput";
import { ButtonMenu } from "../components/ButtonMenu";
import { FormNewConcept } from "./forms/FormNewConcept";
import { MoreOptions } from "../components/MoreOptions";
import { ConceptCard } from "../components/ConceptCard";

export function ConceptsPlan(){

    // Prev info
    const {appInfo} = useAppInfo();

    const [concepts,setConcepts] = useState([]);
    const [taxes,setTaxes] = useState([]);

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
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:{
                        text:element.name,
                        value:element.tax_id
                    }
                })
            });
            setTaxes(C);
        }else{
            setTaxes('Error')
        }
    }

    useEffect(()=>{
        getConcepts();
        getTaxes();
    },[]);

    return(
        <div className="ConcenptsPlan">
            <div className="headSection">
                <BoldTitle text={'Conceptos e Impuestos'}/>
                <DescriptionSpan text={'Lista de conceptos de compra y venta.'}/>
                <div className="menuConcepts">
                    <ButtonMenu title={'Buscar y filtrar'} children={<i className="fa-solid fa-magnifying-glass"/>}/>
                    <ButtonMenu title={'Volver a cargar'} children={<i className="fa-solid fa-rotate-right"/>}/>
                    <ButtonMenu onClick={()=>{
                        setVisibleFormConc(!visibleFormConc)
                    }} title={'Crear nuevo concepto'} children={<i className="fa-solid fa-plus"/>}/>
                    <ButtonMenu title={'Eliminar concepto o inmpuesto'} children={<i className="fa-solid fa-trash-can"/>}/>
                    <MoreOptions options={[
                        {text:'Descargar conceptos',icon:<i className="fa-solid fa-arrow-down-long"/>},
                        {text:'Descargar Impuestos',icon:<i className="fa-solid fa-arrow-down-long"/>},
                        {text:'Ver estadisticas',icon:<i className="fa-solid fa-chart-column"/>},
                        {text:'Ver movimientos',icon:<i className="fa-solid fa-eye"/>}
                    ]}/>
                </div>
                {visibleFormConc && (
                    <FormNewConcept setOpenForm={setVisibleFormConc} accounts={accounts} taxes={taxes}/>
                )}
            </div>
            <div className="spaceConcepts">
                <div className="conceptsSpaceC">
                    {concepts.map((element,index)=>(
                        <ConceptCard info={element} key={index}/>
                    ))}
                </div>
                <div className="taxesSpaceC"></div>
            </div>
        </div>
    )
}