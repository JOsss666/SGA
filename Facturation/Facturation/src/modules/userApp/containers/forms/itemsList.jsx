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
    itemUnitsLabel,
    disabled = false,
    productsAndServices = [],
    visibleItemTotal,
    hasBudget,
    onDeleteInstance,
    title = 'Productos y servicios',
}) {

    const isAreaUnit = (unit) => ['mm2', 'cm2', 'm2', 'km2', 'in2', 'ft2', 'yd2', 'm2_sheet']
        .includes(String(unit ?? '').trim().toLowerCase());

    const getAreaLengthUnit = (areaUnit) => ({
        mm2: 'mm', cm2: 'cm', m2: 'm', km2: 'km',
        in2: 'in', ft2: 'ft', yd2: 'yd', m2_sheet: 'm'
    })[String(areaUnit ?? '').trim().toLowerCase()] ?? '';

    const getPresetAreaUnit = (item) => item.is_preset
        ? item.components?.find(component => isAreaUnit(component.unit_measure))?.unit_measure ?? ''
        : '';

    const calculateArea = (width, height) => {
        if (width === '' || height === '' || width == null || height == null) return 0;
        const parsedWidth = Number(width);
        const parsedHeight = Number(height);
        return Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight) && parsedWidth > 0 && parsedHeight > 0
            ? parsedWidth * parsedHeight
            : 0;
    };

    const getItemTotals = (item) => {
        const numberOrZero = value => Number.isFinite(Number(value)) ? Number(value) : 0;
        const total = numberOrZero(item.units) * numberOrZero(item.unit_value);
        const taxRate = Math.max(0, numberOrZero(item.tax_rate));
        const subTotal = total / (1 + taxRate / 100);
        return { subTotal, taxes: total - subTotal, total };
    };

    // Precio efectivo según escalas de cantidad (price_tiers) del producto.
    const getEffectivePrice = (product, quantity) => {
        const parsedQuantity = Number(quantity);
        const qty = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
        const tiers = (Array.isArray(product.price_tiers) ? product.price_tiers : [])
            .map(tier => ({ min_qty: Number(tier.min_qty) || 0, price: Number(tier.price) }))
            .filter(tier => Number.isFinite(tier.price))
            .sort((a, b) => a.min_qty - b.min_qty);

        if (tiers.length === 0) {
            const fallbackPrice = Number(product.unit_value ?? product.unit_price);
            return Number.isFinite(fallbackPrice) ? fallbackPrice : 0;
        }

        const applicableTier = [...tiers].reverse().find(tier => qty >= tier.min_qty);
        return (applicableTier ?? tiers[0]).price;
    };

    // Agregar producto/servicio: siempre al primer bloque (bloque manual).
    const handleAddItem = (element) => {
        if (element?.name == undefined) return;
        const unitMeasure = element.unit_measure ?? element.units;
        setItems(prev =>
            prev.map((block, index) =>
                index === 0
                    ? { ...block, items: [...block.items, {
                        ...element,
                        unit_measure: unitMeasure,
                        areaWidth: '',
                        areaHeight: '',
                        units: isAreaUnit(unitMeasure) ? 0 : element.units,
                        unit_value: getEffectivePrice(element, element.units ?? 0),
                        manualPrice: false
                    }] }
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

                    const textFields = ['description', 'sell_desc', 'areaWidth', 'areaHeight'];
                    const updatedValue = textFields.includes(key) ? value : Number(value);

                    let updatedItem = { ...item, [key]: updatedValue };

                    if ((key === 'areaWidth' || key === 'areaHeight') && isAreaUnit(item.unit_measure)) {
                        updatedItem.units = calculateArea(
                            key === 'areaWidth' ? value : item.areaWidth,
                            key === 'areaHeight' ? value : item.areaHeight
                        );
                        if (!updatedItem.manualPrice) {
                            updatedItem.unit_value = getEffectivePrice(item, updatedItem.units);
                        }
                    }

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
                            {visibleItemTotal == undefined && visibleItemTotal != false && (
                                <span>
                                    Total: ${block.docInfo != undefined ? moneyFormat(block.docInfo.pending_value) : 0}
                                </span>
                            )}
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
                            {block.docInfo != undefined && block.items.map((item, index) => {
                                const { subTotal, taxes, total } = getItemTotals(item);
                                return (
                                <div className="itemRow" key={index}>
                                    <UserCard imgSrc={item.service_img} name={item.service_name} />
                                    <strong className="valueItemRow">{itemUnitsLabel ?? 'Unidades'}: {item.units}</strong>
                                    <strong className="valueItemRow">Val unidad: {moneyFormat(item.unit_value)}</strong>
                                    {visibleItemTotal == undefined && visibleItemTotal != false && (
                                        <>
                                            <strong className="valueItemRow">Sub-total: {moneyFormat(subTotal)}</strong>
                                            <strong className="valueItemRow">Impuestos: {moneyFormat(taxes)}</strong>
                                            <strong className="valueItemRow">Total: {moneyFormat(total)}</strong>
                                        </>
                                    )}

                                    
                                </div>
                                );
                            })}

                            {/* Items manuales: editables y eliminables. */}
                            {block.docInfo == undefined && block.items.map((item, index) => {
                                const { subTotal, taxes, total } = getItemTotals(item);
                                const presetAreaUnit = getPresetAreaUnit(item);
                                return (
                                <div className="itemRow" key={index}>
                                    <div className="itemInfo">
                                        <UserCard imgSrc={item.img} name={item.name} />
                                    </div>

                                    <div className={`itemINputs${presetAreaUnit ? ' itemINputsWithPresetArea' : ''}`}>
                                        <strong className="valueItemRow rowInputItem descriptionRow">
                                            <FormInput
                                                title={'Descripción'}
                                                type={'text'}
                                                required={false}
                                                defaultValue={item.sell_desc ?? ''}
                                                placeholder={'Cod #...'}
                                                disabled={disabled}
                                                action={(value) => editProperty(index_block, index, 'sell_desc', value)}
                                            />
                                        </strong>
                                        {isAreaUnit(item.unit_measure) ? (
                                            <div className="areaDimensionFields">
                                                <div className="areaDimensionInput">
                                                    <FormInput
                                                        title={`Ancho (${getAreaLengthUnit(item.unit_measure)})`}
                                                        type="number"
                                                        step="any"
                                                        min="0.000001"
                                                        placeholder={0}
                                                        required={true}
                                                        value={item.areaWidth ?? ''}
                                                        disabled={disabled}
                                                        action={(value) => editProperty(index_block, index, 'areaWidth', value)}
                                                    />
                                                </div>
                                                <div className="areaDimensionInput">
                                                    <FormInput
                                                        title={`Alto (${getAreaLengthUnit(item.unit_measure)})`}
                                                        type="number"
                                                        step="any"
                                                        min="0.000001"
                                                        placeholder={0}
                                                        required={true}
                                                        value={item.areaHeight ?? ''}
                                                        disabled={disabled}
                                                        action={(value) => editProperty(index_block, index, 'areaHeight', value)}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                            <strong className="valueItemRow rowInputItem">
                                                <FormInput
                                                    title={itemUnitsLabel ?? 'Unidades'}
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
                                            {presetAreaUnit && (
                                                <div className="areaDimensionFields">
                                                    <div className="areaDimensionInput">
                                                        <FormInput
                                                            title={`Ancho (${getAreaLengthUnit(presetAreaUnit)})`}
                                                            type="number"
                                                            step="any"
                                                            min="0.000001"
                                                            placeholder={0}
                                                            required={true}
                                                            value={item.areaWidth ?? ''}
                                                            disabled={disabled}
                                                            action={(value) => editProperty(index_block, index, 'areaWidth', value)}
                                                        />
                                                    </div>
                                                    <div className="areaDimensionInput">
                                                        <FormInput
                                                            title={`Alto (${getAreaLengthUnit(presetAreaUnit)})`}
                                                            type="number"
                                                            step="any"
                                                            min="0.000001"
                                                            placeholder={0}
                                                            required={true}
                                                            value={item.areaHeight ?? ''}
                                                            disabled={disabled}
                                                            action={(value) => editProperty(index_block, index, 'areaHeight', value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            </>
                                        )}

                                        <strong className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Val unitario'}
                                                type={'number'}
                                                step={0.01}
                                                min={0}
                                                required={false}
                                                value={item.unit_value ?? ''}
                                                placeholder={item.unit_value ?? 0}
                                                disabled={disabled}
                                                action={(value) => editProperty(index_block, index, 'unit_value', value)}
                                            />
                                        </strong>                                   


                                        <div className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Sub-total'}
                                                type={'text'}
                                                required={false}
                                                value={moneyFormat(subTotal)}
                                                disabled={true}
                                            />
                                        </div>

                                        <div className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Impuestos'}
                                                type={'text'}
                                                required={false}
                                                value={moneyFormat(taxes)}
                                                disabled={true}
                                            />
                                        </div>

                                        <div className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Total'}
                                                type={'text'}
                                                required={false}
                                                value={moneyFormat(total)}
                                                disabled={true}
                                            />
                                        </div>
                                        

                                        {hasBudget && (
                                            <strong className="valueItemRow rowInputItem">
                                                <FormInput
                                                    title={'Costo'}
                                                    type={'number'}
                                                    step={0.01}
                                                    min={0}
                                                    required={false}
                                                    defaultValue={item.bugetCost}
                                                    placeholder={item.bugetCost ?? 0}
                                                    disabled={disabled}
                                                    action={(value) => editProperty(index_block, index, 'bugetCost', value)}
                                                />
                                            </strong>
                                        )}
                                        {!disabled && (
                                            <span
                                                className="deleteItem"
                                                onClick={() => handleDeleteItem(index_block, index)}
                                            >
                                                <i className="fa-solid fa-xmark" />
                                            </span>
                                        )}  

                                    </div>
                                </div>
                                );
                            })}
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
