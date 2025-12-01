
import { useEffect, useRef, useState } from 'react'
import { BoldButton } from '../../components/BoldButton'
import { UserCard } from '../../components/UserCard'
import { useAlert } from '../../../../context/context'
import './PreviewProduct.css'
import { FormFile } from '../forms/FormFile'

export function PreviewProduct({info}){

    const {popInAlert} = useAlert();
    const [hideNewImage, setHideNewImage] = useState(true);
    const imgContainer = useRef();

    useEffect(()=>{
        imgContainer.current.addEventListener('mouseenter',()=>{
            setHideNewImage(false)
        })
        imgContainer.current.addEventListener('mouseleave',()=>{
            setHideNewImage(true);
        })
    },[])

    return(
        <div className="PreviewProduct">
            <div ref={imgContainer} className="imgContainer">
                {!hideNewImage && (
                    <div title='Agregar nueva imagen' className="newImgContainer" onClick={()=>{
                        popInAlert(<FormFile/>);
                    }}>
                        <i className="fa-solid fa-photo-film"/>
                        <span>Agregar nueva imagen a {info.product_name}.</span>
                    </div>
                )}
                <img src="https://i.pinimg.com/1200x/b8/a3/e7/b8a3e7be8e0ac195fc16084a2ef5badb.jpg" alt="" />
                <div className="optionsProduct">
                    <BoldButton title={'Editar información'} children={<i className="fa-solid fa-pen-to-square"/>}/>
                    <BoldButton title={'Eliminar producto'} children={<i className="fa-solid fa-trash"/>}/>
                    <BoldButton title={'Reportar'} children={<i className="fa-solid fa-flag"/>}/>
                </div>
            </div>
            <div className="productInfo">
                <strong>{info.product_name} <h6># {info.product_code}</h6></strong>
                <span>{info.product_description}</span>
                <span className='providerDes'>Precios :</span>
                <span className='providerDes'>Proveedor :</span>
                <UserCard name={'Proveedor'} roll={"decripción"}/>
                <span className='providerDes'>Estadisticas :</span>
            </div>
        </div>
    )
}