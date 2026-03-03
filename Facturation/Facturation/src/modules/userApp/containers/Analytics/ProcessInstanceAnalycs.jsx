import { useEffect, useState } from "react";
import { AiResume } from "../../components/AiResume";
import { BoldTitle } from "../../components/BoldTitle";
import { PathLocation } from "../../components/PathLocation";
import { LightChart } from "../LightChart";
import './ProcessInstanceAnalycs.css'
import { formatDate, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { SearchBar } from "../../components/SearchBar";
import { ProgressBar } from "../../components/ProgressBar";
import { SelectOptions } from "../../components/SelectOptions";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { OutstandingAnalyticCard } from "../../components/OutstandingAnalyticCard";
import { desviacionEstandar, media, normalizeProcessData, varianza } from "../../../../utils/AnalyticsFunctions";
import { UserCard } from "../../components/UserCard";


export function ProcessInstanceAnalytics({}){

    //Requierements
    const {appInfo} = useAppInfo();
    const [instances,setInstances] = useState([]);
    const [usersActivity,setUsersActivity] = useState([]);
    const [cicleTimeRegister,setCicleTimeRegister] = useState([]);

    // control
    const [listProcesses,setListProceses] = useState([{name:"Proceso 1",value:50},{name:"Proceso 2",value:25},{name:"Proceso 3",value:25}]);
    const [loading,setLoading] = useState(false);
    const [status,setStatus] = useState(['all'])
    const [start_date,setStartDate] = useState();
    const [end_date,setEndDate] = useState();

    const settingsReport = {
        company_id:appInfo.company_id,
        status,
        start_date,
        end_date,
        userStatus:'active'
    }

    // Control functions

   const separateDataByUser = (rawData) => {
        // Extraemos el array si viene con el formato [status, data]
        const dataArray = Array.isArray(rawData[1]) ? rawData[1] : rawData;

        const groupedObject = dataArray.reduce((acc, item) => {
            const name = item.user_name;
            
            if (!acc[name]) {
                acc[name] = [];
            }

            acc[name].push({
                // Mantenemos las propiedades que el adaptador del componente busca
                date: item.periodo.split('T')[0], 
                total: parseInt(item.total_acciones),
                user_id: item.user_id,
                user_name: item.user_name // Importante para que el componente identifique la serie
            });

            return acc;
        }, {});

        // Convertimos el objeto { "User1": [], "User2": [] } 
        // en un array de arrays: [ [], [] ]
        return Object.values(groupedObject);
    };

    const calcAverage = (object,key,decimals)=>{
        let c = 0;
        object.forEach(element => {
            c += parseFloat(element[key])
        });
        let avg = (c/object.length).toFixed(decimals ? decimals:2)
        return(avg)
    }

    const findOutstanding = (dataArray, key,groupObject) => {
        // Si el array está vacío, devolvemos null o un objeto vacío
        if (!dataArray || dataArray.length === 0) return null;
        let outstanding;
        if(groupObject){
            outstanding = dataArray[0]; // Empezamos asumiendo que el primero es el mejor
            dataArray.forEach(element => {
                // Comparamos el valor actual con el que ya teníamos guardado
                // Convertimos a número con parseFloat por si viene como string desde la DB
                if (parseFloat(element.length) > parseFloat(outstanding.length)) {
                    outstanding = element[0][key];
                }
            });
        }else{
            let newArr = normalizeProcessData(dataArray);
            console.log(newArr)
            outstanding = newArr[0]
            console.log(outstanding)
            newArr.forEach(element => {
                // Comparamos el valor actual con el que ya teníamos guardado
                // Convertimos a número con parseFloat por si viene como string desde la DB
                //console.log(element,element.total,outstanding,outstanding.total);
                if (element.total > outstanding.total){
                    outstanding = element;
                }
            });
            console.log(outstanding)
            return outstanding[key];
        }
        

        return outstanding;
    };

    const countKey = (object,key,value)=>{
        console.log(key,value)
        let c = 0;
        object.forEach(element => {
            if(element[key] == value){
                c += 1
            }
        });
        return(c)
    }

    let calcVarProcessInstances = (dataArray)=>{
        let newArr = [];
        if(instances.length > 0){
            newArr = normalizeProcessData(dataArray);
        }
        let C = []
        newArr?.forEach(element => {
            C.push(element.total)
        });
        let v = varianza(C)?.toFixed(2)
        return(v);
    }

    let calcVarCicleTime = (dataArray)=>{
        let C = []
        dataArray.forEach(element => {
            C.push(parseFloat(element.total))
        });
        console.log(C)
        let v = varianza(C)?.toFixed(2);
        return(v)
    }


     let calcMediaProcessInstances = (dataArray)=>{
        let newArr = [];
        if(instances.length > 0){
            newArr = normalizeProcessData(dataArray);
        }
        let C = []
        newArr?.forEach(element => {
            C.push(element.total)
        });
        let v = media(C)?.toFixed(2)
        return(v);
    }

    let calcDesvEsProcessInstances = (dataArray)=>{
        let newArr = [];
        if(instances.length > 0){
            newArr = normalizeProcessData(dataArray);
        }
        let C = []
        newArr?.forEach(element => {
            C.push(element.total)
        });
        let v = desviacionEstandar(C)?.toFixed(2)
        return(v);
    }

    //Getters of info

    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',settingsReport)
        if(res[0]){
            console.log(res[1])
            setInstances(res[1])
        }
    }

    const getUsersActivity = async()=>{
        let res = await postInfo('/analytics/getProcessInstanceUsersAvtivity',settingsReport)
        console.log(res);
        if(res[0]){
            let C = separateDataByUser(res[1]);
            setUsersActivity(C)
        }
    }

    const getProcessCicleTime = async()=>{
        let res = await postInfo('/analytics/getProcessStepsCycleTime',settingsReport)
        console.log(res);
        if(res[0]){
            setCicleTimeRegister(res[1])
        }
    }

    const getChartsInfo = async()=>{
        setLoading(true);
        await getInstances();
        await getUsersActivity();
        await getProcessCicleTime();
        setLoading(false)
    }

    useEffect(()=>{
        getChartsInfo();
    },[])

    return(
        <div className="ProcessInstanceAnalytics">
            <div className="headAnalytic">
                <PathLocation/>
                <BoldTitle text={'Instancias de procesos'}/>
            </div>
            <div className="bodyAnalytics">
                <div className="mainChartSpaceContainer">
                    <div className="mainChart">
                        <LightChart title={'Instancias de Procesos'} chartType={'area'} data={instances} loading={loading}/>
                    </div>
                    <div className="auxChartCardsContainer">
                        <FormInput title={'Fecha inicial'} action={setStartDate} type={'date'}/>
                        <FormInput title={'Fecha final'} action={setEndDate} type={'date'}/>
                        <SelectOptions title={'Terceros'} action={setStatus} objectC={true} options={[
                            {text:'Todos',value:['all']},
                            {text:'Confirmados',value:['active']},
                            {text:'Cancelados',value:['cancelled']},
                            {text:'Pendientes',value:['pending']},
                        ]}/>
                        <SelectOptions title={'Procesos'} action={setStatus} objectC={true} options={[
                            {text:'Todos',value:['all']},
                            {text:'Confirmados',value:['active']},
                            {text:'Cancelados',value:['cancelled']},
                            {text:'Pendientes',value:['pending']},
                        ]}/>
                        <SelectOptions title={'Estado procesos'} action={setStatus} objectC={true} options={[
                            {text:'Todos',value:['all']},
                            {text:'Confirmados',value:['active']},
                            {text:'Cancelados',value:['cancelled']},
                            {text:'Pendientes',value:['pending']},
                        ]}/>
                        <FormButton text={'Aplicar cambios'} onClick={()=>{
                            getChartsInfo();   
                        }}/>
                    </div>
                </div>
                <div className="allProcessCardsIndicators">
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-person-rays"/>}
                        title={'Tercero mas frecuente'}
                        value={'CONSUMIDOR FINAL'}
                        color={'#9810FA'}
                        description={'200 Procesos en total'}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-screwdriver-wrench"/>}
                        title={'Proceso mas frecuente'}
                        value={'Impresión Digital'}
                        color={'#D0872E'}
                        description={'200 Procesos en total'}
                    /><OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-calendar-check"/>}
                        title={'Dia con mas instancias'}
                        value={formatDate(findOutstanding(instances,'date'),true)}
                        color={'#155DFC'}
                        description={`${findOutstanding(instances,'total')} Procesos en total`}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-check"/>}
                        title={'% Cumplimiento'}
                        children={<ProgressBar progress={(((countKey(instances,'status',"active"))/instances.length) * 100)?.toFixed(2)}/>}
                        color={'#2D9966'}
                        description={`${countKey(instances,'status',"active")} de ${instances.length} procesos`}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-ban"/>}
                        title={'% Cancelación'}
                        children={<ProgressBar progress={(((countKey(instances,'status',"cancelled"))/instances.length)?.toFixed(3) * 100)?.toFixed(2)}/>}
                        color={'#E7180B'}
                        description={`${countKey(instances,'status',"cancelled")} de ${instances.length} procesos`}
                    />
                </div>
                <div className="mainChartSpaceContainer secMainChartContainer">
                    <div className="secAuxCardsContainer">
                        <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-hourglass-half"/>}
                        title={'Tiempo Ciclo prom'}
                        value={`${calcAverage(cicleTimeRegister,"total")} min`}
                        color={'#193CB8'}
                        description={'10 Procesos en total'}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-medal"/>}
                        title={'Usuario con mas actividad'}
                        children={
                            <UserCard name={'Nombre usuario'} desc={'1000 acciones'} imgSrc={'https://i.pinimg.com/736x/70/78/88/707888a23862a1e94597c925342cf817.jpg'}/>
                        }
                        color={'#FDC745'}
                        
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-arrows-turn-to-dots"/>}
                        title={'Varianza procesos diarios'}
                        value={calcVarProcessInstances(instances)}
                        color={'#36BBA7'}
                        description={'Cuánta diferencia hay entre las instancias de un dia y otro.'}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-scale-balanced"/>}
                        title={'Promedio instancias diarias'}
                        value={calcMediaProcessInstances(instances)}
                        color={'#E61876'}
                        description={' El valor central o desempeño promedio de tus procesos.'}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-chart-column"/>}
                        title={'Desviación estandar'}
                        value={calcDesvEsProcessInstances(instances)}
                        color={'#E1712B'}
                        description={'Indica cuánto se alejan los datos del promedio en instancias.'}
                    />
                    <OutstandingAnalyticCard
                        icon={<i className="fa-solid fa-arrows-turn-to-dots"/>}
                        title={'Varianza Tiempo de ciclo'}
                        value={calcVarCicleTime(cicleTimeRegister)}
                        color={'#36BBA7'}
                        description={'Diferencia entre el tiempo de ejecución de cada etapa.'}
                    />
                    </div>
                    <div className="secMainC">
                        <div className=" secMainChart">
                            <LightChart 
                                title={'Acciones Usuarios'}
                                data={usersActivity}
                                chartType={'area'}
                                loading={loading}/>
                        </div>
                        <div className=" secMainChart">
                            <LightChart 
                                title={'Tiempo ejecución prom (min)'}
                                data={cicleTimeRegister}
                                chartType={'area'}
                                loading={loading}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}