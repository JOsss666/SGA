import { useEffect, useState } from "react"
import { useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { PathLocation } from "../../components/PathLocation";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SearchBar } from "../../components/SearchBar";
import { FormInput } from "../../components/FormInput";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import './EficiencyReport.css'
import { postInfo } from "../../../../utils/functions";
import { UserCard } from "../../components/UserCard";
import { LoadingSpace } from "../LoadingSpace";
import { TagIndicator } from "../../components/TagIndicator";

export function EficiencyReport(){

    //Requirements
    const {appInfo} = useAppInfo();
    const {popInAlert,popOutAlert} = useAppInfo();
    const [info,setInfo] = useState([]);
    const [users,setUsers] = useState([]);

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [reportView,setReportView] = useState(0);
    const [selectedUser,setSelectedUser] = useState();

    // FormInfo
    const columnsReport = [
        "Proceso",
        "Etapa",
        "No. registros",
        "Tiempo promedio",
        "Tiempo minimo",
        "Tiempo maximo"
    ]

    const formSetttings = {
        company_id:appInfo.company_id,
        user_id:selectedUser
    };


    // Getters of info
    const getInfo = async()=>{
        setDisabled(true)
        setLoading(true);
        let res = await postInfo('/process/getEficincyUsers',formSetttings);
        console.log(res);
        if(res[0]){
            setInfo(res[1]);
        }else{
            setInfo([])
        }
        setLoading(false);
        setDisabled(false);
    }

    const getUsers = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/getUsers',{
            company_id:appInfo.company_id,
            status:'active'
        });
        console.log(res);
        if(res[0]){
            setUsers(res[1]);
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getUsers();
    },[])

    useEffect(()=>{
        if(selectedUser != undefined && reportView == 1){
            getInfo();
        }
    },[selectedUser,reportView])

    return(
        <div className="EficiencyReport">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Eficiencia de usuarios'}/>
                <DescriptionSpan text={'Reporte de la eficiencia de los usuarios.'}/>
            </div>
            <div className="ReportFiltersContainer">
                <SearchBar placeholder={'Buscar'}/>
                <div className="InputRangeContainer">
                    <FormInput type={'date'}/>
                    <span>-</span>
                    <FormInput type={'date'}/>
                </div>
                <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} onClick={()=>{
                    //setVisibleSettings(!visibleSettings)
                }}/>
                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
                <AiButton attached={info} sugerence={[
                    {text:'¿Que representa este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
                ]}/>
            </div>
            {!loading && reportView == 0 && (
                <div className="usersGrid">
                    {users.map((element,index)=>(
                        <div key={index} className="UserCardRow" onClick={()=>{
                                setReportView(1);
                                setSelectedUser(element.user_id)
                            }}>
                            <UserCard imgSrc={element.img} name={element.user_name} desc={element.user_mail}/>
                            <span className="userRoleC">
                                <i className="fa-solid fa-id-card-clip"/>
                                {element.user_roll}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {!loading && reportView == 1 && (
                <div className="tableData">
                    <div className="GoBackButton" onClick={()=>{
                        setSelectedUser(undefined);
                        setReportView(0);
                    }}>
                        <i className="fa-solid fa-arrow-left"/>
                        Volver
                    </div>
                    <div className="headTable">
                        {columnsReport.map((element,index)=>(
                            <span key={index}>{element}</span>
                        ))}
                    </div>
                    <div className="bodyTable">
                        {info.map((element,index)=>(
                            <div className="rowTable" key={index}>
                                <TagIndicator type={'active'} title={`${element.process_name} (${element.process_code})`}/>
                                <div className="tagStageC">
                                    <TagIndicator title={element.step_name}/>
                                </div>
                                <strong>{element.total_tasks}</strong>
                                <span>{`
                                    ${element.average_time.days? `${element.average_time.days}d `:''}
                                    ${element.average_time.hours? `${element.average_time.hours}hr `:''}
                                    ${element.average_time.minutes? `${element.average_time.minutes}min`:''}
                                    ${element.average_time.seconds? `${element.average_time.seconds}s`:''}
                                `}
                                </span>
                                <span>{`
                                    ${element.record_time.days? `${element.record_time.days}d `:''}
                                    ${element.record_time.hours? `${element.record_time.hours}hr `:''}
                                    ${element.record_time.minutes? `${element.record_time.minutes}min`:''}
                                    ${element.record_time.seconds? `${element.record_time.seconds}s`:''}

                                `}
                                </span>
                                <span>{`
                                    ${element.max_time.days? `${element.max_time.days}d `:''}
                                    ${element.max_time.hours? `${element.max_time.hours}hr `:''}
                                    ${element.max_time.minutes? `${element.max_time.minutes}min `:''}
                                    ${element.max_time.seconds? `${element.max_time.seconds}s `:''}
                                `}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}