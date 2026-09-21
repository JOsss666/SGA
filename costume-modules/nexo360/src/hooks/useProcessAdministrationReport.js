import { useEffect, useMemo, useState } from "react";
import { processAdministrationDemo } from "../data/processAdministrationDemo";
import { getProcessAdministrationReport } from "../services/nexoProcessApi";
import { useRealtime } from "../../utils/useRealTime";

const normalizeResponse = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.[1])) return response[1];
    return Array.isArray(response) ? response : [];
};

export function useProcessAdministrationReport(companyId) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState("");
    const [isDemo, setIsDemo] = useState(false);
    const [quickFilter, setQuickFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [refreshVersion, setRefreshVersion] = useState(0);

    useRealtime(companyId, (payload) => {
        if (payload?.table === "process_instance") {
            setRefreshVersion((current) => current + 1);
        }
    });

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const response = await getProcessAdministrationReport(companyId);
                if (active) {
                    setOrders(normalizeResponse(response));
                    setIsDemo(false);
                    setNotice("");
                }
            } catch (error) {
                console.error("No fue posible cargar el informe administrativo NEXO 360", error);
                if (active && import.meta.env.DEV) {
                    setOrders(processAdministrationDemo);
                    setNotice("Vista de desarrollo: el endpoint NEXO 360 aún no está disponible; se muestran datos demostrativos.");
                    setIsDemo(true);
                } else if (active) {
                    setNotice("No fue posible cargar el informe. Intenta nuevamente.");
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [companyId, refreshVersion]);

    const totals = useMemo(() => ({
        total: orders.length,
        unassigned: orders.filter(({ status: value }) => value === "Por asignar").length,
        active: orders.filter(({ status: value }) => value === "En producción").length,
        approval: orders.filter(({ status: value }) => value === "Pendiente de aprobación").length,
        overdue: orders.filter(({ priority }) => priority === "Vencido").length
    }), [orders]);

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const quickMatches = quickFilter === "all"
            || (quickFilter === "unassigned" && order.status === "Por asignar")
            || (quickFilter === "active" && order.status === "En producción")
            || (quickFilter === "approval" && order.status === "Pendiente de aprobación")
            || (quickFilter === "overdue" && order.priority === "Vencido");
        return quickMatches;
    }), [orders, quickFilter]);

    const selectQuickFilter = (value) => {
        setQuickFilter((current) => current === value && value !== "all" ? "all" : value);
    };
    return { orders, filteredOrders, loading, notice, isDemo, search, setSearch, quickFilter, selectQuickFilter, totals };
}
