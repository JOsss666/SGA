import { useMemo, useState } from "react";
import { FormButton } from '../../../../Facturation/Facturation/src/modules/userApp/components/FormButton';
import { createDeliveryOrder } from "../services/nexoProcessApi";
import "./deliveryOrderForm.css";

const inputFields = [
    ["pickup_location", "Lugar de recogida", true],
    ["authorized_name", "Persona autorizada por 4K 360", true],
    ["authorized_identification", "Identificación", true],
    ["authorized_phone", "Teléfono", false],
    ["vehicle_type", "Tipo de vehículo", false],
    ["vehicle_plate", "Placa", false],
    ["driver_name", "Conductor", false]
];

export function DeliveryOrderForm({ companyId, orders, onCreated, onCancel }) {
    const readyItems = useMemo(() => orders.flatMap(order => (order.components || [])
        .filter(item => item.readyForDelivery)
        .map(item => ({ ...item, order: order.reference || order.id }))), [orders]);
    const providers = [...new Set(readyItems.map(item => item.provider).filter(Boolean))];
    const [form, setForm] = useState({ scheduled_at: "", pickup_location: "", authorized_name: "", authorized_identification: "", authorized_phone: "", vehicle_type: "", vehicle_plate: "", driver_name: "", observations: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(readyItems.length ? "" : "Las órdenes seleccionadas no tienen productos en una OTP terminada y aprobada.");
    const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    const submit = async event => {
        event.preventDefault();
        if (providers.length !== 1) return setError("Seleccione productos de un único proveedor para generar la orden de entrega.");
        setSaving(true); setError("");
        try {
            const order = await createDeliveryOrder(companyId, { ...form, service_movement_ids: readyItems.map(item => item.serviceMovementId || item.id) });
            onCreated(order);
        } catch (requestError) {
            setError(requestError?.error || "No fue posible crear la orden de entrega.");
        } finally { setSaving(false); }
    };
    return <form className="deliveryOrderForm" onSubmit={submit}>
        <header><div><h2>Generar orden de entrega</h2><p>Proveedor: {providers[0] || "Sin proveedor"} · {readyItems.length} producto(s) listo(s).</p></div><button type="button" onClick={onCancel} aria-label="Cerrar formulario de orden de entrega">×</button></header>
        {error && <p className="deliveryOrderFormError" role="alert">{error}</p>}
        <div className="deliveryOrderFormFields">
            <label>Fecha y hora programada<input required type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={update}/></label>
            {inputFields.map(([name, label, required]) => <label key={name}>{label}<input required={required} name={name} value={form[name]} onChange={update}/></label>)}
            <label className="deliveryOrderFormObservations">Observaciones<textarea name="observations" value={form.observations} onChange={update}/></label>
        </div>
        <footer><FormButton text="Cancelar" onClick={(event) => { event.preventDefault(); onCancel(); }}/><FormButton text={saving ? "Generando…" : "Crear OE en borrador"} disabled={saving || !readyItems.length || providers.length !== 1}/></footer>
    </form>;
}
