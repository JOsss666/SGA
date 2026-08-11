import { useEffect, useMemo, useState } from "react";
import { useAppInfo } from "../../../../../context/context";
import { SearchBar } from "../../../components/SearchBar";
import { formatDate, moneyFormat, postInfo, translateTransactionType } from "../../../../../utils/functions";
import './AccountPannel.css'

const columns = [
    {text:'ID',value:'id'},
    {text:'Concepto',value:'concept_name'},
    {text:'Tipo',value:'type'},
    {text:'Sub total',value:'subTotal'},
    {text:'Total',value:'total'},
    {text:'Naturaleza',value:'nature'},
    {text:'Cuenta',value:'account_code'},
];

export function AccountPannel({id}){

    // Requirements
    const {appInfo} = useAppInfo()

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDiabled] = useState(false);
    const [searchValue,setSearchValue] = useState('');

    // form info
    const [transactionDetails,setTransactionDetails] = useState([]);

    const filteredTransactionDetails = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLocaleLowerCase('es');

        if (!normalizedSearch) return transactionDetails;

        return transactionDetails.filter((transaction) =>
            columns.some(({value}) => {
                const displayedValue = value === 'type'
                    ? translateTransactionType(transaction[value])
                    : transaction[value];

                return String(displayedValue ?? '')
                    .toLocaleLowerCase('es')
                    .includes(normalizedSearch);
            })
        );
    }, [searchValue, transactionDetails]);


    const getTransactionDetails = async () => {
        setLoading(true);
        try {
            const res = await postInfo("/getTransactionDetails",{
                doc_id:id,
                typePlanAccount:appInfo.accountPlanType,
                company_id: appInfo.company_id,
                Type:'TR_details'
            });
            console.log('TR details: ',res);
            if (res && res[0]) {
                setTransactionDetails(res[1]);
            } else {
                setTransactionDetails([]);
            }
        } catch (error) {
            console.error("Error al obtener detalles de la transacción:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        getTransactionDetails();
    },[])

    return(
        <div className="AccountPannel">
            <div className="head">
                <h6>Contabilización {transactionDetails.length >0 ? ` ${transactionDetails[0].doc_type}#${transactionDetails[0].ownSerial}`:''}</h6>
                <div className="generalInfoline">
                    <span>Tercero: {transactionDetails.length > 0 ? transactionDetails[0].thirdparty_name:"--"}</span>
                    <span>Fecha {transactionDetails.length > 0 ? formatDate(transactionDetails[0].created_at):'--/--/--'}</span>
                </div>
                <SearchBar value={searchValue} action={setSearchValue} placeholder={'Buscar transacción'}/>
            </div>
            <div className="body">
                <div className="headTable">
                    {columns.map((element,index)=>(
                        <span className={`item_${element.value}`} key={index}>{element.text}</span>
                    ))}
                </div>
                <div className="tableContnet">
                    {filteredTransactionDetails.map((element,index)=>(
                        <div className="transactionLine" key={index}>
                            {columns.map((column,index)=>(
                                <span className={`item_${column.value}`} key={index}>
                                    {column.value === 'subTotal' || column.value === 'total'
                                        ? `$ ${moneyFormat(element[column.value])}`
                                        : column.value === 'type'
                                            ? translateTransactionType(element[column.value])
                                            : element[column.value]}
                                </span>
                            ))}
                        </div>
                    ))}
                    {!loading && filteredTransactionDetails.length === 0 && (
                        <span>No se encontraron transacciones</span>
                    )}
                </div>
            </div>
        </div>
    )
}
