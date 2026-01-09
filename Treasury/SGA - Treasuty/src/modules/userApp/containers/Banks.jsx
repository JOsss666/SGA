

import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";

import './Banks.css';

export function Banks() {
    return (
        <div className="Banks">
            <div className="HeadBanks">
                <BoldTitle text="Bancos" />
                <DescriptionSpan text="Analiza, gestiona y parametriza los módulos de tu empresa" />
            </div>

            <div className="MenuBarBanks">
                <SearchBar placeholder="Buscar" />

                <i className="fa-solid fa-bars IconList" />
                <i className="fa-solid fa-table-cells-large IconList" />

                <SelectOptions
                    title="Orden"
                    options={["Ascendente", "Descendente"]}
                />

                <FormButton
                    text="Crear nuevo"
                    onClick={() =>
                        popInAlert(
                            <FormNewBanks/>
                        )
                    }
                >
                    <i className="fa-solid fa-plus" />
                </FormButton>
            </div>
        </div>
    );
}