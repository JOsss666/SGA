import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';
import { ButtonDownload } from '../../components/ButtonDownload';
import { BoldTitle } from '../../components/BoldTitle';
import { FileInput } from '../../components/FileInput';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { LabelValue } from '../../components/LabelValue';
import { AccountAjustemBlockItems } from './accountAjustemBlockItems';
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
    const { appInfo, userInfo } = useAppInfo();
    const { popOutAlert } = useAlert();
    const { addNotification } = useNotifications();
    const [accounts, setAccounts] = useState([]);
    const [thirdParties, setThirdParties] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [lines, setLines] = useState(() => Array.from({ length: 5 }, emptyLine));
    const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');
    const [attached, setAttached] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [templateSaveOpen, setTemplateSaveOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    const totals = useMemo(() => lines.reduce((current, line) => ({
        debit: current.debit + amount(line.debit),
        credit: current.credit + amount(line.credit),
    }), { debit: 0, credit: 0 }), [lines]);

    const balanced = totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.001;
    const notify = (type, title, detail) => addNotification({ type, title, description: detail });

    const loadRequirements = useCallback(async () => {
        const [accountResult, thirdPartyResult, costCenterResult, templateResult] = await Promise.allSettled([
            postInfo('/getAccountsPlan', {
                company_id: appInfo.company_id,
                accountPlanId: appInfo.accountPlanId,
                accountPlanType: appInfo.accountPlanType,
            }),
            postInfo('/getThirdParties', { company_id: appInfo.company_id }),
            postInfo('/getCostCenters', { company_id: appInfo.company_id }),
            postInfo('/contability/accounting-adjustment-templates/list', {
                company_id: appInfo.company_id,
            }),
        ]);

        const accountResponse = accountResult.status === 'fulfilled' ? accountResult.value : null;
        const thirdPartyResponse = thirdPartyResult.status === 'fulfilled' ? thirdPartyResult.value : null;
        const costCenterResponse = costCenterResult.status === 'fulfilled' ? costCenterResult.value : null;
        const templateResponse = templateResult.status === 'fulfilled' ? templateResult.value : null;
        const accountRows = accountResponse?.[1]?.[1] ?? [];
        const thirdPartyRows = thirdPartyResponse?.[1] ?? [];
        const costCenterRows = costCenterResponse?.[1] ?? [];

        setAccounts(accountOptions(accountRows));
        setThirdParties(thirdPartyOptions(thirdPartyRows));
        setCostCenters(costCenterOptions(costCenterRows));
        setTemplates(templateResponse?.templates ?? []);

        if (!accountRows.length || !thirdPartyRows.length) {
            setMessage('No fue posible cargar las cuentas o terceros. Verifica la configuración de la compañía.');
        }
    }, [appInfo.accountPlanId, appInfo.accountPlanType, appInfo.company_id]);

    useEffect(() => {
        loadRequirements();
    }, [loadRequirements]);

    const payload = () => ({
        company_id: appInfo.company_id,
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
        if (!templateName.trim()) {
            setMessage('Indica un nombre para la plantilla.');
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
            setTemplateName('');
            notify('aproved', 'Plantilla guardada', 'Podrás reutilizarla en nuevos comprobantes.');
        } catch (error) {
            setMessage(error?.message ?? 'No fue posible guardar la plantilla.');
        }
    };

    const applyTemplate = template => {
        setLines(template.lines.map(line => ({ ...line, key: crypto.randomUUID() })));
        setDescription(template.description || '');
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
        } catch (error) {
            setMessage(error.message);
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
                    <FormInput title="Fecha del comprobante" type="date" value={docDate} action={setDocDate} required />
                    <FormInput title="Ultima modificación" type="date" value={docDate} disabled={true} />
                    <FormInput title="Fecha de creación" type="date" value={docDate} disabled={true} />
                </div>

                {message && <p className="formAccountingAdjustmentMessage" role="alert">{message}</p>}

                <div className="formAccountingAdjustmentTableToolbar">
                    <strong>Detalle contable</strong>
                    <div className="formAccountingAdjustmentExport">
                        <FormButton
                            type="button"
                            className="formAccountingAdjustmentDownload"
                            text="Descargar"
                            ariaLabel="Elegir formato de descarga"
                            ariaExpanded={exportOpen}
                            onClick={() => setExportOpen(current => !current)}
                        >
                            <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                        </FormButton>

                        {exportOpen && (
                            <div className="formAccountingAdjustmentExportMenu">
                                <ButtonDownload
                                    info={downloadRows}
                                    columns={exportColumns}
                                    xlsxOptions={accountingAdjustmentDownloadOptions}
                                    title="Comprobante de ajuste contable"
                                    text="Excel"
                                />
                                <FormButton
                                    type="button"
                                    text="PDF"
                                    onClick={() => downloadAccountingAdjustmentPdf({
                                        ...accountingAdjustmentDownloadOptions(),
                                        rows: downloadRows,
                                    })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <AccountAjustemBlockItems
                    lines={lines}
                    accounts={accounts}
                    thirdParties={thirdParties}
                    costCenters={costCenters}
                    totals={totals}
                    createLine={emptyLine}
                    onLinesChange={setLines}
                />

                <section className="formAccountingAdjustmentBelowTotals">
                    <section className="formAccountingAdjustmentObservation">
                        <BoldTitle text="Observaciones" />
                        <FormInput
                            hideLabel
                            textArea
                            value={description}
                            action={setDescription}
                            placeholder="Campo opcional para explicar el ajuste"
                            required={false}
                        />
                    </section>

                    <section className="formAccountingAdjustmentAttachments">
                        <BoldTitle text="Archivos adjuntos" />
                        <FileInput
                            category="files"
                            action={setAttached}
                            value={attached}
                            appendOnMultiple
                            multiple
                            placeholder="Adjuntar uno o varios soportes"
                        />
                        <ul>
                            {attached.map((file, index) => (
                                <li key={`${file.url || file}-${index}`}>
                                    <a href={file.url || file} target="_blank" rel="noreferrer">
                                        Soporte {index + 1}
                                    </a>
                                    <FormButton
                                        type="button"
                                        negative
                                        className="formAccountingAdjustmentRemoveAttachment"
                                        text="Quitar"
                                        onClick={() => setAttached(current => current.filter((_, fileIndex) => fileIndex !== index))}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                </section>

                <div className="formAccountingAdjustmentActions">
                    <FormButton
                        type="button"
                        negative
                        text="Limpiar"
                        onClick={event => {
                            event.preventDefault();
                            clean();
                        }}
                    />
                </div>

                <section className="formAccountingAdjustmentTemplates">
                    <div className="formAccountingAdjustmentTemplateActions">
                        <FormButton
                            type="button"
                            text="Plantillas recurrentes"
                            ariaExpanded={templatesOpen}
                            onClick={() => setTemplatesOpen(current => !current)}
                        />
                        <FormButton
                            type="button"
                            text="Guardar plantilla"
                            ariaExpanded={templateSaveOpen}
                            onClick={() => setTemplateSaveOpen(current => !current)}
                        />
                    </div>

                    {templateSaveOpen && (
                        <div className="formAccountingAdjustmentTemplateSave">
                            <FormInput
                                hideLabel
                                ariaLabel="Nombre de la plantilla"
                                value={templateName}
                                action={setTemplateName}
                                placeholder="Nombre de plantilla"
                            />
                            <FormButton type="button" text="Confirmar guardado" onClick={saveTemplate} />
                        </div>
                    )}

                    {templatesOpen && (templates.length ? (
                        <ul>
                            {templates.map(template => (
                                <li key={template.id}>
                                    <FormButton type="button" text={template.name} onClick={() => applyTemplate(template)} />
                                    <FormButton type="button" negative text="Eliminar" onClick={() => deleteTemplate(template)} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="formAccountingAdjustmentTemplateEmpty">No hay plantillas guardadas.</p>
                    ))}
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
