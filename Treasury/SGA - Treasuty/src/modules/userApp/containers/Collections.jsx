import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { useEffect, useState } from "react";

import "./Payments.css";
import { AccountsPayable } from "./PaymentSections/AccountsPayable";

    export function Collections() {
        const [loading,setLoading] = useState(false);
        const [activeSection,setActiveSection] = useState(2);

        const valuesCard = {
            paidValue: 1200000000,
            totalValue: 5300000000,
        };

        const formatCurrency = (value) =>
            new Intl.NumberFormat("es-CO").format(value);

        const percentage = Math.round(
            (valuesCard.paidValue / valuesCard.totalValue) * 100
        );

        const leftOptions = [
            {title:'Nuevo cobro',
            icon:<i className="fa-solid fa-plus" />,
            color:true},
            {title:'Nueva cuenta por cobrar',
            icon:<i className="fa-solid fa-plus" />,
            color:true},
            {title:'Cuentas por cobrar',
            icon:<i className="fa-solid fa-list"/>,
            color:false},
            {title:'Estadisticas',
            icon:<i className="fa-solid fa-chart-simple"/>,
            color:false},
            {title:'Historial de cobros',
            icon:<i className="fa-regular fa-clock"/>,
            color:false},
            {title:'Informes',
            icon:<i className="fa-solid fa-receipt"/>,
            color:false}
        ]

        /* BACKEND DESACTIVADO */
        /*
        const GetDocuments = async () => {
            setLoading(true);
            let res = await postInfo('/getDocuments', settingsReport);
            if (res[0]) {
            setInfo(res[1]);
            }
            setLoading(false);
        };

        useEffect(() => {
            GetDocuments();
        }, []);
        */

        return (
            <div className="Payments">
                <div className="SidebarLeft">
                    <div className="TitleSidebar">
                        <BoldTitle text="Cobros" />
                        <DescriptionSpan text="Administra tus cuentas por pagar" />
                    </div>
                    <div className="OptionsSidebarLeft">
                        {leftOptions.map((element,index)=>(
                            <button key={index} className={`ButtonLeftAction ${index == activeSection? 'activeBtnSec':''}`} onClick={()=>{
                                setActiveSection(index)
                            }}>
                                <div className={`iconBtnC ${element.color? 'inconBtnColor':''}`}>
                                    {element.icon}
                                </div>
                                {element.title}
                            </button>
                        ))}
                    </div>
                    <div className="CardPayments">
                        <div className="Progress">
                            <span>{percentage}%</span>
                        </div>
                        <div className="Text">
                            <BoldTitle text="Valor cobrado" />
                            <div className="valuesPayment">
                                <h5 className="activeVal">$ <b>{formatCurrency(valuesCard.paidValue)}</b></h5>
                                <h5 className="totalVal">de $ {formatCurrency(valuesCard.totalValue)}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="SideBarRight">
                    <div className="headTitleRight">
                        <BoldTitle text={leftOptions[activeSection].title}/>
                    </div>
                    <div className="spaceRightSection">
                        {!loading && activeSection == 2 && (
                            <AccountsPayable/>
                        )}
                    </div>
                </div>
            </div>
        );
}
