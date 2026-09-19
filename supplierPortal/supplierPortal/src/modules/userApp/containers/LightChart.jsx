import { useEffect, useRef, useState, useMemo } from "react";
import { moneyFormat, ScreenShotElement } from "../../../utils/functions";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./UserApp.css";
import "./LightChart.css";
import { LoadingSpace } from "./LoadingSpace";
import { BoldTitle } from "../components/BoldTitle";
import { PercentTimeIndicator } from "../components/PercentTimeIndicator";
import { MoreOptions } from "../components/MoreOptions";

export const LightChart = ({
  title,
  data,           // 📥 Ahora puede recibir un Array de Arrays [[user1Data], [user2Data]]
  loading,
  chartType,
  period = "day"
}) => {
  const container = useRef();
  const [percentChart, setPercentChart] = useState(0);

  // Paleta de colores para múltiples líneas
  const colorPalette = [
    "#2962FF", // Azul Eléctrico (Principal)
    "#00C853", // Verde Esmeralda
    "#FF6D00", // Naranja Vibrante
    "#D500F9", // Púrpura Neón
    "#FF2D55", // Rosa Rojizo
    "#00B8D4", // Cian Profundo
    "#FFD600", // Amarillo Dorado
    "#64DD17", // Lima Fuerte
    "#AA00FF", // Violeta
    "#304FFE", // Indigo
    "#00BFA5", // Turquesa 
    "#FF1744", // Rojo Brillante
    "#795548", // Marrón Suave (Tierra)
    "#607D8B", // Gris Azulado (Slate)
    "#C6FF00"  // Lima Amarillenta
  ];

  // 🔄 Adaptador de datos Multi-Serie
  const { chartData, seriesNames } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], seriesNames: [] };

    const masterMap = {};
    const namesSet = new Set();

    // Normalizamos: si viene un solo array, lo envolvemos en otro para tratarlo igual
    const dataSources = Array.isArray(data[0]) ? data : [data];

    dataSources.forEach((source) => {
      source.forEach((item) => {
        const rawDate = item.created_at || item.date || item.ejeX || item.label || item.periodo;
        if (!rawDate) return;

        const dateKey = typeof rawDate === 'string' ? rawDate.split('T')[0].split(' ')[0] : rawDate;
        const seriesName = item.user_name || "Total"; // Identificador de la línea
        
        namesSet.add(seriesName);

        if (!masterMap[dateKey]) {
          masterMap[dateKey] = { label: dateKey };
        }

        // Si hay varios registros el mismo día para la misma serie, los sumamos
        const value = parseInt(item.total_acciones || item.value || item.total || 1);
        masterMap[dateKey][seriesName] = (masterMap[dateKey][seriesName] || 0) + value;
      });
    });

    const formattedData = Object.values(masterMap).sort(
      (a, b) => new Date(a.label) - new Date(b.label)
    );

    return { 
      chartData: formattedData, 
      seriesNames: Array.from(namesSet) 
    };
  }, [data]);

  // ➕ Calcula tendencia (basado en la suma total de todas las series)
  useEffect(() => {
    if (chartData.length >= 2) {
      const getSum = (obj) => seriesNames.reduce((acc, name) => acc + (obj[name] || 0), 0);
      const last = getSum(chartData[chartData.length - 1]);
      const prev = getSum(chartData[chartData.length - 2]);
      setPercentChart(prev !== 0 ? (((last - prev) / prev) * 100).toFixed(2) : 0);
    }
  }, [chartData, seriesNames]);

  const handleDownload = async () => {
    await ScreenShotElement(container.current, `${title}.png`);
  };

  return (
    <div ref={container} className="LightChart">
      {!loading ? (
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                {seriesNames.map((name, i) => (
                  <linearGradient key={i} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorPalette[i % colorPalette.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colorPalette[i % colorPalette.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide={true} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              
              {seriesNames.map((name, i) => (
                <Area 
                  key={name}
                  type="monotone" 
                  dataKey={name} 
                  stroke={colorPalette[i % colorPalette.length]} 
                  fillOpacity={1} 
                  fill={`url(#color${i})`} 
                  strokeWidth={3}
                  animationDuration={1200}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide={true} domain={['auto', 'auto']} />
              <Tooltip />
              {seriesNames.map((name, i) => (
                <Line 
                  key={name}
                  type="monotone" 
                  dataKey={name} 
                  stroke={colorPalette[i % colorPalette.length]} 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <LoadingSpace title="Cargando estadísticas..." />
      )}

      <div className="titleAndValueContainer">
        <BoldTitle text={title} />
        <h3>
          {/* Muestra la suma total del último periodo */}
          {chartData.length > 0 ? 
            moneyFormat(seriesNames.reduce((acc, n) => acc + (chartData[chartData.length-1][n] || 0), 0)) 
            : "0"}
          <PercentTimeIndicator info={{ value: percentChart, period: period }} />
        </h3>
      </div>

      <div className="optionsChart">
        <MoreOptions
          options={[
            { text: "Descargar", icon: <i className="fa-solid fa-arrow-down" />, action: handleDownload },
            { text: "Compartir", icon: <i className="fa-solid fa-share-nodes" /> },
          ]}
        />
      </div>
    </div>
  );
};