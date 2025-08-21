import { useEffect, useState } from "react";
import { postInfo } from "../../../utils/functions";
import { SectionTitle } from "../componets/SectionTitle";
import { useAppinfo } from "../../../context/context";
import { PathLocation } from "../componets/PathLocation";
import { TableMovements } from "./TableMovements";
import './RecordMovements.css'
import { SearchBar } from "../componets/SearchBar";
import { SelectOptions } from "../componets/SelectOptions";

export function RecordMovents({info}){

    const [movements,setMovements] = useState([]);
    const {appInfo} = useAppinfo();

    const getMovements = async()=>{
        let res = await postInfo('/getMovements',{company_id:appInfo.company_id,cellar_name:true})
        if(res[0]){
            setMovements(res[1]);
        }
    }

    const columnsMovements = ["#","Tipo","Valor Doc","Usuario","Tienda","Bodega","Transacciones","Fecha doc","Descripción","Estado"];

    useEffect(()=>{
        getMovements();
    },[])

    return(
        <div className="RecordMovents appSection">
            <PathLocation/>
            <SectionTitle text={"Historial de movimientos"}/>
            <div className="menuFilterTable">
                <SearchBar placeholder={"Buscar Movimiento"}/>
                <SelectOptions options={[
                    "Fecha Ascendente",
                    "Fecha descendente",
                    "Valor Ascendente",
                    "Valor descendente"
                ]}/>
                <SelectOptions options={[
                    "Filtrar",
                ]}/>
            </div>
            <div className="tableMovementsContainer">
                <TableMovements type={'movments'} columns={columnsMovements} movements={movements}/>
            </div>
        </div>
    )
}