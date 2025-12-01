import { BoldButton } from "../../components/BoldButton";
import { BoldTitle } from "../../components/BoldTitle";
import { NewElementSelect } from "../../components/NewElementSelect";
import { TitleValue } from "../../components/TitleValue";
import './PreviewCellar.css'
import { useEffect, useState } from "react";
import { postInfo } from "../../../../utils/functions";
import { ProductTreeCard } from "../../components/ProductTreeCard";
import { useAlert } from "../../../../context/context";
import { FormNewProduct } from "../forms/FormNewProduct";

export function PreviewCellar({info}){
    const {popInAlert,setOpenAlert} = useAlert();
    const [products,setProducts] = useState([]);

    const getProducts = async()=>{
        let res = await postInfo('/getProducts',{
            company_id:info.company_id,
            store_id:info.store_id,
            cellar_id:info.cellar_id
        })
        if(res[0]){
            setProducts(res[1])
        }
    }

    useEffect(()=>{
        getProducts();
    })
    
    return(
        <div className="PreviewCellar">
            <div className="headPrevCellar">
                <div className="inconCellarC">
                    <i className="fa-solid fa-boxes-packing"/>
                </div>
                <div className="infoCellar">
                    <BoldTitle text={info.cellar_name} />
                    <span>{info.cellar_location}</span>
                </div>
                <div className="menuCellar">
                    <BoldButton children={<i className="fa-solid fa-pencil"/>} title={`Editar ${info.cellar_name}`}/>
                    <BoldButton children={<i className="fa-solid fa-trash"/>} title={'Eliminar boddéga'}/>
                </div>
            </div>
            <div className="bodyCellar">
                <TitleValue title={'Secciones'} value={
                    <div className="SectionsContainer">
                        <NewElementSelect title={"Crear Sección"}/>
                    </div>
                }/>
                <TitleValue title={'Productos'} value={
                    <div className="productsContainer">
                        <NewElementSelect title={"Crear producto"} onClick={()=>{
                            popInAlert(<FormNewProduct/>)
                            setOpenAlert(true);
                        }}/>
                        {products.le > 0 && products.map((element,index)=>(
                            <ProductTreeCard info={element} key={index}/>
                        ))}
                    </div>
                }/>
            </div>
        </div>
    )
}