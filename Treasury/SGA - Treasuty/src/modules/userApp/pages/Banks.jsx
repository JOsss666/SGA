import { useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormButton } from "../components/FormButton";
import { SearchBar } from "../components/SearchBar";
import { BankCard } from "../components/BankCard";
import { BankDetails } from "./BankDetails";
import "./Banks.css";

const banksData = [
    {
        id: 1,
        title: "Bancolombia",
        description: "Cuenta principal para operaciones y pagos.",
        notifications: 3,
    },
    {
        id: 2,
        title: "Davivienda",
        description: "Cuenta empresarial para recaudos.",
        notifications: 0,
    },
    {
        id: 3,
        title: "Banco de Bogotá",
        description: "Cuenta para transferencias y pagos a proveedores.",
        notifications: 5,
    },
    {
        id: 4,
        title: "BBVA",
        description: "Cuenta de ahorros para operaciones de la empresa.",
        notifications: 1,
    },
    {
        id: 5,
        title: "Banco de Occidente",
        description: "Cuenta empresarial para movimientos bancarios.",
        notifications: 0,
    },
];

export function Banks() {
    const [searchValue, setSearchValue] = useState("");
    const [selectedBank, setSelectedBank] = useState(null);

    if (selectedBank) {
        return (
            <BankDetails
                info={selectedBank}
                onBack={() => setSelectedBank(null)}
            />
        );
    }

    const searchText = searchValue.trim().toLocaleLowerCase("es");

    const filteredBanks = banksData.filter((bank) =>
        bank.title.toLocaleLowerCase("es").includes(searchText) ||
        bank.description.toLocaleLowerCase("es").includes(searchText)
    );

    return (
        <div className="banks">
            <div className="headSection">
                <BoldTitle text="Administración de Bancos" />
                <DescriptionSpan text="Consulte saldo, cuentas y movimientos de su banco" />
            </div>

            <div className="filtersContainer">
                <SearchBar
                    placeholder="Buscar en bancos"
                    value={searchValue}
                    action={setSearchValue}
                />

                <FormButton
                    className="banksCreateButton"
                    text="Crear banco"
                >
                    <i className="fa-solid fa-plus" />
                </FormButton>
            </div>

            <div className="banksCards">
                {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => (
                        <BankCard
                            key={bank.id}
                            info={bank}
                            onDetails={() => setSelectedBank(bank)}
                        />
                    ))
                ) : (
                    <p className="banksEmpty">
                        No se encontraron bancos con esa búsqueda.
                    </p>
                )}
            </div>
        </div>
    );
}