import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { InputBarChat } from "../components/InputBarChat";
import { TagIndicator } from "../components/TagIndicator";
import './SearchDocument.css'
import { useAppInfo } from "../../../context/context";
import { CheckSquare } from "../components/CheckSquare";
import { SelectOptions } from "../components/SelectOptions";
import { FormInput } from "../components/FormInput";
import { postInfo } from "../../../utils/functions";
import { OpCard } from "../components/OpCard";
import { OcSimpleCard } from "../components/OcSimpleCard";
import { DocumentCard } from "../components/DocumentCard";

export function SearchDocument({}){
    
    const [searchVal,setSearchVal] = useState('');
    const [types,setTypes] = useState(['OP','OC','DC','FV','CI'])
    const [initialDate,setInitialDate] = useState();
    const [finalDate,setFinalDate] = useState();
    const [results,setResults] = useState([]);
    const {appInfo} = useAppInfo();
    const [visibleFilterSettings,setVisibleFilterSettings] = useState(false)
    const [visibleResults,setVisibleResults] = useState(false);
    const [visiblePreviewElement,setVisiblePreviewElement] = useState(false);
    const [selectedDoc,setSelectedDoc] = useState({});
    const [loading,setLoading] = useState();
    const alternateVisibleFilters = ()=>{
        setVisibleFilterSettings(!visibleFilterSettings);
    }

    // Filter Types
    const [visibleOp,setVisibleOp] = useState(true);
    const [visibleOc,setVisibleOc] = useState(true);
    const [visibleDc,setVisibleDc] = useState(true);
    const [visibleFv,setVisibleFv] = useState(true);
    const [visibleCi,setVisibleCi] = useState(true);

    const handleTypeFilter = ()=>{
        let C = []
        visibleOp && C.push('OP')
        visibleOc && C.push('OC')
        visibleDc && C.push('DC')
        visibleFv && C.push('FV')
        visibleCi && C.push('CI')
        setTypes(C);
    }

    const formInfo = {
        company_id:appInfo.company_id,
        searchVal,
        types,
        initialDate,
        finalDate
    }

    const getDocuments =async()=>{
        console.log(formInfo)
        setVisiblePreviewElement(false)
        let res = await postInfo('/process/searchDocument',formInfo);
        console.log(res);
        if(res[0]){
            res[1].forEach(element => {
                element.getData = true;
            });
            setResults(res[1]);
        }else{
            setResults([])
        }
        setVisibleResults(true);
    }

    useEffect(()=>{
        handleTypeFilter()
    },[visibleOp,visibleOc,visibleDc,visibleFv,visibleCi])

    return(
        <div className={`SearchDocument appSection ${visibleResults? 'SearchResultsVisible':''}`}>
            <BoldTitle text={'Busqueda de documentos'}/>
            <div className="searchOptions">
                {visibleFilterSettings && (
                    <div className="filtersOptions">
                        <div className="userPersonalization">
                            <strong>Tipo</strong>
                            <div className="gridOptions">
                                <CheckSquare action={setVisibleOp} checked={visibleOp} title={'OP'}/>
                                <CheckSquare action={setVisibleOc} checked={visibleOc} title={'OC'}/>
                                <CheckSquare action={setVisibleDc} checked={visibleDc} title={'DC'}/>
                                <CheckSquare action={setVisibleFv} checked={visibleFv} title={'FV'}/>
                                <CheckSquare action={setVisibleCi} checked={visibleCi} title={'CI'}/>
                            </div>
                        </div>
                        <div className="userPersonalization">
                            <strong>Estado</strong>
                            <div className="gridOptions">
                                <SelectOptions options={['Todos','Activo','Reportados','Terminados']}/>
                            </div>
                        </div>
                        <div className="userPersonalization">
                            <strong>Periodo</strong>
                            <div className="gridOptions periodFilter">
                                <FormInput action={setInitialDate} max={finalDate} type={'date'} title={'Fecha inicial'}/>
                                <FormInput action={setFinalDate} min={initialDate} type={'date'} title={'Fecha final'}/>
                            </div>
                        </div>
                    </div>
                )}
                {visibleResults && (
                    <div className="ResultsContainer">
                        {results.length > 0 && !visiblePreviewElement && (
                            <>
                                <span>Se encontraron {results.length} resultados.</span>
                                <div className="gridResults">
                                    {results.map((element,index)=>(
                                        <span onClick={()=>{
                                            element['docType'] = element.type;
                                            setSelectedDoc(element);
                                            setVisiblePreviewElement(true);
                                        }} key={index}>{element.type}#{element.id}</span>
                                    ))}
                                </div>
                            </>
                        )}{results.length == 0 && !visiblePreviewElement && (
                            <>
                                <span>No se encontraron resultados para {types.map((element,index)=>{
                                    return(`${element}${index>0 && index<types.length-1? ',':''} `)
                                })}, con el número o descripción "{searchVal}".</span>
                                <div className="gridResults">
                                    {results.map((element,index)=>(
                                        <span key={index}>{element.type}#{element.id}</span>
                                    ))}
                                </div>
                            </>
                        )}
                        {visiblePreviewElement && (
                            <div className="contentPrevElement">
                                {selectedDoc.type == 'OP' && (
                                    <OpCard data={selectedDoc} />
                                )}{selectedDoc.type != 'OP' && (
                                    <DocumentCard data={selectedDoc} />
                                )}
                            </div>
                        )}
                    </div>
                )}
                <InputBarChat loading={loading} searchAction={setSearchVal} sendAction={getDocuments} settings={{
                    action:alternateVisibleFilters
                }} placeholder={'Busca el documento que necesites'}/>
                <div className="tagsContainer">
                    {types.length>0 && types.map((element,index)=>(
                        <TagIndicator title={element} color={'#364153'} children={<i className="fa-solid fa-xmark"/>}/>
                    ))}
                    {initialDate != null && finalDate != null && (
                        <TagIndicator title={`${initialDate} - ${finalDate}`} color={'#2A9689'} children={<i className="fa-solid fa-xmark"/>}/>
                    )}
                </div>
            </div>
        </div>
    )
}