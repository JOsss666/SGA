import { useAlert } from '../../../../context/context';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { NewElementSelect } from '../../components/NewElementSelect';
import { SearchinList } from '../../components/SearchInList';
import { FormNewThirdParties } from './FormNewThirdParties';
import './accountAjustemBlockItemRow.css';
import { TreeFormNewAccount } from './TreeFormNewAccount';

export function AccountAjustemBlockItemRow({
    line,
    index,
    accounts,
    thirdParties,
    costCenters,
    onChange,
    onInsert,
    onDuplicate,
    getAccounts,
    getThirdParties,
    onRemove,
}) {
    const lineNumber = index + 1;
    const {popInAlert} = useAlert();

    return (
        <div className="accountAjustemBlockItemRow">
            <div className="accountAjustemBlockItemRowInsert">
                <FormButton
                    type="button"
                    ariaLabel={`Insertar fila antes de la línea ${lineNumber}`}
                    onClick={onInsert}
                >
                    <i className="fa-solid fa-plus" aria-hidden="true" />
                </FormButton>
            </div>

            <span className="accountAjustemBlockItemRowNumber">{lineNumber}</span>

            <SearchinList
                title={`Código de cuenta línea ${lineNumber}`}
                placeHolder="Código o nombre"
                list={accounts}
                specialOption={
                    <NewElementSelect title={'Crear cuenta'} onClick={() => {
                        const fatherAccount = accounts.find(account => String(account.value) === String(line.account_id));
                        popInAlert(fatherAccount
                            ? <TreeFormNewAccount fatherInfo={fatherAccount} reloadINfo={getAccounts} />
                            : <span>Selecciona primero la cuenta que quieres usar como cuenta padre.</span>);
                    }}/>
                }
                action={value => onChange('account_id', value)}
            />

            <FormInput
                hideLabel
                required={false}
                ariaLabel={`Descripción línea ${lineNumber}`}
                value={line.description}
                action={value => onChange('description', value)}
            />

            <SearchinList
                title={`Nombre de tercero línea ${lineNumber}`}
                placeHolder="Buscar tercero"
                list={thirdParties}
                specialOption={
                    <NewElementSelect title="Crear nuevo tercero" onClick={() => {
                        popInAlert(<FormNewThirdParties quickCreation reloadFun={getThirdParties} />);
                    }}/>
                }
                action={value => onChange('thirdParty_id', value)}
                canClear
            />

            <FormInput
                hideLabel
                required={false}
                ariaLabel={`Débito línea ${lineNumber}`}
                type="number"
                min="0"
                step="0.01"
                value={line.debit}
                action={value => onChange('debit', value)}
            />

            <FormInput
                hideLabel
                required={false}
                ariaLabel={`Crédito línea ${lineNumber}`}
                type="number"
                min="0"
                step="0.01"
                value={line.credit}
                action={value => onChange('credit', value)}
            />

            <SearchinList
                title={`Centro de costo línea ${lineNumber}`}
                placeHolder="Centro de costo"
                list={costCenters}
                action={value => onChange('costCenter_id', value)}
                canClear
            />

            <div className="accountAjustemBlockItemRowActions">
                <FormButton
                    type="button"
                    ariaLabel={`Duplicar línea ${lineNumber}`}
                    onClick={onDuplicate}
                >
                    <i className="fa-regular fa-copy" aria-hidden="true" />
                </FormButton>
                <FormButton
                    type="button"
                    ariaLabel={`Eliminar línea ${lineNumber}`}
                    onClick={onRemove}
                >
                    <i className="fa-solid fa-trash-can" aria-hidden="true" />
                </FormButton>
            </div>
        </div>
    );
}
