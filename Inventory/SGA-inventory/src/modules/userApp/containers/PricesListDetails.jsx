
import { useParams } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'
import './PricesListDetails.css'
import { PathLocation } from '../components/PathLocation';
import { ListPriceProducts } from './ListPriceProducts';

export function PricesListDetails({info}){

    const params = useParams();

    return(
        <div className="PricesListDetails appSection">
            <PathLocation/>
            <SectionTitle text={`${params.priceListName}`}/>
            <div className="contentDetailsList">
                <div className="containerMainList">
                    <ListPriceProducts info={info}/>
                </div>
            </div>
        </div>
    )
}