import { SearchinList } from './SearchInList';
import { formatDate, moneyFormat } from '../../../utils/functions';
import './clientOrderDelegationCard.css';

export function ClientOrderDelegationCard({
    order,
    relationsByItem = new Map(),
    thirdparties = [],
    disabled = false,
    onSupplierChange,
    onPreviewAttachment
}){
    const selectedSuppliers = new Map();
    let assignedCount = 0;
    for(const item of order.items){
        const relation = relationsByItem.get(String(item.id));
        if(!relation?.asigned || relation.thirdParty_id == null || relation.thirdParty_id === '') continue;
        assignedCount += 1;
        selectedSuppliers.set(String(relation.thirdParty_id), relation.thirdParty_name || `Proveedor #${relation.thirdParty_id}`);
    }
    const allAssigned = order.items.length > 0 && assignedCount === order.items.length;
    const supplierNames = [...selectedSuppliers.values()].join(', ');
    const assignmentStatus = `${assignedCount} de ${order.items.length} ítems asignados`;

    return (
        <div className="clientOrderDelegationCard">
            <div className="headOrderBlock">
                <i className="bi bi-receipt"/>
                <h3>{`${order.document_type}#${order.ownSerial}`}</h3>
                <span>{formatDate(order.created_at,true)}</span>
                {selectedSuppliers.size > 0 && (
                    <div className="asignedIndicator">
                        <i className="bi bi-arrow-right"/>
                        <span title={supplierNames}>{supplierNames}</span>
                    </div>
                )}
                <i
                    className={`bi bi-lightbulb-fill statusLight ${allAssigned ? 'isAssigned' : 'isUnassigned'}`}
                    role="img"
                    aria-label={assignmentStatus}
                    title={assignmentStatus}
                />
            </div>
            <div className="bodyOrderBlock">
                {order.items.length > 0 ? (
                    <ul className="itemsList" aria-label={`Ítems de la orden ${order.ownSerial}`}>
                        {order.items.map(item => {
                            const relation = relationsByItem.get(String(item.id));
                            return (
                            <li key={item.id}>
                                <div className="borderCurve"/>
                                <img src={item.service_img} alt="" />
                                <div className="itemData">
                                    <strong>{item.service_name}</strong>
                                    <div className="units">
                                        <span>{`${item.units} ${item.service_units}`}</span>
                                        <span>${moneyFormat(parseFloat(item.units)*parseFloat(item.unit_value))}</span>
                                    </div>
                                    {item.description && (
                                        <span className='itemDesc'>Nota: {item.description}</span>
                                    )}
                                </div>
                                <div className="selectThirdPartyCotnainer">
                                    <SearchinList
                                        title={'Proveedor asignado'}
                                        placeHolder={'Seleccione un proveedor'}
                                        list={thirdparties}
                                        disabled={disabled || !relation || relation.disabled}
                                        value={relation?.thirdParty_id ?? null}
                                        canClear
                                        action={supplier => onSupplierChange(item.id, supplier)}
                                    />
                                </div>
                            </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p>Esta orden no tiene ítems adjuntos.</p>
                )}
                <div className="footerData">
                    {order.description != '' && order.description != undefined && (
                        <span>Descripción: {order.description}</span>
                    )}
                    <div className="attachedContainer">
                        <h6>Documentos adjuntos</h6>
                        {order.attached != undefined && order.attached != "" && (
                            (JSON.parse(order.attached)).map((element,index)=>(
                                <div className="attachedCard" key={index} onClick={()=>{
                                    onPreviewAttachment(element.id)
                                }}>
                                    <i className="bi bi-card-image"/>
                                    <span>{element.url}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
