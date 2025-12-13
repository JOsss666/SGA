import './ProductCard.css'
import { TagIndicator } from './TagIndicator'

export function ProductCard({info,display,onClick,hidden}){

    if(!hidden) return(
        <div className={`ProductCard ProductCard_${display}`} onClick={onClick}>
            <div className="imgContainer">
                <img src={info.img != undefined? info.img:'https://tiendafliv.com/wp-content/uploads/2021/07/Tornillo-3TPD16-Fb-Front-1.png'} alt="" />
            </div>
            <div className="ProductInfo">
                <strong>{info.name}</strong>
                <span>{info.description}</span>
            </div>
                        <div className="SKU_C">
                <TagIndicator title={`#${info.code}`}/>
            </div>
            <div className="attachedSpace">
                {info.categories.map((element,index)=>(
                    <TagIndicator title={element} key={index}/>
                ))}
            </div>
        </div>
    )
}