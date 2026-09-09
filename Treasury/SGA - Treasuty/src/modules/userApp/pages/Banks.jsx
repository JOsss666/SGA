import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormButton } from "../components/FormButton";
import { FormInput } from "../components/FormInput";
import { SearchBar } from "../components/SearchBar";
import './Banks.css'


export function Banks(){
    return(
        <div className="banks">
            <div className="headSection">
                <BoldTitle text={'Administración de Bancos'}/>
                <DescriptionSpan text={'Consulte saldo, cuentas y movimientos de su banco'}/>
            </div>
            <div className="filtersContainer">
                <SearchBar placeholder={'Buscar en bancos'}/>
                <div className="rangeInputs">

                </div>
                <FormButton text={'Crear banco'}>
                    <i className="fa-solid fa-plus"/>
                </FormButton>
            </div>
        </div>
    )
}
