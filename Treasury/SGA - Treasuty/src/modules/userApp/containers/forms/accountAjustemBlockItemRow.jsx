import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { SearchinList } from '../../components/SearchInList';
import './accountAjustemBlockItemRow.css';

export function AccountAjustemBlockItemRow({ line, index, accounts, thirdParties, costCenters, onChange, onInsert, onDuplicate, onRemove }) {
    return <div className="accountAjustemBlockItemRow">
        <div className="accountAjustemBlockItemRowInsert"><FormButton type="button" ariaLabel={`Insertar fila antes de la línea ${index + 1}`} onClick={onInsert}><i className="fa-solid fa-plus" aria-hidden="true" /></FormButton></div>
        <span className="accountAjustemBlockItemRowNumber">{index + 1}</span>
        <SearchinList title={`Código de cuenta línea ${index + 1}`} placeHolder="Código o nombre" list={accounts} action={value => onChange('account_id', value)} />
        <FormInput hideLabel required={false} ariaLabel={`Descripción línea ${index + 1}`} value={line.description} action={value => onChange('description', value)} />
        <SearchinList title={`Nombre de tercero línea ${index + 1}`} placeHolder="Buscar tercero por nombre" list={thirdParties} action={value => onChange('thirdParty_id', value)} canClear />
        <FormInput hideLabel required={false} ariaLabel={`Débito línea ${index + 1}`} type="number" min="0" step="0.01" value={line.debit} action={value => onChange('debit', value)} />
        <FormInput hideLabel required={false} ariaLabel={`Crédito línea ${index + 1}`} type="number" min="0" step="0.01" value={line.credit} action={value => onChange('credit', value)} />
        <SearchinList title={`Centro de costo línea ${index + 1}`} placeHolder="Seleccionar CC" list={costCenters} action={value => onChange('costCenter_id', value)} canClear />
        <div className="accountAjustemBlockItemRowActions"><FormButton type="button" ariaLabel={`Duplicar línea ${index + 1}`} onClick={onDuplicate}><i className="fa-regular fa-copy" aria-hidden="true" /></FormButton><FormButton type="button" ariaLabel={`Eliminar línea ${index + 1}`} onClick={onRemove}><i className="fa-solid fa-trash-can" aria-hidden="true" /></FormButton></div>
    </div>;
}
