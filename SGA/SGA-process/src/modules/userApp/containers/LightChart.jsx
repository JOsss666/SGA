  import { useEffect, useRef, useState } from "react";
  import { moneyFormat, postInfo, ScreenShotElement } from "../../../utils/functions";
  import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
  import "./UserApp.css";
  import "./LightChart.css";
  import { LoadingSpace } from "./LoadingSpace";
  import { BoldTitle } from "../components/BoldTitle";
  import { SelectOptions } from "../components/SelectOptions";
  import { MoreOptions } from "../components/MoreOptions";
  import { PercentTimeIndicator } from "../components/PercentTimeIndicator";

  export const LightChart = ({ title, doc_type, type }) => {
    const [data, setData] = useState([]);
    const [stateData, setStateData] = useState();
    const [period, setPeriod] = useState("MONTH");
    const [loading, setLoading] = useState(false);
    const container = useRef();

    // 📅 Cambiar el periodo
    const changePeriod = (value) => {
      const dicper = {
        "Por día": "DAY",
        "Por mes": "MONTH",
        "Por año": "YEAR",
      };
      setPeriod(dicper[value]);
    };

    // 📊 Cargar datos del backend
    const loadData = async () => {
      setLoading(true);
      try {
        const info = { title, doc_type, type };
        let response;
        if(type == 'number'){
            response = await postInfo(`/getDocAnalyticDocNumber?period=${period}`, info);
        }else{
            response = await postInfo(`/getTransactionsData?period=${period}`, info);
        }
        console.log(response)
        if (response[0]) {
            setData(response[1]);
        } else {
          console.warn("⚠️ Respuesta inesperada del backend:", response);
          setData([]);
        }
      } catch (err) {
        console.error("❌ Error al obtener datos del backend:", err);
        setData([]);
      }
      setLoading(false);
    };

    // 📈 Calcular si hubo aumento o disminución
    const calcStateChart = () => {
      if (data.length < 2) return;
      const last = data[data.length - 1].total;
      const prev = data[data.length - 2].total;
      setStateData(last > prev);
    };

    // Recalcula estado al cambiar datos
    useEffect(() => {
      if (data.length > 0) {
        calcStateChart();
      }
    }, [data]);

    // Recargar al cambiar el periodo
    useEffect(() => {
      loadData();
    }, [period]);

    // Cargar inicial
    useEffect(() => {
      loadData();
    }, []);

    const handleDownload = async()=>{
      await ScreenShotElement(container.current,`${title}.png`);
    }

    return (
      <div ref={container} className="LightChart">
        {data.length > 0 && !loading ? (
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={stateData ? "#5EE9B5" : "#FF6467"}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={stateData ? "#5EE9B5" : "#FF6467"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                className="XAxis"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="YAxis" tickLine={false} axisLine={false} />
              <Tooltip />

              <Area
                type="monotone"
                dataKey="total"
                stroke={stateData ? "#5EE9B5" : "#FF6467"}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <LoadingSpace
            title={"Cargando estadísticas"}
            description={"Esto no debe tardar mucho..."}
          />
        )}

        <div className="titleAndValueContainer">
          <BoldTitle text={title} />
          <h3>
            {moneyFormat(data.length)}
            <PercentTimeIndicator
              info={{
                value:
                  data.length > 1
                    ? (
                        (1 -
                          data[data.length - 1].total /
                            data[data.length - 2].total) *
                        -100
                      ).toFixed(2)
                    : 0,
                period: period,
              }}
            />
          </h3>
        </div>

        <div className="optionsChart">
          <SelectOptions
            action={changePeriod}
            options={["Por día", "Por mes", "Por año"]}
          />

          <MoreOptions
            options={[
              {
                text: "Refrescar",
                icon: <i className="fa-solid fa-rotate-right" />,
                action: loadData,
              },
              { text: "Descargar", icon: <i className="fa-solid fa-arrow-down" />,action:handleDownload},
              { text: "Compartir", icon: <i className="fa-solid fa-share-nodes" /> },
              { text: "Reportar Problema", icon: <i className="fa-solid fa-flag" /> },
            ]}
          />
        </div>
      </div>
    );
  };
