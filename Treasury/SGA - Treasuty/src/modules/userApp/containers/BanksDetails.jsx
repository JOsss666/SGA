

import { BoldTitle } from '../components/BoldTitle';
import { PathLocation } from '../components/PathLocation';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from "react";
import { TableDetailTreasury } from '../components/TableDetailTreasury';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { useAppInfo } from '../../../context/context';
import './BanksDetails.css';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { useNavigate, useParams } from "react-router-dom";

export function BanksDetails() {

    /* VARIABLES PATCH */
    const location = useLocation();
    const paths = location.pathname.split("/").filter(Boolean);
    const lastPath = paths[paths.length - 1];

    /* VARIABLES PARA EL CARROUSEL */
    const [actualSection,setActualSection] = useState(0)
    const sections = [
        'Información General',
        'Cuentas',
        'Actividad',
        'Informes',
        'Estadisticas'
    ];


    /* VARIABLES TABLA */
    const { appInfo } = useAppInfo();
    const [detailBank, setDetailBank] = useState([]);
    const [search, setSearch] = useState("");
    const params = useParams();
    const navigate = useNavigate();

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/banks/${path}`);
    }

    /* Cambiar a true cuando el backend esté listo */
    const useBackend = false;

    const columns = [
        { label: "Cuenta", key: "card" },
        { label: "Tipo de Cuenta", key: "account_type" },
        { label: "No Cuenta",key:'account_number'},
        { label: "Cuenta contable",key:'account_code'},
        { label: "Centro de costo", key: "centro_costo" },
        { label: "Estado", key: "state" },
        { label: "Saldo", key: "balance" }
    ];


    /* DATA DE EJEMPLO  */
    const dataDetailBank = [
        {
            id:1,
            name: "Cuenta No 1",
            description:'Esta es la franquicia',
            account_type: "Ahorros",
            account_number:"123456789",            
            account_code:"Cuenta contable",
            centro_costo:"Centro de costo",
            state: "Activo",
            balance: 200000,
            icon: <i className="fa-solid fa-unlock"/>,
            action:handleNavigate
        },
        {
            id:2,
            name: "Cuenta No 2",
            account_type: "Corriente",
            account_number:"321456789",            
            account_code:"Cuenta contable",
            centro_costo:"Centro de costo",
            state: "Activo",
            balance: -400000,
            icon: <i className="fa-solid fa-unlock"/>,
            action:handleNavigate
        },
        {
            iid:3,
            name: "Cuenta No 3",
            account_type: "Ahorros",
            account_number:"312654789",            
            account_code:"Cuenta contable",
            centro_costo:"Centro de costo",
            state: "Activo",
            balance: 200000,
            icon: <i className="fa-solid fa-unlock"/>,
            action:handleNavigate
        },
    ];

    const getBanks = async () => {
        if (useBackend) {
            const res = await postInfo("/treasury/getAccounts", {
                company_id: appInfo.company_id
            });
            if (res[0]) setDetailBank(res[1]);
        } else {
            setDetailBank(dataDetailBank);
        }
    };

    useEffect(() => {
        getBanks();
    }, []);

    return (
        <div className="BanksDetails">
            <PathLocation/>
            <BoldTitle text={lastPath} />
            <DescriptionSpan text={'Esta es la descripción breve del banco '}/>

            <div className="CarrouselOptions">
                {sections.map((element,index)=>(
                    <h4 className={index== actualSection? 'activeSec':''} onClick={()=>{
                        setActualSection(index)
                    }} key={index}>{element}</h4>
                ))}
                <div className="CarrouselIndicator" style={{
                    left:`${actualSection * 14}vw`
                }}/>
            </div>

            <div className="MenuBarDetailBank">
                <SearchBar placeholder="Buscar" action={setSearch} />

                <i className="fa-solid fa-bars IconList" />
                <i className="fa-solid fa-table-cells-large IconList" />

                <SelectOptions
                    title="Orden"
                    options={["Ascendente", "Descendente"]}
                />

                <FormButton text="Crear nuevo">
                    <i className="fa-solid fa-plus" />
                </FormButton>
            </div>

            <div className="TableDetailBank">
                <TableDetailTreasury
                    data={detailBank}
                    columns={columns}
                    search={search}
                    headTable={true}
                />
            </div>
        </div>
    );
}

