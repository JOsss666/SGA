import { useEffect, useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAppInfo } from "../../../context/context";
import { postInfo } from "../../../utils/functions";
import { BoldTitle } from "../components/BoldTitle";
import './AcountsPlan.css'
import { CardCategory } from "../components/cardCategory";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormButton } from "../components/FormButton";
import { ButtonMenu } from "../components/ButtonMenu";
import { SearchBar } from "../components/SearchBar";
import { CheckSquare } from "../components/CheckSquare";
import { SelectOptions } from "../components/SelectOptions";
import { LoadingSpace } from "./LoadingSpace";

export function AcountsPlan(){

    const {appInfo} = useAppInfo();
    const [accountPLanInfo,setAccountPanInfo] = useState({});
    const [accounts,setAccounts] = useState([]);
    const [loading,setLoading] = useState(true);
    const [searchAccount,setSeacrhAccount] = useState('');

    const filteredAccounts = useMemo(() => {
        if (!searchAccount) return accounts;
        const term = searchAccount.toLowerCase();
        return accounts.filter((element) =>
            element.code.startsWith(searchAccount) ||
            element.name.toLowerCase().includes(term)
        );
    }, [accounts, searchAccount]);

    const scrollRef = useRef(null);
    const virtualizer = useVirtualizer({
        count: filteredAccounts.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 42,
        overscan: 10,
        measureElement: (el) => el?.getBoundingClientRect().height ?? 42,
    });


    const getAccountsplan = async()=>{
        setLoading(true)
        console.log(appInfo)
        let res = await postInfo('/getAccountsPlan',{
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[0][1]){
            setAccountPanInfo(res[0][1][0]);
        }
        if(res[1][1]){
            setAccounts(res[1][1])
        }
        setLoading(false)
    }

    useEffect(()=>{
        getAccountsplan();
    },[])

    return(
        <div className="AcountsPlan appSection">
            {!loading && (
                <>
                    <div className="headSection">
                        <BoldTitle text={`Plan de cuentas: ${accountPLanInfo.name}`}/>
                        <DescriptionSpan text={`Consulta y ajusta tu plan de cuentas.  Ultima modificación: ${(accountPLanInfo.updated_at).substring(0,10)}`}/>
                        <div className="optionsAccountPLan">
                            <ButtonMenu title={'Buscar y filtrar'} children={<i className="fa-solid fa-magnifying-glass"/>}/>
                            <ButtonMenu title={'Información plan de cuentas'} children={<i className="fa-solid fa-file-invoice"/>}/>
                            <ButtonMenu title={'Editar información'} children={<i className="fa-solid fa-pencil"/>}/>
                            <ButtonMenu title={'Crear nuevo plan de cuentas'} children={<i className="fa-solid fa-plus"/>}/>
                            <ButtonMenu title={'Eliminar plan de cuentas'} children={<i className="fa-solid fa-trash-can"/>}/>

                        </div>
                    </div>
                    <div className="accountsContainer" ref={scrollRef}>
                        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
                            {virtualizer.getVirtualItems().map((virtualItem) => (
                                <div
                                    key={virtualItem.key}
                                    data-index={virtualItem.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <CardCategory
                                        reloadFun={getAccountsplan}
                                        hidden={false}
                                        info={filteredAccounts[virtualItem.index]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="filterAccountPLan">
                        <h4>Busqueda e información de cuentas</h4>
                        <SearchBar action={setSeacrhAccount} placeholder={'Buscar grupo, clase o cuenta'}/>
                        <strong>Orden</strong>
                        <div className="gridTypesAcount">
                            <SelectOptions options={[
                                'Cuenta (Ascendiente)',
                                'Cuenta (Descendiente)',
                                'Nombre (Ascendiente)',
                                'Nombre (Ascendiente)',
                            ]}/>
                        </div>
                        <div className="filterSelectOptions">
                            <div className="gridTypesAcount">
                                <strong>Tipos de cuenta</strong>
                                <CheckSquare title={'Grupos'} checked={true}/>
                                <CheckSquare title={'Clases'} checked={true}/>
                                <CheckSquare title={'Cuentas Principales'} checked={true}/>
                                <CheckSquare title={'SubCuentas'} checked={true}/>
                            </div>
                            <div className="gridTypesAcount">
                                <strong>Naturaleza</strong>
                                <CheckSquare title={'Debito'} checked={true}/>
                                <CheckSquare title={'Creadito'} checked={true}/>
                            </div>
                        </div>
                        <FormButton text={'Aplicar cambios'}/>
                    </div>
                </>
            )}{loading && (
                <LoadingSpace title={'Cargando plan de cuentas'} description={'Esto puede tardar un poco'}/>
            )}
        </div>
    )
}
