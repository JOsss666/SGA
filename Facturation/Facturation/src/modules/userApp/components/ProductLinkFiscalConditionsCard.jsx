import { useEffect, useMemo, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { SearchinList } from './SearchInList';
import './ProductLinkFiscalConditionsCard.css';
import { FormInput } from './FormInput';

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
    readOnly = false,
    value = [],
    associatedProducts = [],
    action,
    productsAction
}) {
    const [open, setOpen] = useState(readOnly);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [relationsByProduct, setRelationsByProduct] = useState({});
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedRelations, setSelectedRelations] = useState(value);
    const [referencesByProduct, setReferencesByProduct] = useState({});

    const referenceLabel = info?.type === 'client'
        ? 'Referencia cliente'
        : info?.type === 'supplier'
            ? 'Referencia proveedor'
            : info?.type === 'both'
                ? 'Referencia cliente/proveedor'
                : 'Referencia del tercero';

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
            const [productsRes, relationsRes] = await Promise.all([
                postInfo('/inventory/getProducts', {company_id: companyId}),
                readOnly
                    ? Promise.resolve(null)
                    : postInfo('/inventory/getProductTaxRelations', {company_id: companyId})
            ]);

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

    useEffect(() => {
        setSelectedRelations(value);
    }, [value]);

    useEffect(() => {
        const productsById = new Map();
        associatedProducts.forEach((association) => {
            const productId = association.product_id ?? association.id;
            if (productId == null) return;

            productsById.set(String(productId), {
                ...association,
                id:productId,
                name:association.product_name ?? association.name ?? `Producto ${productId}`,
                code:association.product_code ?? association.code ?? '',
                img:association.product_img ?? association.img ?? ''
            });
        });

        value.forEach((relation) => {
            const productId = relation.product_id;
            if (productId == null || productsById.has(String(productId))) return;

            productsById.set(String(productId), {
                id:productId,
                name:relation.product_name ?? `Producto ${productId}`,
                code:relation.product_code ?? '',
                img:relation.product_img ?? ''
            });
        });

        setSelectedProducts([...productsById.values()].map((relationProduct) => (
            relationProduct
        )));
        setReferencesByProduct(value.reduce((references, relation) => {
            const productId = relation.product_id;
            const reference = relation.third_party_reference ?? relation.thirdPartyReference;
            if (productId != null && reference && !references[productId]) {
                references[productId] = reference;
            }
            return references;
        }, associatedProducts.reduce((references, association) => {
            const productId = association.product_id ?? association.id;
            const reference = association.third_party_reference ?? association.thirdPartyReference;
            if (productId != null && reference != null) references[productId] = reference;
            return references;
        }, {})));
    }, [associatedProducts, value]);

    const addProduct = (product) => {
        if (!product?.id) return;
        if (selectedProducts.some((item) => String(item.id) === String(product.id))) return;

        const productRelations = relationsByProduct[product.id] ?? [];
        const defaultRelations = productRelations.map((relation, index) => ({
            company_id: companyId,
            product_id: product.id,
            tax_id: relation.tax_id,
            operation_type: relation.operation_type,
            tax_role: relation.tax_role,
            priority: index,
            third_party_reference: referencesByProduct[product.id] ?? ''
        }));

        const nextProducts = [...selectedProducts, product];
        setSelectedProducts(nextProducts);
        productsAction?.(nextProducts);
        setReferencesByProduct((prev) => ({...prev, [product.id]:prev[product.id] ?? ''}));
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
        const nextProducts = selectedProducts.filter((product) => String(product.id) !== String(productId));
        setSelectedProducts(nextProducts);
        productsAction?.(nextProducts);
        setSelectedRelations((prev) => prev.filter((relation) => String(relation.product_id) !== String(productId)));
        setReferencesByProduct((prev) => {
            const next = {...prev};
            delete next[productId];
            return next;
        });
    };

    const updateProductReference = (productId, reference) => {
        setReferencesByProduct((prev) => ({...prev, [productId]:reference}));
        const nextProducts = selectedProducts.map((product) => (
            String(product.id) === String(productId)
                ? {...product, third_party_reference:reference}
                : product
        ));
        setSelectedProducts(nextProducts);
        productsAction?.(nextProducts);
        setSelectedRelations((prev) => prev.map((relation) => (
            relation.product_id === productId
                ? {...relation, third_party_reference:reference}
                : relation
        )));
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
                    priority: prev.length,
                    third_party_reference: referencesByProduct[relation.product_id] ?? ''
                }
            ];
        });
    };

    const renderOperation = (product, operationType) => {
        if (readOnly) {
            const selectedOperationRelations = selectedRelations.filter((relation) => (
                String(relation.product_id) === String(product.id)
                && relation.operation_type === operationType
            ));
            return (
                <div className="operationBlock readOnlyOperationBlock" key={operationType}>
                    <h5>{OPERATION_LABELS[operationType]}</h5>
                    {['tax', 'withholding'].map((taxRole) => {
                        const roleRelations = selectedOperationRelations.filter(
                            relation => relation.tax_role === taxRole
                        );
                        return (
                            <div className="relationGroup" key={`${operationType}-${taxRole}`}>
                                <strong>{ROLE_LABELS[taxRole]}</strong>
                                {roleRelations.length === 0 && (
                                    <span className="emptyRelationText">Sin relaciones configuradas.</span>
                                )}
                                {roleRelations.map((relation, index) => (
                                    <div className="readOnlyRelation" key={`${relation.relationKey ?? relation.tax_id}-${index}`}>
                                        <span>{relation.tax_code ? `${relation.tax_code} - ` : ''}{relation.tax_name ?? relation.name ?? `Impuesto ${relation.tax_id}`}</span>
                                        <small>{relation.rate ?? 0}%</small>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            );
        }

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
                                            disabled={disabled || loading}
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
    }, [companyId, readOnly]);

    useEffect(() => {
        action?.(selectedRelations);
    }, [selectedRelations]);

    return (
        <div className="ProductLinkFiscalConditionsCard">
            <button
                className="productFiscalHeader"
                type="button"
                disabled={disabled && !readOnly}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                <img src="https://cdnmain.sga360.co/static/Cuadricula3Documentos_2_ujr8ce.webp" alt="" />
                <span>
                    Productos asociados al tercero
                </span>
                <small>{selectedProducts.length} productos · {selectedRelations.length} relaciones</small>
                <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} />
            </button>

            {open && (
                <div className="productFiscalBody">
                    {!readOnly && (
                        <SearchinList
                            noActVal={true}
                            disabled={disabled || loading || productOptions.length === 0}
                            placeHolder={loading ? 'Cargando productos...' : '+ Agregar producto o servicio'}
                            list={productOptions}
                            action={addProduct}
                        />
                    )}

                    {selectedProducts.length === 0 && (
                        <span className="emptyProductsText">
                            {readOnly
                                ? 'Este tercero no tiene productos asociados.'
                                : 'Selecciona productos para definir sus impuestos y retenciones por compra o venta.'}
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
                                {!readOnly && <button
                                    type="button"
                                    title={`Quitar ${product.name}`}
                                    aria-label={`Quitar ${product.name} de los productos asociados`}
                                    disabled={disabled || loading}
                                    onClick={() => removeProduct(product.id)}
                                >
                                    <i className="fa-solid fa-trash" />
                                </button>}
                            </div>
                            <div className="operationsGrid">
                                {renderOperation(product, 'purchase')}
                                {renderOperation(product, 'sell')}
                            </div>
                            <div className={`thirdPartyProductReference${readOnly ? ' readOnlyThirdPartyReference' : ''}`}>
                                {readOnly ? (
                                    <>
                                        <strong>{referenceLabel}</strong>
                                        <span>{referencesByProduct[product.id] || 'Sin referencia configurada.'}</span>
                                    </>
                                ) : (
                                <FormInput
                                    title={referenceLabel}
                                    placeholder={'Como el proveedor llama este item, puede ser util para completar con la IA y demas.'}
                                    disabled={disabled || loading}
                                    textArea={true}
                                    value={referencesByProduct[product.id] ?? ''}
                                    action={(reference) => updateProductReference(product.id,reference)}
                                />
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
