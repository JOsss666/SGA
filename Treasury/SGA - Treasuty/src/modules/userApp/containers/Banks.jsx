import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { TableDetailTreasury } from "../components/TableDetailTreasury";
import { useAppInfo } from "../../../context/context";
import { postInfo } from "../../../utils/functions";

import './Banks.css';
import { useNavigate, useParams } from "react-router-dom";

export function Banks() {

    const { appInfo } = useAppInfo();
    const [banks, setBanks] = useState([]);
    const [search, setSearch] = useState("");
    const params = useParams();
    const navigate = useNavigate();
    
    const handleNavigate = (path)=>{
        navigate(`/SGA_treasury/${params.company_key}/${params.user_key}/banks/${path}`);
    }


    /* Cambiar a true cuando el backend esté listo */
    const useBackend = false;

    const columns = [
        { label: "Banco", key: "card" },
        { label: "Tipo de Cuenta", key: "account_type" },
        { label: "Cuenta contable",key:'account_code'},
        { label: "Descripción", key: "account_description" },
        { label: "Estado", key: "state" },
        { label: "Saldo", key: "balance" }
    ];


    /* DATA DE EJEMPLO  */
    const dataBanks = [
        {
            id:1,
            name: "Bancolombia 1 Bogotá",
            description:'Esta es la franquicia',
            account_type: "Ahorros",
            account_description: "Descripción breve del banco y su uso",
            account_code:"1405",
            state: "Activo",
            balance: 200000,
            icon: <i className="fa-solid fa-unlock"/>,
            action:handleNavigate
        },
        {
            id:2,
            name: "Bancolombia 2",
            description:'Esta es la franquicia',
            account_type: "Ahorros",
            account_description: "Descripción breve del banco y su uso",
            account_code:"1405",
            state: "Activo",
            balance: 200000,
            icon: <i className="fa-solid fa-unlock"/>,
            action:handleNavigate
        },
        {
            id:3,
            name: "Bancolombia 3",
            description:'Esta es la franquicia',
            account_type: "Ahorros",
            account_description: "Descripción breve del banco y su uso",
            account_code:"1405",
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
            if (res[0]) setBanks(res[1]);
        } else {
            setBanks(dataBanks);
        }
    };

    useEffect(() => {
        getBanks();
    }, []);

    return (
        <div className="Banks">
            <BoldTitle text="Bancos" />
            <div className="HeadBanks">
                <div className="Head">
                    <DescriptionSpan text="Analiza, gestiona y parametriza los módulos de tu empresa" />
                </div>
                <div className="MenuBarBanks">
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
            </div>

            <div className="TableBanks">
                <TableDetailTreasury
                    data={banks}
                    columns={columns}
                    search={search}
                    headTable={true}
                />
            </div>
        </div>
    );
}
