import { useEffect, useState } from "react";
import { moneyFormat, postInfo } from "../../../utils/functions";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./UserApp.css"
import "./LightChart.css"
import { LoadingSpace } from "./LoadingSpace";
import { BoldTitle } from "../components/BoldTitle";
import { SelectOptions } from "../components/SelectOptions";
import { MoreOptions } from "../components/MoreOptions";
import { PercentTimeIndicator } from "../components/PercentTimeIndicator";

export const LightChart = ({info,content}) => {

  const [data, setData] = useState(content != undefined? data:[]);
  const [stateData,setStateData] = useState();
  const [period,setPeriod] = useState("")
  const [loading,setLoading] = useState(false);

  const chagePeriod = (value)=>{
    let dicper = {
      'Por día':"DAY",
      "Por mes":'MONTH',
      'Por año':'YEAR'
    }
    setPeriod(dicper[value])
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await postInfo(`/getTransactionsData?period=${period}`, info);
      if(response[0]){
        setData(response[1])
      }
    } catch (err) {
      console.error("❌ Error al obtener datos del backend:", err);
    }
    setLoading(false)
  };

  const calcStateChart = ()=>{
      let tt = {total:0};
      data.forEach((element,index) => {
          if(index != 0){
            tt = (element.total > data[index-1].total);
          }
      });
      setStateData(tt);
  }

  useEffect(()=>{
      if(data.length >0){
          calcStateChart();
      }
  },[data])

  useEffect(()=>{
    loadData();
  },[period])

  useEffect(() => {
    loadData();
  }, []);
  

  return (
    <div className="LightChart">
      {data.length > 0 && !loading ? (
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              {/* Gradiente para el relleno del área */}
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stateData ? '#5EE9B5' : '#FF6467'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={stateData ? '#5EE9B5' : '#FF6467'} stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label"  className="XAxis"  
                  tickLine={false}
                  axisLine={false} />
            <YAxis className="YAxis" 
                  tickLine={false}
                  axisLine={false}
            />
            <Tooltip />

            <Area 
              type="monotone" 
              dataKey="total" 
              stroke={stateData ? '#5EE9B5' : '#FF6467'} 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>

      ) : (
        <LoadingSpace title={'Cargando estadisticas'} description={'Esto no debe tardar mucho...'}/>
      )}
      <div className="titleAndValueContainer">
        <BoldTitle text={info.title}/>
        <h3>{moneyFormat(data.length)}
          <PercentTimeIndicator info={{value:(
            data.length>1 ?((1-(data[data.length -1].total/data[data.length-2].total))*-100).toFixed(2):0
          ),period:period}}/>
        </h3>
      </div>
      <div className="optionsChart">
        <SelectOptions action={chagePeriod} options={[
          "Por día","Por mes","Por año"
          ]}/>

        <MoreOptions options={[
          {text:'Refrescar',icon:<i className="fa-solid fa-rotate-right"/>,action:loadData},
          {text:'Descargar',icon:<i className="fa-solid fa-arrow-down"/>},
          {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
          {text:'Reportar Problema',icon:<i className="fa-solid fa-flag"/>}
        ]}/>
      </div>
    </div>
);

};
