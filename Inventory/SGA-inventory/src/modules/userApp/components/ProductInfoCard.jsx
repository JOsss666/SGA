import './ProductInfoCard.css'


export function ProductInfoCard({onClick,hidden,info}){
    return(
        <div onClick={onClick} style={{display:`${hidden? 'none':'flex'}`}} className="ProductInfoCard" title={`Ver estadisticas de ${info.product_name}`}>
            <img src="https://i.pinimg.com/736x/af/2a/b1/af2ab1586376d0334a4c06d1eddb25dc.jpg" alt="" />
            <div className="infoProducts">
                <h6>{info.product_name}</h6>
                <div className="detailProduct">
                    <span>Codigo:</span><strong>#{info.product_code}</strong>
                </div>
                <div className="detailProduct detPdes">
                    <span>Desc:</span><strong>{info.product_description}</strong>
                </div>
                <div className="detailProduct">
                    <span>Stock:</span><strong>{info.total_stock}</strong>
                </div>
            </div>
        </div>
    )
}