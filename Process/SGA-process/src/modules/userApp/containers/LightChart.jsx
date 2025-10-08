import { useEffect, useState } from "react";
import { postInfo } from "../../../utils/functions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const LightChart = () => {
  const [data, setData] = useState([]);

  const loadData = async () => {
    console.log("🟡 Enviando solicitud al backend...");
    try {
      const response = await postInfo("getSalesData", {});
      console.log("🟢 Respuesta backend completa:", response);

      // Validar estructura
      if (Array.isArray(response) && response.length > 0) {
        setData(response);
      } else {
        console.warn("⚠️ El backend no devolvió un array válido:", response);
      }
    } catch (err) {
      console.error("❌ Error al obtener datos del backend:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ width: "100%", height: 300 }}>
      {data.length > 0 ? (
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="ventas" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ textAlign: "center" }}>Cargando datos o sin información disponible...</p>
      )}
    </div>
  );
};
