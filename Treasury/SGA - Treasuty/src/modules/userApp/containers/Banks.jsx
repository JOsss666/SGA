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

export function Banks() {

    const { appInfo } = useAppInfo();
    const [banks, setBanks] = useState([]);
    const [search, setSearch] = useState("");

    /* Cambiar a true cuando el backend esté listo */
    const useBackend = false;

    const columns = [
        { label: "Banco", key: "bank_name" },
        { label: "Tipo de Cuenta", key: "account_type" },
        { label: "Descripción", key: "account_description" },
        { label: "Estado", key: "state" },
        { label: "Saldo", key: "balance" }
    ];


    /* DATA DE EJEMPLO  */
    const dataBanks = [
        {
            bank_name: "Banco No 1",
            account_type: "Cuenta Corriente",
            account_description: "Descripción breve del banco y su uso",
            state: "Activo",
            balance: 100000000,
            is_private: true
        },
        {
            bank_name: "Banco No 2",
            account_type: "Cuenta Contable",
            account_description: "Descripción breve del banco y su uso",
            state: "Activo",
            balance: -23580000,
            is_private: true
        },
        {
            bank_name: "Banco No 3",
            account_type: "Cuenta Corriente",
            account_description: "Descripción breve del banco y su uso",
            state: "Activo",
            balance: 100000000,
            is_private: true
        }
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
            <div className="HeadBanks">
                <BoldTitle text="Bancos" />
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

            <div className="TableBanks">
                <TableDetailTreasury
                    data={banks}
                    columns={columns}
                    search={search}
                />
            </div>
        </div>
    );
}
