import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RowTransaction } from "../../components/RowTransaction";
import { SearchinList } from "../../components/SearchInList";
import "./ListProducts&services.css";
import { NewElementSelect } from "../../components/NewElementSelect";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { moneyFormat } from "../../../../utils/functions";

export function ListProductsServices({
    listProducts,
    setListPorducts,
    products,
    disabled,
    updateProductsTotal,
    hidden,
    type
    }) {
    const [manualProduct, setManualProduct] = useState(false);
    const [visibleNew, setVisibleNew] = useState(true);
    const inputSKU = useRef(null);
    const [skuValue, setSkuValue] = useState("");

    /* =========================
        ADD PRODUCT
    ========================== */
    const addProducts = useCallback((info) => {
        setListPorducts(prev => {
        if (prev.some(p => p.id === info.id)) return prev;
        return [...prev, { ...info, stock: 0 }];
        });
        inputSKU.current?.focus();
    }, [setListPorducts]);

    /* =========================
        DELETE PRODUCT
    ========================== */
    const deleteProduct = useCallback((product) => {
        setListPorducts(prev => prev.filter(p => p !== product));
    }, [setListPorducts]);

    /* =========================
        UPDATE ROW (🔥 CLAVE)
    ========================== */
    const onChangeRow = useCallback((id, changes) => {
        setListPorducts(prev =>
        prev.map(p =>
            p.id === id ? { ...p, ...changes } : p
        )
        );
    }, [setListPorducts]);

    /* =========================
        TOTAL (SIN useEffect)
    ========================== */
    const total = useMemo(() => {
        return listProducts.reduce((acc, p) => {
        const units = Number(p.stock) || 0;
        if (type === "Inventory Entry") {
            return acc + units * (Number(p.unit_cost) || 0);
        }
        return acc + units * (p.unit_value || p.unit_cost || 0);
        }, 0);
    }, [listProducts, type]);

    /* =========================
        FIND SKU
    ========================== */

    const findSKU = useCallback((sku) => {
        console.log('SKU ',sku)
        const map = new Map(products.map(p => [p.value.code, p]));
        return map.get(sku);
    }, [products]);


    const handleSkuKeyDown = useCallback((e) => {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const sku = skuValue.trim();
        if (!sku) return;

        const found = findSKU(sku);

        if (found) {
            addProducts(found.value);
        } else {
            alert("Producto no encontrado");
        }

        setSkuValue("");               // limpiar input
        inputSKU.current?.focus();     // volver a enfocar
    }, [skuValue, findSKU, addProducts]);

    /* =========================
        FOCUS
    ========================== */
    useEffect(() => {
        if (!manualProduct && visibleNew) {
        inputSKU.current?.focus();
        }
    }, [manualProduct, visibleNew]);

    useEffect(()=>{
        updateProductsTotal?.(total);
    },[total])

    /* =========================
        RENDER
    ========================== */
    return (
        <div className="ListProductsServices">

        {visibleNew && (
            <div className="addNewP">
            <div className="gunRegister">

                {manualProduct ? (
                <SearchinList
                    action={addProducts}
                    placeHolder="Selecciona nuevo producto o escanea SKU"
                    disabled={disabled}
                    list={products}
                    noActVal
                />
                ) : (
                <>
                    <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1767055082/CodeScan_ifoxi8.png" />
                    <input
                        className="inputSKU"
                        ref={inputSKU}
                        type="text"
                        value={skuValue}
                        onChange={(e) => setSkuValue(e.target.value)}
                        onKeyDown={handleSkuKeyDown}
                        disabled={disabled}
                        autoFocus
                        inputMode="numeric"
                        autoComplete="off"
                        />
                </>
                )}

                <div className="optionsGun">
                <strong onClick={() => setManualProduct(p => !p)}>
                    {manualProduct ? "Lectura con pistola" : "Busqueda manual"}
                    {manualProduct
                    ? <i className="fa-solid fa-barcode" />
                    : <i className="fa-regular fa-keyboard" />
                    }
                </strong>
                </div>
            </div>

            <div className="resumeList">
                <BoldTitle text={`Total: ${moneyFormat(total)}`} />
                <DescriptionSpan text={`${listProducts.length} referencias seleccionadas`} />
            </div>
            </div>
        )}

        {!visibleNew && (
            <NewElementSelect
            title="Agregar producto"
            onClick={() => setVisibleNew(true)}
            />
        )}

        {listProducts.map((product, index) => (
            <RowTransaction
            key={product.id}          // ❗ CLAVE
            disabled={disabled}
            products={products}
            info={product}
            index={index}
            addP={addProducts}
            delP={deleteProduct}
            onChangeRow={onChangeRow}
            type={type}
            hidden={hidden}
            />
        ))}
        </div>
    );
    }
