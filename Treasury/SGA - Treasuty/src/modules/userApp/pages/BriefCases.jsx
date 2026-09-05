import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { SearchBar } from '../components/SearchBar';
import { UniversalTable } from '../containers/universalTable';
import { useAppInfo } from '../../../context/context';
import { moneyFormat, postInfo } from '../../../utils/functions';
import './briefCases.css';

const portfolioColumns = [
    { key: 'names', label: 'Tercero', minWidth: '13rem', flex: '1.6 1 13rem', order: 'ASC' },
    { key: 'creditStatus', label: 'Crédito', minWidth: '8rem', flex: '0.8 1 8rem' },
    { key: 'credit_term', label: 'Plazo', minWidth: '7rem', flex: '0.7 1 7rem' },
    { key: 'credit_value', label: 'Cupo máximo', minWidth: '10rem' },
    { key: 'availableCredit', label: 'Cupo disponible', minWidth: '11rem' },
    { key: 'totalDebt', label: 'Cartera', minWidth: '10rem' },
    { key: 'currentBalance', label: 'Corriente', minWidth: '10rem' },
    { key: 'overdueBalance', label: 'Vencido', minWidth: '10rem' }
];

const parseAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value) => `$ ${moneyFormat(parseAmount(value).toFixed(2))}`;

const CurrencyCell = ({ value }) => (
    <span className="briefCasesCurrency" title={formatCurrency(value)}>{formatCurrency(value)}</span>
);

const CreditStatusCell = ({ value }) => (
    <span className={`briefCasesStatus ${value === 'Habilitado' ? 'enabled' : 'disabled'}`}>
        <i className="fa-solid fa-circle" aria-hidden="true" />
        {value}
    </span>
);

const TermCell = ({ value }) => <span>{parseAmount(value)} días</span>;

const portfolioRenderers = {
    creditStatus: CreditStatusCell,
    credit_term: TermCell,
    credit_value: CurrencyCell,
    availableCredit: CurrencyCell,
    totalDebt: CurrencyCell,
    currentBalance: CurrencyCell,
    overdueBalance: CurrencyCell
};

export function BriefCases() {
    const { appInfo } = useAppInfo();
    const [portfolio, setPortfolio] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPortfolio = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await postInfo('/getThirdParties', {
                company_id: appInfo.company_id,
                comercialInfo: true
            });

            if (!response?.[0]) throw new Error('No fue posible consultar la cartera.');
            setPortfolio(Array.isArray(response[1]) ? response[1] : []);
        } catch (loadError) {
            console.error('Error al consultar la cartera:', loadError);
            setPortfolio([]);
            setError('No pudimos cargar la cartera. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [appInfo.company_id]);

    useEffect(() => {
        loadPortfolio();
    }, [loadPortfolio]);

    const portfolioRows = useMemo(() => portfolio.map((thirdParty) => {
        const totalDebt = parseAmount(thirdParty.thirdParty_balance ?? thirdParty.thirdParty_totalDebt);
        const creditValue = parseAmount(thirdParty.credit_value);

        return {
            ...thirdParty,
            creditStatus: thirdParty.credit ? 'Habilitado' : 'No habilitado',
            availableCredit: parseAmount(thirdParty.aviable_credit ?? (creditValue - totalDebt)),
            totalDebt,
            currentBalance: parseAmount(thirdParty.thirdParty_currentBalance),
            overdueBalance: parseAmount(thirdParty.thirdParty_overdueBalance)
        };
    }), [portfolio]);

    const summary = useMemo(() => portfolioRows.reduce((totals, row) => ({
        total: totals.total + row.totalDebt,
        current: totals.current + row.currentBalance,
        overdue: totals.overdue + row.overdueBalance
    }), { total: 0, current: 0, overdue: 0 }), [portfolioRows]);

    return (
        <section className="briefCases">
            <header className="briefCasesHeader">
                <div>
                    <BoldTitle text="Cartera" />
                    <DescriptionSpan text="Consulta los saldos de cartera y la disponibilidad de crédito por tercero." />
                </div>
                <span className="briefCasesSampleBadge">Nueva tabla universal</span>
            </header>

            <div className="briefCasesSummary" aria-label="Resumen de cartera">
                <article>
                    <span>Cartera total</span>
                    <strong>{formatCurrency(summary.total)}</strong>
                </article>
                <article>
                    <span>Saldo corriente</span>
                    <strong>{formatCurrency(summary.current)}</strong>
                </article>
                <article>
                    <span>Saldo vencido</span>
                    <strong>{formatCurrency(summary.overdue)}</strong>
                </article>
            </div>

            <div className="briefCasesToolbar">
                <SearchBar
                    placeholder="Buscar tercero o valor"
                    value={searchValue}
                    action={setSearchValue}
                />
            </div>

            {error && (
                <div className="briefCasesError" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={loadPortfolio}>Reintentar</button>
                </div>
            )}

            <div className="briefCasesTable">
                <UniversalTable
                    columns={portfolioColumns}
                    results={portfolioRows}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={loading}
                    height="48vh"
                    getRowKey={(row, index) => row.id ?? row.thirdParty_id ?? `${row.names}-${index}`}
                    rowProps={{ renderers: portfolioRenderers }}
                    emptyMessage="No hay terceros que coincidan con la búsqueda"
                />
            </div>
        </section>
    );
}
