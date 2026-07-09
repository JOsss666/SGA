
import { useEffect, useState } from 'react'
import { BoldTitle } from '../../components/BoldTitle'
import { FormInput } from '../../components/FormInput'
import {FormButton} from '../../components/FormButton'
import {postInfo} from '../../../../utils/functions'
import { useAppInfo, useNotifications } from '../../../../context/context'
import { useAlert } from '../../../../context/context'
import './FormNewProduct.css'
import { SearchinList } from '../../components/SearchInList'
import { NewElementSelect } from '../../components/NewElementSelect'
import { FileInput } from '../../components/FileInput'
import { FormNewCategory } from './FormNewCategory'
import { SwitchOption } from '../../components/SwitchOption'
import { DescriptionSpan } from '../../components/DescriptionSpan'
import { TagIndicator } from '../../components/TagIndicator'

export function FormNewProduct({info,update,reloadFun}){

    if(info == undefined){
        info = {}
    }

    // requiremts
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert, popOutAlert} = useAlert();
    const [concepts,setConcepts] = useState([]);
    const [accounts,setAccounts] = useState([]);
    const [categories,setCategories] = useState([]);
    const [ThirdParties,setThirdParties] = useState([]);
    const meassureUnitsList = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'mm2', 'cm2', 'm2', 'km2', 'in2', 'ft2', 'yd2', 'ml', 'l', 'm3', 'floz', 'pt', 'qt', 'gal', 'ft3', 'in3', 'mg', 'g', 'kg', 't', 'oz', 'lb', 'st', 'unit', 'pair', 'doz', 'box', 'pkg', 'bag', 'roll', 'set', 'tray', 'pallet', 'bar', 'sheet', 'm_roll', 'm2_sheet']
    const meassureUnits = meassureUnitsList.map(u => ({ text: u }));

    // control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [stage,setStage] = useState(0);
    const [taxes,setTaxes] = useState([]);

    // form info

        // Sec 0 --> General Info
        const [photo,setPhoto] = useState('https://res.cloudinary.com/djjxugmni/image/upload/v1764620093/ChatGPT_Image_1_dic_2025_15_04_38_3_hcdqxl.png');
        const [type_product,setType_product] = useState('product');
        const [name,setName] = useState('');
        const [code,setCode] = useState('');
        const [description,setDescription] = useState('');
        const [category_id,setCategory_id] = useState();
        // Sec 1 --> Inventoty Settings
        const [inventariable,setInventariable] = useState(false);
        const [units,setUnits] = useState();
        const [stock,setStock] = useState(0);
        const [minStock,setMinStock] = useState(0)
        const [maxStock,setMaxStock] = useState(0)
        const [availableDate,setAvailableDate] = useState('');
        const [aviableUnitl,setAviableUntil] = useState('');
        // Sec 2 --> Purchase
        const [defaultSupplier,setDefaultSupplier] = useState();
        const [purchaseConcept,setPurchaseConcept] = useState();
        const [purchaseTaxed,setPurchaseTaxed] = useState(false);
        const [purchaseTax_id,setPurchaseTax_id] = useState(false);
        const [purchaseWithholdings,setPurchaseWithholdings] = useState([]);
        // Sec 3 --> Sell
        const [sellDescription,setSellDescription] = useState('');
        const [sellConcept,setSellConcept] = useState();
        const [taxed,setTaxed] = useState(false);
        const [tax_id,setTax_id] = useState();
        const [sellWithholdings,setSellWithholdings] = useState([]);

    const formInfo = {
        company_id:appInfo.company_id,
        photo,
        name,
        code,
        description,
        category_id,
        units,
        stock,
        availableDate,
        defaultSupplier,
        sellDescription,
        sellConcept,
        purchaseConcept,
        tax_id,
        taxed,
        type_product
    }

    const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        let c = []
        res[1].forEach(element => {
            c.push({
                text:`${element.names} ${element.indentification_type}:${element.indentification_number}`,
                value:element.id
            })
        });
        setThirdParties(c)
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

    const getConcepts = async()=>{
        let res  = await postInfo('/getConcepts',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.name}`,
                    value:element.id,
                })
                setConcepts(C)
            });
        }
    }

    const getTaxes = async()=>{
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.tax_id
                })
            });
            setTaxes(C);
        }
    }

    const getCategories = async()=>{
        let res = await postInfo('/inventory/getCategories',{
            company_id:appInfo.company_id
        });
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.name}`,
                    value:element.id
                })
                setCategories(C)
            });
        }
    }

    const createProduct = async()=>{
        setDisabled(true);
        setLoading(true);
        console.log(formInfo)
        let res = await postInfo('/inventory/createProduct',formInfo);
        if(res){
            addNotification({
                type:'aproved',
                title:`Producto ${name} creado`,
                description:`El producto ${name} fue creado exitosamente`
            })
        }else{
            addNotification({
                type:'error',
                title:`Error al crear producto`,
                description:`Hubo un problema al crear el producto ${name}, intentelo de nuevo.`
            })
        }
        if(reloadFun != undefined){
            reloadFun();
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    const getRequierdData = async()=>{
        setDisabled(true);
        setLoading(true);
        await getThirdParties();
        await getCategories();
        await getAccounts();
        await getConcepts();
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        if(type_product == 'service'){
            setStock(1);
            setUnits('unit');
        }
    },[type_product])

    useEffect(()=>{
        if(!taxed){
            setTax_id(undefined);
        }else{
            getTaxes();
        }
    },[taxed])

    useEffect(()=>{
        getRequierdData();
    },[])

    useEffect(()=>{
        console.log(photo);
    },[photo])

    return(
        <div className="FormNewProduct">
            <BoldTitle text={'Nuevo Producto'}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                if(stage == 3){
                    createProduct();
                }else{
                    setStage(stage +1)
                }
            }}>
                {/* Stage for general info -- Etapa para configurar la info general*/}
                {stage == 0 && (
                    <section>
                        <div className="userPhoto">
                            <div className="actualPhoto">
                                <img src={photo} alt="" />
                            </div>
                            <FileInput action={setPhoto} placeholder={'Seleccionar nueva foto'}>
                                <i className="fa-solid fa-camera"/>
                            </FileInput>
                        </div>
                        {info.type == undefined && (
                            <SearchinList title={'Tipo de producto o servicio'} placeHolder={'Producto'} action={setType_product} list={[
                                {text:'Producto',value:'product'},
                                {text:'Servicio',value:'service'},
                                {text:'Consumo',value:'consume'},
                                {text:'Activo fijo',value:'fixed asset'},
                                {text:'Combo o Kit',value:'kit'}
                            ]}/>
                        )}
                        <FormInput title={'Código'} action={setCode} placeholder={'SKU#....'} value={code} disabled={disabled}/>
                        <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu producto'} value={name} disabled={disabled}/>
                        <SearchinList title={'Categorias'} action={setCategory_id} placeHolder={'Seleccine una o varias'} list={categories} specialOption={
                            <NewElementSelect title={'Crear nueva categoría'} onClick={()=>{
                                popInAlert(<FormNewCategory/>)
                            }}/>
                        } disabled={disabled}/>
                        <FormInput title={'Descripción'} action={setDescription} value={description} placeholder={'Descripción del producto'} disabled={disabled} textArea={true}/>
                    </section>
                )}
                {/* Stage for Inventory -- Etapa para configurar Inventarios*/}
                {stage == 1 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📦 Parametrización Inventario'} type={'suspended'}/>
                        </div>
                        <div className="accessSwitch">
                            <h6>Es Inventariable?</h6>
                            <SwitchOption action={setInventariable} defaultValue={inventariable}/>
                        </div>
                        {(inventariable) && (
                            <>
                                <SearchinList title={'Unidades de medida'} action={setUnits} placeHolder={'Seleccione unidad'} list={meassureUnits}/>
                                <FormInput title={'Stock inicial'} action={setStock} placeholder={'0 unidades'} value={stock} disabled={disabled}/>
                                <FormInput title={'Stock minimo'} action={setMinStock} placeholder={'0 unidades'} value={minStock} disabled={disabled}/>
                                <FormInput title={'Stock maximo'} action={setMaxStock} placeholder={'0 unidades'} value={maxStock} disabled={disabled}/>
                            </>
                        )}
                        <FormInput title={'Disponible a partir de'} action={setAvailableDate} value={availableDate} type={'date'} disabled={disabled}/>
                        <FormInput title={'Disponible hasta'} action={setAvailableDate} value={availableDate} type={'date'} disabled={disabled}/>
                    </section>
                )}
                {/* Stage for purchase -- Etapa para configurar la Compra*/}
                {stage == 2 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📑 Parametrización Compras'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Proveedor por defecto'} action={setDefaultSupplier} placeHolder={'Seleccione el proveedor'} list={ThirdParties} disabled={disabled}/>  
                        <SearchinList title={'Concepto de compra'} action={setPurchaseConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>  
                        <div className="accessSwitch">
                            <h6>Compra gravada con impuestos</h6>
                            <SwitchOption action={setPurchaseTaxed} defaultValue={purchaseTaxed}/>
                        </div>
                        {purchaseTaxed && (
                            <SearchinList title={'Impuesto asociado a la compra'} action={setPurchaseTax_id} placeHolder={'Seleccione el impuesto'} list={taxes} disabled={disabled}/>  
                        )}
                        <div className="withholdingsContainer">

                        </div>
                    </section>
                )}
                {/* Stage for sell -- Etapa para configurar la venta*/}
                {stage == 3 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'💶 Parametrización Ventas'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Concepto de venta'} action={setSellConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>  
                        <div className="accessSwitch">
                            <h6>Venta gravada con impuestos</h6>
                            <SwitchOption action={setTaxed} defaultValue={taxed}/>
                        </div>
                        {taxed && (
                            <SearchinList title={'Impuesto asociado a la venta'} action={setTax_id} placeHolder={'Seleccione el impuesto'} list={taxes} disabled={disabled}/>  
                        )}
                        <FormInput title={'Descripción para la venta'} action={setSellDescription} value={sellDescription} placeholder={'Detalles del producto para la venta'} disabled={disabled} textArea={true}/>
                        <div className="withholdingsContainer">

                        </div>
                    </section>
                )}

            <FormButton disabled={disabled} loading={loading} text={stage== 3? 'Crear Producto':'Siguiente'}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== 3? 'Cancelar':'Volver'} onClick={()=>{
                    if(stage < 3){
                        setStage(stage -1)
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
            </form>
        </div>
    )
}