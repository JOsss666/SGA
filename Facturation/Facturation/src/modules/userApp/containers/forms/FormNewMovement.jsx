import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { SelectOptions } from "../../components/SelectOptions";
import { SearchinList } from "../../components/SearchInList";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewThirdParties } from "./FormNewThirdParties";
import { FormInput } from "../../components/FormInput";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import './FormNewMovement.css'
import { postInfo } from "../../../../utils/functions";
import { FormNewConcept } from "./FormNewConcept";
import { LoadingSpace } from "../LoadingSpace";
import { ListProductsServices } from "./ListProducts&services";
import { FormNewBussines } from "./FormNewBussines";
import { FormNewCostCenter } from "./FormNewCostCenter";

export function FormNewMovement({info}){
    if(info == undefined){
        info = {}
    }

    // Requirements
    const {popInAlert,popOutAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {userInfo,appInfo} = useAppInfo();
    const [thirdParties,setThirdParties] = useState([]);
    const [stores,setStores] = useState([])
    const [cellars,setCellars] = useState([])
    const [destinyCellars,setDestinyCellars] = useState([])
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);
    const [products,setProducts] = useState([]);
    const [concepts,setConcepts] = useState([]);
    const [accounts,setAccounts] = useState([]);

    // Control
    const [disabled,setDisabled] = useState(false);
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [lodingRequirements,setLoadingRequierements] = useState(false);

    // formInfo
    const [bridgeAccount,setBridgeAccount] = useState();
    const [bussines_id,setBussines_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [doc_date,setdoc_date] = useState('');
    const [thirdParty_id,setThirdParty_id] = useState(info.thirdParty_id != undefined? info.thirdParty_id:null);
    const [listProducts,setListProducts] = useState([]);
    const [totalProducts,setTotalProducts] = useState(0)
    const [concept_id,setConceptId] = useState();
    const [store_id,setStore_id] = useState();
    const [cellar_id,setCellar_id] = useState();
    const [movement_type,setMovement_type] = useState(info.type != undefined? info.type:null);
    const [movement_group_id,setMovement_group_id] = useState(0);
    const [attached_document,setAttached_document] = useState('');
    const [status,setStatus] = useState('active');
    const [description,setDescription] = useState('');

    // Transfer options
    const [origin_store_id,setOrigin_store_id] = useState();
    const [destiny_store_id,setDestiny_store_id] = useState();
    const [origin_cellar_id,setOrigin_cellar_id] = useState();
    const [destiny_cellar_id,setDestiny_cellar_id] = useState();

    const formInfo = {
        company_id:appInfo.company_id,
        created_by:userInfo.user_id,
        user_id:userInfo.user_id,
        thirdParty_id,
        store_id,
        cellar_id,
        listProducts,
        movement_type,
        movement_group_id,
        attached_document,
        status,
        description,
        concept_id,
        totalProducts,
        doc_date,
        costCenter_id,
        bussines_id,
        origin_store_id,
        destiny_store_id,
        origin_cellar_id,
        destiny_cellar_id
    }

    // Functions
    const getThirdParties = async()=>{
        let getThirdParties = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        if(getThirdParties[0]){
            let C = [];
            getThirdParties[1].forEach(element => {
                C.push({
                    text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                    value:element.id
                })
            });
            setThirdParties(C);
        }
    }

    const getStores = async()=>{
        let res = await postInfo('/getStores',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setStores(C);
            });
        }
    }

    const getCellars = async()=>{
        let res = await postInfo('/getCellars',{
            company_id:appInfo.company_id,
            store_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.name} - ${element.id}`,
                    value:element.id
                })
                setCellars(C)
            });
        }
    }

    const getConcepts = async()=>{
        let res  = await postInfo('/getConcepts',{
            company_id:appInfo.company_id,
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
            });
            setConcepts(C)
        }
    }

    const getProducts = async()=>{
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id,
            store_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.name} - #${element.code}`,
                    value:element
                })
                setProducts(C)
            });
        }
    }

    const getProductsStock = async()=>{
        let res = await postInfo('/inventory/getStocks',{
            company_id:appInfo.company_id,
            store_id,
            cellar_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.name} - #${element.code}`,
                    value:element
                })
                setProducts(C)
            });
        }
    }

    const getBussines = async()=>{
        let res = await postInfo('/getBussines',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setBussines(C);
            });
        }
    }

    const getCostCenters = async()=>{
        let res = await postInfo('/getCostCenters',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setCostCenters(C);
            });
            
        }
    }

    const getAccounts = async()=>{
        let res = await postInfo('/getAccountsPlan',{
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[1][0]){
            let C = []
            res[1][1].forEach(element => {
                C.push({
                    text:`${element.code} - ${element.name}`,
                    value:element.id
                })
            });
            setAccounts(C)
        }
    }

    const getDocParams = async()=>{
        let res = await postInfo('/getDocParams',{
            company_id:appInfo.company_id,
            docType:movement_type
        });
        if(res[0]){
            setBridgeAccount(res[1][0].bridgeAccount)
        }else{
            getAccounts();
        }
    }

    const getRequierements = async()=>{
        setDisabled(true)
        setLoading(true)
        if(info.bridgeAccount == undefined){
            await getDocParams();
        }
        if(info.concept_id == undefined){
            await getConcepts()
        }
        if(info.store_id == undefined){
            await getStores()
        }
        if(info.thirdParty_id == undefined){
            await getThirdParties();
        }
        if(info.bussines_id == undefined){
            await getBussines();
        }
        if(info.costCenter_id == undefined){
            await getCostCenters();
        }
        setLoading(false);
        setDisabled(false);
    }

    const updateTransactions = async(id)=>{
        let res = await postInfo('/updateTransactionState',{
            status:formInfo.status == 'active'? 'posted':'draft',
            transaction_id:id
        })
        if(res[0]){
            addNotification({
                type:'aproved',
                title:'Transacciones Actualziadas',
                description:'Totas las transacciónes fueron actualizadas correctamente.'
            })
        }
    }

    const handleDestinyStore = (id)=>{
        setStore_id(id)
        setOrigin_store_id(id)
    }

    const loadDestinyCellars = async()=>{
        let res = await postInfo('/getCellars',{
            company_id:appInfo.company_id,
            store_id:destiny_store_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.name} - ${element.id}`,
                    value:element.id
                })
                setDestinyCellars(C)
            });
        }
    }

    const handleOrginCellar = (id)=>{
        setCellar_id(id);
        setOrigin_cellar_id(id);
    }


    // Creation Functions

    const createMovement = async()=>{
        setDisabled(true)
        setLoading(true)
        setStage(0);
        let res = await postInfo('/inventory/newMovement',formInfo);
        if(res[0]){
            formInfo['doc_id'] = res[1].doc_id;
            formInfo['transactionDetails'] = []
            formInfo['doc_type'] = movement_type
            formInfo['subTotal'] = totalProducts;
            formInfo['total'] = totalProducts;
            formInfo.listProducts.forEach(element => {
                formInfo.transactionDetails.push({
                    account_id:movement_type == 'Inventory Entry'? element.entry_account:element.exit_account,
                    subtotal:(movement_type == 'Inventory Entry'? element.unit_cost * element.movementsUnits:element.avg_cost * element.movementsUnits),
                    total:(movement_type == 'Inventory Entry'? element.unit_cost * element.movementsUnits:element.avg_cost * element.movementsUnits),
                    type:'inventoryMovement',
                    nature:movement_type == 'Inventory Entry'? 'DB':'CR'
                })
            });
            formInfo.transactionDetails.push({
                account_id:bridgeAccount,
                subtotal:totalProducts,
                total:totalProducts,
                type:'inventoryMovement',
                nature:movement_type == 'Inventory Entry'? 'CR':'DB'
            })
            toAccount();
        }else{
            addNotification({
                type:'error',
                title:`Error al realizar ${movement_type}`,
                description:`Hubo un problema al realizar el ${movement_type}, intentelo de nuevo.`
            })
            popOutAlert();
        }
    }

    const toAccount = async()=>{
        let res = await postInfo('/createTransaction',formInfo);
        const insertId = parseInt(res[0]);
        if(typeof(insertId) == 'number' && insertId != NaN && insertId != undefined){
            addNotification({
                type:'aproved',
                title:`Movimiento contabilizado correctamente`,
                description:`La transacción ${insertId} fue contabilizada correctamente.`
            })
            updateTransactions(insertId);
        }else{
            addNotification({
                type:'error',
                title:`Error al contabilizar movimiento`,
                description:`Hubo un problema al intentar contabilizar el movimiento ${formInfo.doc_id} de inventario`
            })
        }
        popOutAlert();
    }

    // Events Handlers

    useEffect(()=>{
        if(movement_type == 'Inventory Entry' || movement_type == 'Inventory Out'){
            setThirdParty_id(appInfo.company_id);
        }
    },[movement_type])

    useEffect(()=>{
        if(info.cellar_id == undefined){
            if(store_id != undefined && store_id != null){
                getCellars();
            }
        }
    },[store_id])

    useEffect(() => {
        if (cellar_id == null || movement_type == null) return;
        switch (movement_type) {
            case 'Inventory Entry':
            getProducts();
            break;

            case 'Inventory Out':
            getProductsStock();
            break;

            case 'Inventory Transfer':
            getProductsStock();
            break;

            case 'Inventory Consume':
            getProductsStock();
            break;

            default:
            break;
        }
    }, [cellar_id, movement_type]);

    useEffect(()=>{
        loadDestinyCellars();
    },[destiny_store_id])


    useEffect(()=>{
        getRequierements();
    },[])

    return(
        <div className="FormNewMovement">
            <BoldTitle text={info.type != undefined? 
                info.type
                :movement_type != ''? movement_type:'Movimiento de inventario'}/>
            {!loading && (
                <form onSubmit={(e)=>{
                        e.preventDefault();
                        createMovement();
                    }}>
                        {stage == 0 && (
                            <>  
                                <FormInput type={'date'} action={setdoc_date} disabled={disabled} title={'Fecha del documento'}/>
                                {info.type == undefined && (
                                        <SearchinList action={setMovement_type} disabled={disabled} title={'Tipo de movimiento'} placeHolder={'Seleccione el tipo de movimiento'} list={[
                                        {text:'Entrada',value:'Inventory Entry'},
                                        {text:'Salida',value:'Inventory Out'},
                                        {text:'Consumo',value:'Inventory Consume'},
                                        {text:'Translado',value:'Inventory Transfer'}
                                    ]}/>
                                )}
                                {info.concept_id == undefined && (
                                    <SearchinList disabled={disabled} placeHolder={'Selecione el concepto'} action={setConceptId} title={'Concepto'} list={concepts} specialOption={
                                        <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                            popInAlert(<FormNewConcept/>)
                                        }}/>
                                    }/>
                                )}
                                {info.bridgeAccount == undefined && (
                                    <SearchinList disabled={disabled} placeHolder={'Selecione la cuenta'} action={setBridgeAccount} title={'Cuenta puente'} list={accounts} specialOption={
                                        <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                            popInAlert(<FormNewConcept/>)
                                        }}/>
                                    }/>
                                )}
                                {  info.thirdParty_id == undefined && (
                                    <SearchinList action={setThirdParty_id} disabled={disabled} title={`${movement_type == 'Inventory Entry' ? 'Proveedor':'Cliente'}`} placeHolder={`Seleccione el ${movement_type == 'Inventory Entry'? 'Proveedor':'Cliente'}`} list={thirdParties} specialOption={
                                        <NewElementSelect onClick={()=>{
                                            popInAlert(<FormNewThirdParties/>)
                                        }}/>
                                    }/>
                                )}
                                {info.bussines_id == undefined && (
                                    <SearchinList disabled={disabled} action={setBussines_id} title={'Negocio'} list={bussines} placeHolder={'Seleccione el negoio'} specialOption={
                                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                                popInAlert(<FormNewBussines/>)
                                            }}/>
                                        }/>
                                    )}
                                    {info.costCenter_id == undefined && (
                                        <SearchinList disabled={disabled} action={setCostCenter_id} title={'Centro de costo'} list={costCenters} placeHolder={'Seleccione el centro de costo'} specialOption={
                                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                                popInAlert(<FormNewCostCenter/>)
                                            }}/>
                                        }/>
                                    )}
                                {info.type != 'Inventory Transfer' && movement_type != 'Inventory Transfer' && (
                                    <>
                                        {info.store_id == undefined && (
                                            <SearchinList disabled={disabled} action={setStore_id} title={'Tienda'} placeHolder={'Seleccione la tienda'} list={stores}/>
                                        )}
                                        {info.cellar_id == undefined && (
                                            <SearchinList disabled={disabled} action={setCellar_id} title={'Bodega'} placeHolder={'Seleccione bodéga'} list={cellars}/>
                                        )}
                                    </>
                                )}
                                {movement_type == 'Inventory Transfer' && (
                                    <>
                                        {info.origin_store_id == undefined && (
                                            <SearchinList disabled={disabled} action={handleDestinyStore} title={'Tienda de origen'} placeHolder={'Seleccione la tienda'} list={stores}/>
                                        )}
                                        {info.origin_cellar_id == undefined && (
                                            <SearchinList disabled={disabled} action={handleOrginCellar} title={'Bodega de origen'} placeHolder={'Seleccione bodéga'} list={cellars}/>
                                        )}
                                        {info.destiny_store_id == undefined && (
                                            <SearchinList disabled={disabled} action={setDestiny_store_id} title={'Tienda de destino'} placeHolder={'Seleccione la tienda'} list={stores}/>
                                        )}
                                        {info.origin_cellar_id == undefined && (
                                            <SearchinList disabled={disabled} action={setDestiny_cellar_id} title={'Bodega de destino'} placeHolder={'Seleccione bodéga'} list={destinyCellars}/>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {stage == 1 && (
                            <div className="gridProducts">
                                {movement_type != null && store_id != null && cellar_id != null && (
                                    <ListProductsServices
                                        listProducts={listProducts}
                                        setListPorducts={setListProducts}
                                        total={totalProducts}
                                        products={products}
                                        setProducts={setListProducts}
                                        updateProductsTotal={setTotalProducts}
                                        disabled={disabled}
                                        hidden={false}
                                        type={movement_type}
                                    />
                                )}
                            </div>
                        )}
                        {stage == 2 && (
                            <>
                                <FormInput textArea={true} title={'Descripción'} disabled={disabled} action={setDescription} placeholder={'Nota del movimiento'}/>
                                <FileInput action={setAttached_document} disabled={disabled} placeholder={'Adjuntar comprobante'}/>
                            </>
                        )}
                        <div className="buttonsC">
                            <FormButton text={stage != 2? 'Siguiente':`Crear ${movement_type}`} onClick={(e)=>{
                                if(stage < 2){
                                    e.preventDefault();
                                    setStage(prev => prev + 1);
                                }
                            }}/>
                            {stage > 0 && (
                                <FormButton negative={true} text={stage != 2? 'Anterior':`Cancelar`} onClick={(e)=>{
                                    e.preventDefault();
                                    if(stage <2){
                                        setStage(prev => prev - 1);
                                    }else{
                                        setStage(0)
                                    }
                                }}/>
                            )}
                        </div>
                    </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}