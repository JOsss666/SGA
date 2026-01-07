import { memo, useCallback, useMemo, useState } from "react";
import { moneyFormat } from "../../../utils/functions";
import { FormInput } from "./FormInput";
import { SearchinList } from "./SearchInList";
import "./RowTransaction.css";

export const RowTransaction = memo(function RowTransaction({
  disabled,
  info,
  products,
  index,
  addP,
  delP,
  onChangeRow,
  type,
  hidden
}) {

  // Estado SOLO para inputs controlados
  const [units, setUnits] = useState("");
  const [cost, setCost] = useState("");

  /* =========================
     Handlers (memoizados)
  ========================== */

  const handleUnitsChange = useCallback((value) => {
    setUnits(value);
    onChangeRow?.(info.id, {
      stock: Number(value) || 0
    });
  }, [info?.id, onChangeRow]);

  const handleCostChange = useCallback((value) => {
    setCost(value);
    onChangeRow?.(info.id, {
      unit_cost: Number(value) || 0
    });
  }, [info?.id, onChangeRow]);

  const handleDelete = useCallback(() => {
    if (!disabled) delP?.(info);
  }, [disabled, delP, info]);

  /* =========================
     Valores derivados
     (NO estado)
  ========================== */

  const totalValue = useMemo(() => {
    const u = Number(units) || 0;
    if (!info) return 0;

    if (type === "Inventory Entry") return u * (Number(cost) || 0);
    if (type === "consuption") return u * info.unit_cost;
    return u * info.unit_value;
  }, [units, cost, info, type]);

  if (hidden) return null;

  /* =========================
     Render
  ========================== */

  return (
    <div className={`RowTransaction ${info ? `RowTrans_${info.stateTransaction}` : ""}`}>

      {!info && (
        <>
          <span />
          <span>+</span>
          <span className="productHolder">
            <SearchinList
              disabled={disabled}
              noActVal
              action={addP}
              placeHolder="Añadir producto o servicio"
              list={products}
            />
          </span>
          {Array(5).fill(null).map((_, i) => <span key={i} />)}
        </>
      )}

      {info && (
        <>
          <span className="stateTransCs">
            {info.stateTransaction === "loading" && <i className="fa-solid fa-spinner fa-spin" />}
            {info.stateTransaction === "realized" && <i className="fa-solid fa-check aprovedTransIcon" />}
            {info.stateTransaction === "error" && <i className="fa-solid fa-xmark declinedTransIcon" />}
          </span>

          <span>{index + 1}</span>
          <span>{info.name}</span>
          <span>#{info.code}</span>
          <span>{info.description}</span>

          <span className="inCTrans">
            <FormInput
              disabled={disabled}
              value={units}
              action={handleUnitsChange}
              placeholder={
                type !== "Inventory Entry"
                  ? `${info.storeStock} unidades disponibles`
                  : "0"
              }
              min={0}
              max={info.storeStock}
              type="number"
            />
          </span>

          {(type === "Inventory Out" || type === "Inventory transfer") && (
            <>
              <span>$ {moneyFormat(info.unit_value)}</span>
              <span>$ {moneyFormat(totalValue)}</span>
            </>
          )}

          {type === "consuption" && (
            <>
              <span>$ {moneyFormat(info.unit_cost)}</span>
              <span>$ {moneyFormat(totalValue)}</span>
            </>
          )}

          {type === "Inventory Entry" && (
            <>
              <span className="inCTrans">
                <FormInput
                  disabled={disabled}
                  value={cost}
                  action={handleCostChange}
                  placeholder="0"
                  type="number"
                />
              </span>
              <span>$ {moneyFormat(totalValue)}</span>
            </>
          )}
        </>
      )}

      <span>
        <i title="Duplicar" className="fa-regular fa-clone" />
      </span>

      <span>
        <i
          title="Eliminar"
          onClick={handleDelete}
          className="fa-solid fa-trash-can transactionBtn"
        />
      </span>
    </div>
  );
});
