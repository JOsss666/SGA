

import { ButtonAccounts } from '../../Login/components/ButtonAccounts';
import { BoldTitle } from './BoldTitle';
import './CardProduct.css';
import { DescriptionSpan } from './DescriptionSpan';
import image from '../../../assets/productoTest.png';
import { FormButton } from './FormButton';

export function CardProduct({info}){

    return(
        <div className="CardProduct">
            <div className="SKU">
                <h1>#SKU_123</h1>
            </div>
            <div className="Image">
                <img src={image} alt="Imagen del producto"/>
            </div>
            <div className="InfoProducto">
                <BoldTitle text={"Nombre del producto"}/>
                <DescriptionSpan text={"Descripción breve del producto, características principales y demás información relevante."}/>
                <FormButton text={"Eliminar de esta categoría"} onClick={()=>{}}/>
            </div>
        </div>
    )
}