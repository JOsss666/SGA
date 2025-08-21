
import { useEffect, useState } from 'react'
import { BoldTitle } from '../../componets/BoldTitle'
import { FormInput } from '../../componets/FormInput'
import {FormButton} from '../../componets/FormButton'
import {postInfo} from '../../../../utils/functions'
import { useAppinfo } from '../../../../context/context'
import { useAlert } from '../../../../context/context'
import './FormNewProduct.css'
import { SearchinList } from '../../componets/SearchInList'
import { NewElementSelect } from '../../componets/NewElementSelect'
import { FormNewSubCategory } from './FormNewSubCategory'

export function FormNewProduct({father,reloadFun}){

    if(father == undefined){
        father = {};
    }
    const {appInfo} = useAppinfo();

    const {popInAlert} = useAlert();
    const [typeUnits,setTypeUnits] = useState();
    const [unitsScale,setUnitsScale] = useState();
    const [unitsValueScale,setUnitsValueScale] = useState();
    const [name,setName] = useState('');
    const [description,setDescription] = useState('');
    const [supplier_id,setSupplierId] = useState('');
    const [category_id,setCategory_id] = useState('');
    const [product_code,setproductCode] = useState('');
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [categories,setCategories] = useState([])
    const [suppliers,setSuppliers] = useState([]);

    const formInfo = {
        name,
        company_id:appInfo.company_id,
        product_code,
        description,
        supplier_id,
        category_id,
        units: unitsValueScale
    }

    const getSuppliers = async()=>{
        let res = await postInfo('/getSuppliers',{company_id:appInfo.company_id});
        let c = []
        res[1].forEach(element => {
            c.push({
                text:`${element.supplier_id} ${element.supplier_name} (${element.supplier_nit})`,
                value:element.supplier_id
            })
        });
        setSuppliers(c)
    }

    const getCategories = async()=>{
        let res = await postInfo('/getSubCategories',{company_id:appInfo.company_id});
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                let tabs = (element.category_code).split(";");
                C.push({
                    text:`${" ".repeat(tabs.length)}${element.category_name}`,
                    value:element.category_id,
                })
            });
            setCategories(C)
        }
        
    }

    const createProduct = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createProduct',formInfo);
        console.log(res)
        setLoading(false);
        setDisabled(false);
        if(reloadFun != undefined){
            console.log('funcion recarga ejecutada')
            reloadFun();
        }
    }

    useEffect(()=>{
        switch(typeUnits){
            case "Volumen / Capacidad":setUnitsScale([
                {text:"ml"},{text:"cl"},{text:"L"},{text:"gal"},{text:"mm³"},{text:"cm³"},{text:"m³"},{text:"in³"},{text:"ft³"},{text:"bbl"},
            ]);break;
            case "Unidad":setUnitsScale([
                {text:"Unidad"}
            ]);break;
            case "Area / Superficie":setUnitsScale([
                {text:"mm²"},{text:"cm²"},{text:"m²"},{text:"dm²"},{text:"m²"},{text:"in²"},{text:"ft²"},{text:"yd²"},
            ]);break;
            case "Longitud / Distancia":setUnitsScale([
                {text:"mm"},{text:"cm"},{text:"m"},{text:"dm"},{text:"m"},{text:"in"},{text:"ft"},{text:"yd"},
            ]);break;
        }
        console.log(typeUnits)
    },[typeUnits])

    useEffect(()=>{
        getSuppliers();
        getCategories();
    },[])

    return(
        <div className="FormNewProduct">
            <BoldTitle text={'Nuevo Producto'}/>
            <form action="">
                <FormInput disabled={disabled} action={setName} title={'Nombre'} placeholder={'Nombre del producto'}/>
                <FormInput disabled={disabled} action={setproductCode} title={'Codigo'} placeholder={'Codigo del producto #A10'}/>
                <FormInput textArea={true} title={'Decripción para la venta'} placeholder={'Descripción del producto'} disabled={disabled} action={setDescription} />
                <SearchinList action={setSupplierId} specialOption={
                    <NewElementSelect title={'Nuevo Proveedor'}/>
                } list={suppliers} title={'Proveedor'} placeHolder={'Buscar Proveedor'} disabled={disabled}/>
                <SearchinList action={setCategory_id} specialOption={
                    <NewElementSelect title={'Nueva Categoria'} onClick={()=>{
                        popInAlert(<FormNewSubCategory father={father}/>)
                    }}/>
                } list={categories} title={'Categoria'} placeHolder={'Buscar Proveedor'} disabled={disabled}/>
                <SearchinList action={setTypeUnits} title={"Tipo medida unidad"} placeHolder={"Seleccione el tipo de medida"} list={[
                    {text:"Unidad"},{text:"Longitud / Distancia"},{text:"Area / Superficie"},{text:"Volumen / Capacidad"}
                ]}/>
                {unitsScale != undefined &&  unitsScale.length > 0 && (
                    <SearchinList action={setUnitsValueScale} title={"Unidad de medida"} placeHolder={"Seleccione el tipo de medida"} list={unitsScale}/>
                )}
                <FormButton loading={loading} onClick={(e)=>{e.preventDefault();createProduct()}} disabled={disabled} text={'Crear Producto'}/>
            </form>
        </div>
    )
}