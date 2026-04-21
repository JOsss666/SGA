import { ButtonDownload } from '../components/ButtonDownload'
import { ButtonMenu } from '../components/ButtonMenu'
import { AiButton } from '../components/ChatAiComponents/AiButton'
import { SearchBar } from '../components/SearchBar'
import { SelectOptions } from '../components/SelectOptions'
import { TablePrices } from '../components/TablePrices'
import { FormInput } from '../components/FormInput'
import './ListPriceProducts.css'
import { TableReport } from './TableReport'
import { useState } from 'react'
import { useAppInfo } from '../../../context/context'
import { TablePricesList } from './TablePricesList'

export function ListPriceProducts({info}){
    const {appInfo} = useAppInfo();
    const [searchValue,setSearchValue] = useState("");
    const [initial_date,setInitialDate] = useState();
    const [final_date,setFinalDate] = useState();

    const formSettings = {
        initial_date,
        final_date,
        company_id:appInfo.company_id
    }

   

    // <TablePrices columns={columnsList} info={info}/>

    return(
        <div className="ListPriceProducts">
            <div className="tablePrices">
                
            </div>
        </div>
    )
}