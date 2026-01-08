import { useState, useEffect } from "react";
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";
import { postInfo } from "../../../utils/functions";
import './GeneralInfoBody.css';

export function GeneralInfoBody({ storeInfo, companyId, reloadInfo }) {
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [formData, setFormData] = useState({
        legalName: "",
        brandName: "",
        identificationNumber: "",
        identificationType: "",
        email: "",
        phone: "",
        country: "",
        city: "",
        address: ""
    });

    useEffect(() => {
        if (storeInfo) {
            setFormData({
                legalName: storeInfo.legal_name || "",
                brandName: storeInfo.brand_name || storeInfo.name || "",
                identificationNumber: storeInfo.identification_number || "",
                identificationType: storeInfo.identification_type || "",
                email: storeInfo.email || "",
                phone: storeInfo.phone || "",
                country: storeInfo.country || "",
                city: storeInfo.city || "",
                address: storeInfo.address || ""
            });
        }
    }, [storeInfo]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDisabled(true);

        try {
            const dataToSend = {
                company_id: companyId,
                store_id: storeInfo.id,
                ...formData
            };

            const res = await postInfo('/updateStoreInfo', dataToSend);
            if (res && res[0]) {
                alert("Información guardada correctamente");
                if (reloadInfo) reloadInfo();
            } else {
                alert("Error al guardar la información");
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    };

    return (
        <div className="GeneralInfoBody">
            <form className="GeneralInfoForm" onSubmit={handleSave}>
                <div className="FormRow">
                    <FormInput
                        title="Nombre legal"
                        placeholder="Nombre legal del negocio"
                        value={formData.legalName}
                        action={(value) => handleInputChange('legalName', value)}
                    />
                    <FormInput
                        title="Nombre de marca"
                        placeholder="Nombre comercial"
                        value={formData.brandName}
                        action={(value) => handleInputChange('brandName', value)}
                    />
                    <FormInput
                        title="Número de identificación"
                        placeholder="RUC/Cédula/NIT"
                        value={formData.identificationNumber}
                        action={(value) => handleInputChange('identificationNumber', value)}
                    />
                </div>

                <div className="FormRow">
                    <FormInput
                        title="Tipo de identificación"
                        placeholder="Ej: RUC, Cédula, Pasaporte"
                        value={formData.identificationType}
                        action={(value) => handleInputChange('identificationType', value)}
                    />
                    <FormInput
                        title="Correo electrónico"
                        placeholder="correo@ejemplo.com"
                        type="email"
                        value={formData.email}
                        action={(value) => handleInputChange('email', value)}
                    />
                    <FormInput
                        title="Teléfono"
                        placeholder="+1234567890"
                        type="tel"
                        value={formData.phone}
                        action={(value) => handleInputChange('phone', value)}
                    />
                </div>

                <div className="FormRow">
                    <FormInput
                        title="País"
                        placeholder="País"
                        value={formData.country}
                        action={(value) => handleInputChange('country', value)}
                    />
                    <FormInput
                        title="Ciudad"
                        placeholder="Ciudad"
                        value={formData.city}
                        action={(value) => handleInputChange('city', value)}
                    />
                    <FormInput
                        title="Dirección"
                        placeholder="Dirección completa"
                        value={formData.address}
                        action={(value) => handleInputChange('address', value)}
                    />
                </div>

                <div className="FormActions">
                    <FormButton
                        text={loading ? "Guardando..." : "Guardar Cambios"}
                        disabled={disabled || loading}
                        loading={loading}
                        type="submit"
                    />
                </div>
            </form>
        </div>
    );
}