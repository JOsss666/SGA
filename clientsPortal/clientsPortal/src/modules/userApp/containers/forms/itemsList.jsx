import { FormInput } from "../../components/FormInput";
import { UserCard } from "../../components/UserCard";
import { SearchinList } from "../../components/SearchInList";
import { moneyFormat } from "../../../../utils/functions";
import './itemsList.css';

/**
 * ItemsList
 * Bloques de items (productos/servicios) extraídos del formulario de factura de venta.
 * Componente controlado: el estado vive en el formulario padre y se muta con `setItems`.
 *
 * Props:
 *  - blocks: array de bloques -> [{ docInfo?, items: [], aplyVoucher? }]
 *  - setItems: setter de estado del padre (setItemBlocks). Se usa con updater funcional.
 *  - disabled: deshabilita edición de los inputs.
 *  - productsAndServices: lista para el buscador "+ Agregar producto o servicio".
 *  - onDeleteInstance: callback opcional (instance_id) al eliminar un bloque ligado a un proceso.
 *  - title: título de la sección (opcional).
 */
export function ItemsList({
    blocks = [],
    setItems,
    disabled = false,
    productsAndServices = [],
    onDeleteInstance,
    title = 'Productos y servicios',
}) {

    // Precio efectivo según escalas de cantidad (price_tiers) del producto.
    const getEffectivePrice = (product, quantity) => {
        const qty = parseInt(quantity) || 0;
        if (!product.price_tiers || product.price_tiers.length === 0) {
            return product.unit_price || 0;
        }
        const applicableTier = [...product.price_tiers]
            .sort((a, b) => b.min_qty - a.min_qty)
            .find(tier => qty >= tier.min_qty);
        return applicableTier
            ? applicableTier.price
            : [...product.price_tiers].sort((a, b) => a.min_qty - b.min_qty)[0].price;
    };

    // Agregar producto/servicio: siempre al primer bloque (bloque manual).
    const handleAddItem = (element) => {
        if (element?.name == undefined) return;
        setItems(prev =>
            prev.map((block, index) =>
                index === 0
                    ? { ...block, items: [...block.items, { ...element, manualPrice: false }] }
                    : block
            )
        );
    };

    // Editar una propiedad de un item (units, unit_value, sell_desc, description...).
    const editProperty = (blockIndex, itemIndex, key, value) => {
        setItems(prev =>
            prev.map((block, bIdx) => {
                if (bIdx !== blockIndex) return block;

                const updatedItems = block.items.map((item, iIdx) => {
                    if (iIdx !== itemIndex) return item;

                    const textFields = ['description', 'sell_desc'];
                    const updatedValue = textFields.includes(key) ? value : Number(value);

                    let updatedItem = { ...item, [key]: updatedValue };

                    // Marcar precio manual cuando el usuario lo edita directamente.
                    if (key === 'unit_value') {
                        updatedItem.manualPrice = true;
                    }

                    // Al cambiar unidades, recalcular precio si no es manual.
                    if (key === 'units' && !updatedItem.manualPrice) {
                        updatedItem.unit_value = getEffectivePrice(item, updatedValue);
                    }

                    return updatedItem;
                });

                return { ...block, items: updatedItems };
            })
        );
    };

    // Eliminar un item puntual de un bloque.
    const handleDeleteItem = (blockIndex, itemIndex) => {
        setItems(prev =>
            prev.map((block, bIdx) => {
                if (bIdx !== blockIndex) return block;
                const filteredItems = block.items.filter((_, iIdx) => iIdx !== itemIndex);
                return { ...block, items: filteredItems };
            })
        );
    };

    // Eliminar/limpiar un bloque completo.
    // Bloque manual (docInfo === undefined) -> se vacían sus items.
    // Bloque de documento/orden -> se elimina el bloque (y se notifica el instance_id).
    const handleDeleteBlock = (blockIndex) => {
        const block = blocks[blockIndex];
        if (block && block.docInfo && block.docInfo.instance_id && onDeleteInstance) {
            onDeleteInstance(block.docInfo.instance_id);
        }
        setItems(prev => {
            const blockToProcess = prev[blockIndex];
            if (!blockToProcess) return prev;

            if (blockToProcess.docInfo === undefined) {
                return prev.map((b, index) =>
                    index === blockIndex ? { ...b, items: [] } : b
                );
            }
            return prev.filter((_, index) => index !== blockIndex);
        });
    };

    return (
        <div className="ItemsList">
            {title && <strong className="itemsListTitle">{title}</strong>}
            <div className="gridItemsContainer">
                {blocks?.map((block, index_block) => (
                    <div key={index_block} className="itemBlock">
                        <div className="headBlock">
                            <strong>
                                {block.docInfo != undefined
                                    ? `${block.docInfo.document_type}#${block.docInfo.ownSerial}`
                                    : 'Lista de productos y servicios'}
                            </strong>
                            <span>
                                Total: ${block.docInfo != undefined ? moneyFormat(block.docInfo.pending_value) : 0}
                            </span>
                            {!disabled && (
                                <span
                                    className="quitContainer"
                                    onClick={() => handleDeleteBlock(index_block)}
                                >
                                    <i className="fa-solid fa-trash" />
                                </span>
                            )}
                        </div>

                        <div className="gridItems">
                            {/* Items provenientes de un documento/orden: solo lectura. */}
                            {block.docInfo != undefined && block.items.map((item, index) => (
                                <div className="itemRow" key={index}>
                                    <UserCard imgSrc={item.service_img} name={item.service_name} />
                                    <strong className="valueItemRow">Unidades: {item.units}</strong>
                                    <strong className="valueItemRow">Val unidad: {moneyFormat(item.unit_value)}</strong>
                                    <strong className="valueItemRow">
                                        Total: {moneyFormat(parseFloat(item.units) * parseFloat(item.unit_value))}
                                    </strong>
                                </div>
                            ))}

                            {/* Items manuales: editables y eliminables. */}
                            {block.docInfo == undefined && block.items.map((item, index) => (
                                <div className="itemRow" key={index}>
                                    <UserCard imgSrc={item.img} name={item.name} />

                                    <strong className="valueItemRow rowInputItem">
                                        <FormInput
                                            title={'Unidades'}
                                            type={'number'}
                                            step="any"
                                            min={0}
                                            placeholder={0}
                                            required={true}
                                            value={item.units || ''}
                                            disabled={disabled}
                                            action={(value) => editProperty(index_block, index, 'units', value)}
                                        />
                                    </strong>

                                    {false && (
                                         <strong className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Val unidad'}
                                                type={'number'}
                                                step={0.01}
                                                min={0}
                                                required={false}
                                                defaultValue={item.unit_value}
                                                placeholder={item.unit_value ?? 0}
                                                disabled={disabled}
                                                action={(value) => editProperty(index_block, index, 'unit_value', value)}
                                            />
                                        </strong>
                                    )}

                                    <strong className="valueItemRow rowInputItem">
                                        <FormInput
                                            title={'Descripción item'}
                                            type={'text'}
                                            required={false}
                                            defaultValue={item.sell_desc ?? ''}
                                            placeholder={'Cod #...'}
                                            disabled={disabled}
                                            action={(value) => editProperty(index_block, index, 'sell_desc', value)}
                                        />
                                    </strong>

                                    <strong className="valueItemRow">
                                        Total: {moneyFormat(parseFloat(item.units) * parseFloat(item.unit_value))}
                                    </strong>

                                    {!disabled && (
                                        <span
                                            className="deleteItem"
                                            onClick={() => handleDeleteItem(index_block, index)}
                                        >
                                            <i className="fa-solid fa-xmark" />
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Buscador para agregar productos/servicios al bloque manual. */}
                        {block.docInfo == undefined && !disabled && (
                            <div className="personalizaedView">
                                <SearchinList
                                    noActVal={true}
                                    list={productsAndServices}
                                    action={handleAddItem}
                                    placeHolder={'+ Agregar producto o servicio'}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ItemsList;
