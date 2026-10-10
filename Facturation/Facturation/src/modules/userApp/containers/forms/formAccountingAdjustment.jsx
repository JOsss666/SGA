import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';
import { ButtonDownload } from '../../components/ButtonDownload';
import { BoldTitle } from '../../components/BoldTitle';
import { FileInput } from '../../components/FileInput';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { LabelValue } from '../../components/LabelValue';
import { SearchinList } from '../../components/SearchInList';
import { AccountAjustemBlockItems } from './accountAjustemBlockItems';
import { AccounAdjusmentTemplates } from './accounAdjusmentTemplates';
import { downloadAccountingAdjustmentPdf, postInfo } from '../../../../utils/functions';
import { urlSer } from '../../../../App';
import './formAccountingAdjustment.css';

const emptyLine = () => ({
    key: crypto.randomUUID(),
    account_id: '',
    thirdParty_id: '',
    costCenter_id: '',
    description: '',
    debit: '',
    credit: '',
});

const amount = value => Number(value || 0);

const dateInputValue = value => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const accountOptions = rows => {
    const normalizedRows = rows.filter(row => row.code !== undefined && row.code !== null);
    const leafAccounts = normalizedRows.filter(row => {
        const code = String(row.code).trim();

        return !normalizedRows.some(candidate => {
            const candidateCode = String(candidate.code).trim();
            return candidateCode.length > code.length && candidateCode.startsWith(code);
        });
    });

    return leafAccounts.map(row => ({
        value: row.id,
        text: `${row.code} — ${row.name}`,
        selectedText: row.code,
        code: row.code,
        name: row.name,
    }));
};

const thirdPartyOptions = rows => rows.map(row => ({
    value: row.id,
    text: `${row.names} — ${row.indentification_number ?? row.id}`,
    selectedText: row.names,
    identifier: String(row.indentification_number ?? row.id),
    name: row.names,
}));

const costCenterOptions = rows => rows.map(row => ({
    value: row.id,
    text: row.name,
    selectedText: row.name,
    name: row.name,
}));

export function FormAccountingAdjustment({ reloadFun }) {
    const { appInfo, userInfo, userConfig } = useAppInfo();
    const { popInAlert, popOutAlert } = useAlert();
    const { addNotification } = useNotifications();
    const [accounts, setAccounts] = useState([]);
    const [thirdParties, setThirdParties] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [stores, setStores] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [storeId, setStoreId] = useState('');
    const [bussinesId, setBussinesId] = useState('');
    const [conceptId, setConceptId] = useState('');
    const [lines, setLines] = useState(() => Array.from({ length: 5 }, emptyLine));
    const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [createdDate] = useState(() => dateInputValue(new Date()));
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [description, setDescription] = useState('');
    const [attached, setAttached] = useState([]);
    const [templates, setTemplates] = useState([]);
    const templateNameRef = useRef('');
    const templateSaveAlertIdRef = useRef(null);
    const [message, setMessage] = useState('');
    const [storeError, setStoreError] = useState('');
    const [storeLoadError, setStoreLoadError] = useState('');
    const [bussinesError, setBussinesError] = useState('');
    const [bussinesLoadError, setBussinesLoadError] = useState('');
    const [conceptError, setConceptError] = useState('');
    const [conceptLoadError, setConceptLoadError] = useState('');
    const [loadingStores, setLoadingStores] = useState(false);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [saving, setSaving] = useState(false);

    const totals = useMemo(() => lines.reduce((current, line) => ({
        debit: current.debit + amount(line.debit),
        credit: current.credit + amount(line.credit),
    }), { debit: 0, credit: 0 }), [lines]);

    const balanced = totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.001;
    const notify = (type, title, detail) => addNotification({ type, title, description: detail });

    const getAccounts = useCallback(async () => {
        const response = await postInfo('/getAccountsPlan', {
            company_id: appInfo.company_id,
            accountPlanId: appInfo.accountPlanId,
            accountPlanType: appInfo.accountPlanType,
        });
        const options = accountOptions(response?.[1]?.[1] ?? []);
        setAccounts(options);
        return options;
    }, [appInfo.accountPlanId, appInfo.accountPlanType, appInfo.company_id]);

    const getThirdParties = useCallback(async () => {
        const response = await postInfo('/getThirdParties', { company_id: appInfo.company_id });
        const options = thirdPartyOptions(response?.[1] ?? []);
        setThirdParties(options);
        return options;
    }, [appInfo.company_id]);

    const getStores = useCallback(async () => {
        setLoadingStores(true);
        setStoreLoadError('');
        try {
            const storeAccess = userConfig?.access?.stores;
            const allowedStores = storeAccess?.overAll === true
                ? undefined
                : storeAccess
                    ? (Array.isArray(storeAccess.enabled) ? storeAccess.enabled : [])
                    : undefined;
            const response = await postInfo('/getStores', {
                company_id: appInfo.company_id,
                allowedStores,
            });
            if (!response?.[0]) throw new Error('No fue posible consultar las tiendas disponibles.');

            const options = (response[1] ?? []).map(store => ({
                value: store.id,
                text: store.name,
                selectedText: store.name,
            }));
            setStores(options);
            if (!options.length) setStoreLoadError('No tienes tiendas disponibles para esta compañía.');
            return options;
        } catch (error) {
            setStores([]);
            setStoreLoadError(error?.message ?? 'No fue posible cargar las tiendas.');
            return [];
        } finally {
            setLoadingStores(false);
        }
    }, [appInfo.company_id, userConfig]);

    const getBusinesses = useCallback(async () => {
        setLoadingBusinesses(true);
        setBussinesLoadError('');
        try {
            const businessAccess = userConfig?.access?.bussines;
            const allowedBussines = businessAccess?.overAll === true
                ? undefined
                : businessAccess
                    ? (Array.isArray(businessAccess.enabled) ? businessAccess.enabled : [])
                    : undefined;
            const response = await postInfo('/getBussines', {
                company_id: appInfo.company_id,
                allowedBussines,
            });
            if (!response?.[0]) throw new Error('No fue posible consultar los negocios disponibles.');

            const options = (response[1] ?? []).map(business => ({
                value: business.id,
                text: business.name,
                selectedText: business.name,
            }));
            setBusinesses(options);
            if (!options.length) setBussinesLoadError('No tienes negocios disponibles para esta compañía.');
            return options;
        } catch (error) {
            setBusinesses([]);
            setBussinesLoadError(error?.message ?? 'No fue posible cargar los negocios.');
            return [];
        } finally {
            setLoadingBusinesses(false);
        }
    }, [appInfo.company_id, userConfig]);

    const getConcepts = useCallback(async () => {
        setLoadingConcepts(true);
        setConceptLoadError('');
        try {
            const conceptAccess = userConfig?.access?.sections?.concepts;
            const allowedConcepts = conceptAccess?.overAll === true
                ? undefined
                : conceptAccess
                    ? (Array.isArray(conceptAccess.enabled) ? conceptAccess.enabled : [])
                    : undefined;
            const response = await postInfo('/getConcepts', {
                company_id: appInfo.company_id,
                allowedConcepts,
            });
            if (!response?.[0]) throw new Error('No fue posible consultar los conceptos disponibles.');

            const options = (response[1] ?? []).map(concept => ({
                value: concept.id,
                text: `SGA#${concept.id} ${concept.name}`,
                selectedText: concept.name,
            }));
            setConcepts(options);
            if (!options.length) setConceptLoadError('No hay conceptos disponibles para esta compañía.');
            return options;
        } catch (error) {
            setConcepts([]);
            setConceptLoadError(error?.message ?? 'No fue posible cargar los conceptos.');
            return [];
        } finally {
            setLoadingConcepts(false);
        }
    }, [appInfo.company_id, userConfig]);

    const getTemplates = useCallback(async () => {
        const response = await postInfo('/contability/accounting-adjustment-templates/list', {
            company_id: appInfo.company_id,
        });
        const loadedTemplates = response?.templates ?? [];
        setTemplates(loadedTemplates);
        return loadedTemplates;
    }, [appInfo.company_id]);

    const loadRequirements = useCallback(async () => {
        const [accountResult, thirdPartyResult, costCenterResult, templateResult, conceptResult] = await Promise.allSettled([
            getAccounts(),
            getThirdParties(),
            postInfo('/getCostCenters', { company_id: appInfo.company_id }),
            getTemplates(),
            getConcepts(),
            getStores(),
            getBusinesses(),
        ]);

        const costCenterResponse = costCenterResult.status === 'fulfilled' ? costCenterResult.value : null;
        const costCenterRows = costCenterResponse?.[1] ?? [];

        setCostCenters(costCenterOptions(costCenterRows));
        if (templateResult.status === 'rejected') setTemplates([]);

        const accountOptionsLoaded = accountResult.status === 'fulfilled' ? accountResult.value : [];
        const thirdPartyOptionsLoaded = thirdPartyResult.status === 'fulfilled' ? thirdPartyResult.value : [];
        if (conceptResult.status === 'fulfilled' && conceptResult.value.length === 1) {
            setConceptId(String(conceptResult.value[0].value));
        }
        if (!accountOptionsLoaded.length || !thirdPartyOptionsLoaded.length) {
            setMessage('No fue posible cargar las cuentas o terceros. Verifica la configuración de la compañía.');
        }
    }, [appInfo.company_id, getAccounts, getBusinesses, getConcepts, getStores, getTemplates, getThirdParties]);

    useEffect(() => {
        loadRequirements();
    }, [loadRequirements]);

    const payload = () => ({
        company_id: appInfo.company_id,
        store_id: storeId,
        bussines_id: bussinesId,
        concept_id: conceptId,
        doc_date: docDate,
        description,
        attached,
        lines: lines.map(line => ({
            account_id: line.account_id,
            thirdParty_id: line.thirdParty_id,
            costCenter_id: line.costCenter_id,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
        })),
    });

    const canSave = balanced && lines.filter(line => amount(line.debit) || amount(line.credit)).length >= 2;

    const save = async event => {
        event.preventDefault();

        if (!storeId) {
            setStoreError('Selecciona la tienda del comprobante.');
            return;
        }
        if (!bussinesId) {
            setBussinesError('Selecciona el negocio del comprobante.');
            return;
        }
        if (!conceptId) {
            setConceptError('Selecciona el concepto del comprobante.');
            return;
        }

        if (!canSave) {
            setMessage('Completa al menos dos líneas y verifica que débitos y créditos sean iguales.');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const response = await postInfo('/contability/accounting-adjustments', payload());
            notify(
                'aproved',
                `Comprobante #${response.ownSerial} contabilizado`,
                'El ajuste quedó registrado en los informes contables.',
            );
            reloadFun?.();
            popOutAlert();
        } catch (error) {
            setMessage(error?.message ?? error?.error?.message ?? 'No fue posible contabilizar el comprobante.');
        } finally {
            setSaving(false);
        }
    };

    const clean = () => {
        setLines(Array.from({ length: 5 }, emptyLine));
        setDescription('');
        setAttached([]);
        setMessage('Formulario limpiado.');
    };

    const saveTemplate = async () => {
        const templateName = templateNameRef.current.trim();
        if (!templateName) {
            notify('error', 'Nombre requerido', 'Indica un nombre para la plantilla.');
            return;
        }

        try {
            const response = await postInfo('/contability/accounting-adjustment-templates', {
                ...payload(),
                name: templateName,
            });

            setTemplates(current => [
                ...current.filter(item => item.id !== response.template.id),
                response.template,
            ].sort((first, second) => first.name.localeCompare(second.name)));
            setSelectedTemplate(response.template);
            templateNameRef.current = '';
            notify('aproved', 'Plantilla guardada', 'Podrás reutilizarla en nuevos comprobantes.');
            popOutAlert(templateSaveAlertIdRef.current);
        } catch (error) {
            notify('error', 'No fue posible guardar la plantilla', error?.message ?? 'Inténtalo de nuevo.');
        }
    };

    const applyTemplate = template => {
        setLines(template.lines.map(line => ({ ...line, key: crypto.randomUUID() })));
        setDescription(template.description || '');
        setSelectedTemplate(template);
        setMessage(`Plantilla “${template.name}” aplicada. Define la fecha antes de guardar.`);
    };

    const deleteTemplate = async template => {
        try {
            const response = await fetch(
                `${urlSer}/contability/accounting-adjustment-templates/${template.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'X-SGA-Company-Id': String(appInfo.company_id) },
                },
            );

            if (!response.ok) throw new Error('No fue posible eliminar la plantilla.');
            setTemplates(current => current.filter(item => item.id !== template.id));
            setSelectedTemplate(current => current?.id === template.id ? null : current);
            return true;
        } catch (error) {
            notify('error', 'No fue posible eliminar la plantilla', error.message);
            return false;
        }
    };

    const downloadRows = lines.map((line, index) => {
        const account = accounts.find(item => String(item.value) === String(line.account_id));
        const thirdParty = thirdParties.find(item => String(item.value) === String(line.thirdParty_id));
        const costCenter = costCenters.find(item => String(item.value) === String(line.costCenter_id));

        return {
            linea: index + 1,
            codigo_cuenta: account?.code || '',
            nombre_cuenta: account?.name || '',
            descripcion: line.description,
            identificacion_tercero: thirdParty?.identifier || '',
            nombre_tercero: thirdParty?.name || '',
            centro_costo: costCenter?.name || '',
            debito: amount(line.debit),
            credito: amount(line.credit),
        };
    });

    const accountingAdjustmentDownloadOptions = () => ({
        companyName: appInfo.legal_name || appInfo.trade_name || appInfo.company_name || 'Compañía',
        taxId: appInfo.nit || appInfo.identification || appInfo.identification_number || appInfo.document_number || 'No registrado',
        reportName: 'Comprobante de ajuste contable',
        documentDate: new Date(`${docDate}T00:00:00`).toLocaleDateString('es-CO'),
        observations: description,
        preparedBy: userInfo.user_name || userInfo.user_mail || 'No registrado',
        startRow: 6,
    });

    const exportColumns = [
        { header: 'Línea', key: 'linea' },
        { header: 'Código cuenta', key: 'codigo_cuenta' },
        { header: 'Nombre cuenta', key: 'nombre_cuenta' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'ID tercero', key: 'identificacion_tercero' },
        { header: 'Nombre tercero', key: 'nombre_tercero' },
        { header: 'Centro de costo', key: 'centro_costo' },
        { header: 'Débito', key: 'debito' },
        { header: 'Crédito', key: 'credito' },
    ];

    return (
        <section className="formAccountingAdjustment">
            <header className="formAccountingAdjustmentHeader">
                <div>
                    <BoldTitle text="Comprobante de ajuste contable" />
                </div>
                <div className="formAccountingAdjustmentHeaderActions">
                    <span>Consecutivo No.</span>
                    <strong>Se asigna al guardar</strong>
                </div>
            </header>

            <form onSubmit={save}>
                <div className="formAccountingAdjustmentMeta">
                    <FormInput title="Fecha comprobante" type="date" value={docDate} action={setDocDate} required />
                    <FormInput
                        title="Última modificación"
                        type="date"
                        value={dateInputValue(selectedTemplate?.updated_at ?? selectedTemplate?.created_at)}
                        disabled
                    />
                    <FormInput title="Fecha de creación" type="date" value={createdDate} disabled />
                    <div className="formAccountingAdjustmentStore">
                        <SearchinList
                            title="Tienda"
                            placeHolder={loadingStores ? 'Cargando tiendas…' : 'Seleccione la tienda'}
                            list={stores}
                            value={storeId}
                            action={value => {
                                setStoreId(value);
                                setStoreError('');
                            }}
                            disabled={loadingStores || saving || stores.length === 0}
                        />
                        {(storeError || storeLoadError) && (
                            <span className="formAccountingAdjustmentStoreError" role="alert">
                                {storeError || storeLoadError}
                            </span>
                        )}
                    </div>
                    <div className="formAccountingAdjustmentBussines">
                        <SearchinList
                            title="Negocio"
                            placeHolder={loadingBusinesses ? 'Cargando negocios…' : 'Seleccione el negocio'}
                            list={businesses}
                            value={bussinesId}
                            action={value => {
                                setBussinesId(value);
                                setBussinesError('');
                            }}
                            disabled={loadingBusinesses || saving || businesses.length === 0}
                        />
                        {(bussinesError || bussinesLoadError) && (
                            <span className="formAccountingAdjustmentStoreError" role="alert">
                                {bussinesError || bussinesLoadError}
                            </span>
                        )}
                    </div>
                    <div className="formAccountingAdjustmentConcept">
                        <SearchinList
                            title="Concepto"
                            placeHolder={loadingConcepts ? 'Cargando conceptos…' : 'Seleccione el concepto'}
                            list={concepts}
                            value={conceptId}
                            action={value => {
                                setConceptId(value);
                                setConceptError('');
                            }}
                            disabled={loadingConcepts || saving || concepts.length === 0}
                        />
                        {(conceptError || conceptLoadError) && (
                            <span className="formAccountingAdjustmentStoreError" role="alert">
                                {conceptError || conceptLoadError}
                            </span>
                        )}
                    </div>
                    <ButtonDownload
                            info={downloadRows}
                            columns={exportColumns}
                            formats={["xlsx", "csv", "pdf"]}
                            formatHandlers={{
                                pdf: () => downloadAccountingAdjustmentPdf({
                                    ...accountingAdjustmentDownloadOptions(),
                                    rows: downloadRows,
                                }),
                            }}
                            xlsxOptions={accountingAdjustmentDownloadOptions}
                            title="Comprobante de ajuste contable"
                        />
                </div>

                {message && <p className="formAccountingAdjustmentMessage" role="alert">
                    <i className="bi bi-chat"/>
                    {message}
                </p>}

                <AccountAjustemBlockItems
                    lines={lines}
                    accounts={accounts}
                    thirdParties={thirdParties}
                    getAccounts={getAccounts}
                    getThirdParties={getThirdParties}
                    costCenters={costCenters}
                    totals={totals}
                    createLine={emptyLine}
                    onLinesChange={setLines}
                />

                <section className="formAccountingAdjustmentBelowTotals">
                    <div className="docComplement">
                        <FormInput
                            hideLabel
                            textArea
                            value={description}
                            action={setDescription}
                            placeholder="Descripción: Ej. Campo opcional para explicar el ajuste"
                            required={false}
                        />
                    </div>

                    <div className="docComplement">
                        <FileInput
                            category="files"
                            action={setAttached}
                            value={attached}
                            appendOnMultiple
                            multiple
                            placeholder="Adjuntar uno o varios soportes"
                        />
                    </div>
                </section>

                <section className="formAccountingAdjustmentTemplates">

                    <div className="formAccountingAdjustmentTemplateActions">
                        <FormButton
                            type="button"
                            negative
                            text="Limpiar"
                            onClick={event => {
                                event.preventDefault();
                                clean();
                            }}
                        />
                        <FormButton
                            type="button"
                            text="Plantillas recurrentes"
                            onClick={() => popInAlert(
                                <AccounAdjusmentTemplates
                                    templates={templates}
                                    loadTemplates={getTemplates}
                                    onApply={applyTemplate}
                                    onDelete={deleteTemplate}
                                />,
                            )}
                        />
                        <FormButton
                            type="button"
                            text="Guardar plantilla"
                            onClick={() => {
                                templateNameRef.current = '';
                                templateSaveAlertIdRef.current = popInAlert(
                                    <div className="formAccountingAdjustmentTemplateSave">
                                        <BoldTitle text="Guardar plantilla" />
                                        <FormInput
                                            hideLabel
                                            ariaLabel="Nombre de la plantilla"
                                            action={value => {
                                                templateNameRef.current = value;
                                            }}
                                            placeholder="Nombre de plantilla"
                                        />
                                        <FormButton type="button" text="Confirmar guardado" onClick={saveTemplate} />
                                    </div>,
                                );
                            }}
                        />
                    </div>

                </section>

                <div className="formAccountingAdjustmentFooter">
                    <FormButton
                        negative
                        text="Cancelar"
                        onClick={event => {
                            event.preventDefault();
                            popOutAlert();
                        }}
                    />
                    <FormButton disabled={saving || !canSave} loading={saving} text="Guardar y contabilizar" />
                </div>
            </form>
        </section>
    );
}
