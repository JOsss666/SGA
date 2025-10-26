import { useEffect, useState } from "react";
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

export function AcountsPlan(){

    const {appInfo} = useAppInfo();
    const [accountPLanInfo,setAccountPanInfo] = useState({});
    const [accounts,setAccounts] = useState([]);
    const [loading,setLoading] = useState(true);
    const [searchAccount,setSeacrhAccount] = useState('');

    const handleHiddElement = (element) => {
        return searchAccount === '' 
            ? true 
            : element.code.startsWith(searchAccount) ||   
            element.name.toLowerCase().includes(searchAccount.toLowerCase());
    };


    const getAccountsplan = async()=>{
        setLoading(true)
        let res = await postInfo('/getAccountsPlan',{company_id:appInfo.company_id})
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
                    <div className="accountsContainer">
                        {accounts.length > 0 && accounts.map((element,index)=>(
                            <>
                                <CardCategory reloadFun={getAccountsplan} hidden={!handleHiddElement(element)} info={element} key={index}/>
                            </>
                        ))}
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
                <span>Cargando plan de cuentas....</span>
            )}
        </div>
    )
}