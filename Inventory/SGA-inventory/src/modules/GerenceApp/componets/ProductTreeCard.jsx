
import './ProductTreeCard.css'
import { useAlert } from '../../../context/context'
import { PreviewProduct } from '../containers/alerts/PreviewProduct';

export function ProductTreeCard({info}){

    const {setOpenAlert,popInAlert} = useAlert();

    return(
        <div className="ProductTreeCard" onClick={()=>{
            popInAlert(
                <PreviewProduct info={info} />
            )
            setOpenAlert(true);
        }}>
            <img src="https://i.pinimg.com/1200x/b8/a3/e7/b8a3e7be8e0ac195fc16084a2ef5badb.jpg" alt="" />
            <div className="productInfo">
                <strong>{info.product_name}</strong>
                <h6>Codigo: #{info.product_code}</h6>
            </div>
        </div>
    )
}