// MovementsRecord.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { TableDetailTreasury } from '../components/TableDetailTreasury';
import { FormInput } from '../components/FormInput';
import { ButtonMenu } from '../components/ButtonMenu';
import { AiButton } from '../components/ChatAiComponents/AiButton';
import { ButtonDownload } from '../components/ButtonDownload';
import './MovementsRecord.css';

export function MovementsRecord() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handleBack = () => {
        navigate(-1);
    };

    // TODOS los movimientos
    const allMovements = [
        {
            id: 1,
            name: "Caja 1",
            description: "Caja principal",
            type: "Ingreso",
            concepto: "Venta al contado",
            negocio: "Tienda Principal",
            centroCosto: "Caja Central",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: -100000000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>
        },
        {
            id: 2,
            name: "Tienda 1",
            description: "Tienda del norte",
            type: "Gasto",
            concepto: "Compra de insumos",
            negocio: "Tienda Norte",
            centroCosto: "Compras",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: 100000000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>
        },
        // ... resto de los datos (mantener igual)
    ];

    // Columnas para la tabla
    const columns = [
        { key: "card", label: "Módulo" },
        { key: "type", label: "Tipo" },
        { key: "concepto", label: "Concepto" },
        { key: "negocio", label: "Negocio" },
        { key: "centroCosto", label: "Centro de costo" },
        { key: "fecha", label: "Fecha" },
        { key: "monto", label: "Monto" },
        { key: "balance", label: "Estado" }
    ];

    return (
        <div className="MovementsRecord">
            <div className="backButton">
                <button onClick={handleBack} className="backBtn">
                    <i className="fa-solid fa-arrow-left"></i>
                    Volver a Movimientos
                </button>
            </div>
            
            {/* Encabezado */}
            <div className="recordHeader">
                <BoldTitle text={'Historial de movimientos'} />
                <DescriptionSpan text={'Analiza, gestiona y revisa todos los movimientos registrados'} />
            </div>

            <div className="settingsReport">
                <div className="leftTools">
                    <SearchBar 
                        placeholder={'Buscar movimiento...'} 
                        action={setSearch}
                    />
                    
                    <div className="rangeInput">
                        <FormInput 
                            type={'date'} 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span>-</span>
                        <FormInput 
                            type={'date'} 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    
                    <SelectOptions
                        options={[
                            'Ascendente (fecha)',
                            'Descendente (fecha)',
                            'Ascendente (Nombre)',
                            'Descendente (Nombre)',
                        ]}
                        title={'Orden'}
                    />
                    
                    <ButtonMenu title={'Más ajustes'} noRotate={true}>
                        <i className="fa-solid fa-sliders" />
                    </ButtonMenu>
                </div>
                
                <div className="rightTools">
                    <AiButton
                        attached={allMovements}
                    />
                    
                    <ButtonDownload />
                </div>
            </div>

            {/* Tabla de movimientos */}
            <div className="movementsTable">
                <TableDetailTreasury 
                    columns={columns}
                    data={allMovements}
                    search={search}
                />
            </div>
        </div>
    );
}