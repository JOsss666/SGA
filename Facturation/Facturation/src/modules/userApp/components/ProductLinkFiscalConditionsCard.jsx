import { useEffect, useMemo, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { SearchinList } from './SearchInList';
import './ProductLinkFiscalConditionsCard.css';

const RELATION_CONFIG = {
    purchase_tax: { operation_type: 'purchase', tax_role: 'tax' },
    purchase_withholding: { operation_type: 'purchase', tax_role: 'withholding' },
    sell_tax: { operation_type: 'sell', tax_role: 'tax' },
    sell_withholding: { operation_type: 'sell', tax_role: 'withholding' }
};

const OPERATION_LABELS = {
    purchase: 'Compra',
    sell: 'Venta'
};

const ROLE_LABELS = {
    tax: 'Impuestos',
    withholding: 'Retenciones'
};

const normalizeRelation = (relation) => {
    const config = RELATION_CONFIG[relation.relation_type ?? relation.type];
    if (!config) return null;

    return {
        relationKey: `${config.operation_type}-${config.tax_role}-${relation.tax_id}`,
        product_id: relation.product_id,
        tax_id: relation.tax_id,
        operation_type: config.operation_type,
        tax_role: config.tax_role,
        tax_name: relation.tax_name ?? relation.name ?? relation.code ?? `Impuesto ${relation.tax_id}`,
        tax_code: relation.tax_code ?? relation.code,
        rate: relation.rate,
        base: relation.base
    };
};

export function ProductLinkFiscalConditionsCard({
    companyId,
    info,
    disabled,
    value = [],
    action
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [relationsByProduct, setRelationsByProduct] = useState({});
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedRelations, setSelectedRelations] = useState(value);

    const selectedRelationsKeys = useMemo(() => {
        return new Set(selectedRelations.map((relation) => (
            `${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`
        )));
    }, [selectedRelations]);

    const productOptions = useMemo(() => {
        const selectedIds = new Set(selectedProducts.map((product) => product.id));
        return products
            .filter((product) => !selectedIds.has(product.id))
            .map((product) => ({
                text: `${product.code ?? ''} ${product.name}`.trim(),
                value: product
            }));
    }, [products, selectedProducts]);

    const getRequiredData = async () => {
        if (!companyId) return;

        setLoading(true);
        try {
            const productsRes = await postInfo('/inventory/getProducts', {
                company_id: companyId
            });
            const relationsRes = await postInfo('/inventory/getProductTaxRelations', {
                company_id: companyId
            });

            if (productsRes?.[0]) {
                setProducts(productsRes[1]);
            }

            if (relationsRes?.[0]) {
                const groupedRelations = {};
                relationsRes[1].forEach((relation) => {
                    const normalizedRelation = normalizeRelation(relation);
                    if (!normalizedRelation) return;

                    if (!groupedRelations[normalizedRelation.product_id]) {
                        groupedRelations[normalizedRelation.product_id] = [];
                    }
                    groupedRelations[normalizedRelation.product_id].push(normalizedRelation);
                });
                setRelationsByProduct(groupedRelations);
            }
        } catch (err) {
            console.error('Error cargando productos y condiciones fiscales:', err);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = (product) => {
        if (!product?.id) return;
        if (selectedProducts.some((item) => item.id === product.id)) return;

        const productRelations = relationsByProduct[product.id] ?? [];
        const defaultRelations = productRelations.map((relation, index) => ({
            company_id: companyId,
            product_id: product.id,
            tax_id: relation.tax_id,
            operation_type: relation.operation_type,
            tax_role: relation.tax_role,
            priority: index
        }));

        setSelectedProducts((prev) => [...prev, product]);
        setSelectedRelations((prev) => {
            const existing = new Set(prev.map((relation) => (
                `${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`
            )));
            const relationsToAdd = defaultRelations.filter((relation) => (
                !existing.has(`${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`)
            ));
            return [...prev, ...relationsToAdd];
        });
    };

    const removeProduct = (productId) => {
        setSelectedProducts((prev) => prev.filter((product) => product.id !== productId));
        setSelectedRelations((prev) => prev.filter((relation) => relation.product_id !== productId));
    };

    const toggleRelation = (relation) => {
        const relationKey = `${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`;
        setSelectedRelations((prev) => {
            const exists = prev.some((item) => (
                `${item.product_id}-${item.operation_type}-${item.tax_role}-${item.tax_id}` === relationKey
            ));

            if (exists) {
                return prev.filter((item) => (
                    `${item.product_id}-${item.operation_type}-${item.tax_role}-${item.tax_id}` !== relationKey
                ));
            }

            return [
                ...prev,
                {
                    company_id: companyId,
                    product_id: relation.product_id,
                    tax_id: relation.tax_id,
                    operation_type: relation.operation_type,
                    tax_role: relation.tax_role,
                    priority: prev.length
                }
            ];
        });
    };

    const renderOperation = (product, operationType) => {
        const productRelations = relationsByProduct[product.id] ?? [];
        const operationRelations = productRelations.filter((relation) => relation.operation_type === operationType);

        return (
            <div className="operationBlock" key={operationType}>
                <h5>{OPERATION_LABELS[operationType]}</h5>
                {['tax', 'withholding'].map((taxRole) => {
                    const roleRelations = operationRelations.filter((relation) => relation.tax_role === taxRole);
                    return (
                        <div className="relationGroup" key={`${operationType}-${taxRole}`}>
                            <strong>{ROLE_LABELS[taxRole]}</strong>
                            {roleRelations.length === 0 && (
                                <span className="emptyRelationText">
                                    <i className="fa-solid fa-triangle-exclamation"/>
                                    Sin opciones asociadas al producto.
                                </span>
                            )}
                            {roleRelations.map((relation) => {
                                const relationKey = `${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`;
                                return (
                                    <label className="relationOption" key={relationKey}>
                                        <input
                                            type="checkbox"
                                            disabled={disabled}
                                            checked={selectedRelationsKeys.has(relationKey)}
                                            onChange={() => toggleRelation(relation)}
                                        />
                                        <span>{relation.tax_code ? `${relation.tax_code} - ` : ''}{relation.tax_name}</span>
                                        <small>{relation.rate ?? 0}%</small>
                                    </label>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    useEffect(() => {
        getRequiredData();
    }, [companyId]);

    useEffect(() => {
        action?.(selectedRelations);
    }, [selectedRelations]);

    return (
        <div className="ProductLinkFiscalConditionsCard">
            <button
                className="productFiscalHeader"
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
            >
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1766076215/Cuadricula3Documentos_2_ujr8ce.png" alt="" />
                <span>
                    Productos asociados al tercero
                </span>
                <small>{selectedProducts.length} productos · {selectedRelations.length} relaciones</small>
                <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} />
            </button>

            {open && (
                <div className="productFiscalBody">
                    <SearchinList
                        noActVal={true}
                        disabled={disabled || loading || productOptions.length === 0}
                        placeHolder={loading ? 'Cargando productos...' : '+ Agregar producto o servicio'}
                        list={productOptions}
                        action={addProduct}
                    />

                    {selectedProducts.length === 0 && (
                        <span className="emptyProductsText">
                            Selecciona productos para definir sus impuestos y retenciones por compra o venta.
                        </span>
                    )}

                    {selectedProducts.map((product) => (
                        <article className="linkedProductCard" key={product.id}>
                            <div className="linkedProductHeader">
                                <div className='ProductHeadInfo'>
                                    <img src={product.img} alt="" />
                                    <h4>{product.name}</h4>
                                    <span>{product.code ?? 'Sin código'}</span>
                                </div>
                                <button
                                    type="button"
                                    title={`Quitar ${product.name}`}
                                    disabled={disabled}
                                    onClick={() => removeProduct(product.id)}
                                >
                                    <i className="fa-solid fa-trash" />
                                </button>
                            </div>
                            <div className="operationsGrid">
                                {renderOperation(product, 'purchase')}
                                {renderOperation(product, 'sell')}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
