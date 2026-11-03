import { useMemo, useState } from "react";
import { ButtonDownload } from "../components/ButtonDownload";
import { MoreOptions } from "../components/MoreOptions";
import { SearchBar } from "../components/SearchBar";
import { UniversalTable } from "../containers/universalTable";
import "./BankDetails.css";

const tabs = [
    "Movimientos",
    "Información general",
    "Cuentas Bancarias",
    "Conciliación Bancaria",
    "Informes",
    "Estadísticas",
];

const movementColumns = [
    { key: "date", label: "Fecha", minWidth: "9rem" },
    { key: "reference", label: "Referencia", minWidth: "9rem" },
    { key: "description", label: "Descripción", minWidth: "14rem" },
    { key: "type", label: "Tipo", minWidth: "9rem" },
    { key: "value", label: "Valor", minWidth: "10rem" },
    { key: "balance", label: "Saldo", minWidth: "10rem" },
];

const downloadColumns = movementColumns.map(({ key, label }) => ({
    key,
    header: label,
    width: 20,
}));

const mockMovements = [
    {
        id: 1,
        date: "2026-10-24",
        reference: "TR-2041",
        description: "Pago a proveedor",
        type: "Débito",
        value: 1250000,
        balance: 262320000,
    },
    {
        id: 2,
        date: "2026-10-23",
        reference: "TR-2038",
        description: "Recaudo de clientes",
        type: "Crédito",
        value: 3200000,
        balance: 263570000,
    },
    {
        id: 3,
        date: "2026-10-22",
        reference: "TR-2033",
        description: "Transferencia bancaria",
        type: "Débito",
        value: 850000,
        balance: 260370000,
    },
];

const accountOptions = [
    {
        text: "Ver movimientos",
        icon: <i className="fa-solid fa-arrow-right-arrow-left" />,
    },
    {
        text: "Editar cuenta",
        icon: <i className="fa-solid fa-pencil" />,
    },
];

const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const getMockAccounts = (bank) => [
    {
        id: `${bank?.id ?? "bank"}-account-1`,
        name: "Cuenta principal",
        type: "Cuenta corriente",
        number: "****7893",
        fullNumber: "1234567893",
        description: "Cuenta principal para operaciones y pagos.",
        balance: 263570000,
    },
    {
        id: `${bank?.id ?? "bank"}-account-2`,
        name: "Cuenta de ahorros",
        type: "Cuenta de ahorros",
        number: "****4218",
        fullNumber: "9876544218",
        description: "Cuenta empresarial para recaudos.",
        balance: 84750000,
    },
    {
        id: `${bank?.id ?? "bank"}-account-3`,
        name: "Cuenta de nómina",
        type: "Cuenta corriente",
        number: "****6052",
        fullNumber: "4567896052",
        description: "Cuenta destinada al pago de nómina.",
        balance: 42800000,
    },
];

export function BankDetails({ info, onBack }) {
    const [activeTab, setActiveTab] = useState("Movimientos");
    const [activeAccountIndex, setActiveAccountIndex] = useState(0);
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    const [movementSearch, setMovementSearch] = useState("");
    const [accountSearch, setAccountSearch] = useState("");
    const [accountType, setAccountType] = useState("Todas");
    const [accountOrder, setAccountOrder] = useState("A-Z");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const accounts = useMemo(
        () =>
            Array.isArray(info?.accounts) && info.accounts.length > 0
                ? info.accounts
                : getMockAccounts(info),
        [info]
    );

    const safeAccountIndex =
        activeAccountIndex < accounts.length ? activeAccountIndex : 0;
    const activeAccount = accounts[safeAccountIndex];

    const visibleMovements = useMemo(
        () =>
            mockMovements.filter(
                (movement) =>
                    (!startDate || movement.date >= startDate) &&
                    (!endDate || movement.date <= endDate)
            ),
        [startDate, endDate]
    );

    const visibleAccounts = useMemo(() => {
        const normalizedSearch = accountSearch.trim().toLocaleLowerCase("es");

        return accounts
            .filter((account) => {
                const matchesSearch = [
                    info?.title,
                    account.name,
                    account.type,
                    account.number,
                    account.description,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase("es")
                    .includes(normalizedSearch);

                const matchesType =
                    accountType === "Todas" || account.type === accountType;

                return matchesSearch && matchesType;
            })
            .sort((first, second) => {
                const comparison = first.name.localeCompare(
                    second.name,
                    "es",
                    { numeric: true }
                );

                return accountOrder === "A-Z"
                    ? comparison
                    : comparison * -1;
            });
    }, [accounts, accountSearch, accountType, accountOrder, info?.title]);

    const changeAccount = (direction) => {
        setActiveAccountIndex((currentIndex) => {
            const nextIndex = currentIndex + direction;

            if (nextIndex < 0) return accounts.length - 1;
            if (nextIndex >= accounts.length) return 0;

            return nextIndex;
        });

        setShowAccountNumber(false);
    };

    const handleAccountDetails = (account) => {
        const accountIndex = accounts.findIndex(
            (item) => item.id === account.id
        );

        if (accountIndex >= 0) {
            setActiveAccountIndex(accountIndex);
            setShowAccountNumber(false);
        }
    };

    const generalInformation = [
        { label: "Razón Social", value: "ACIERTO PUBLICIDAD" },
        { label: "Primer Nombre", value: "ACIERTO" },
        { label: "Segundo Nombre", value: "PUBLICIDAD" },
        { label: "Primer Apellido", value: "", placeholder: "Primer Apellido" },

        { label: "Segundo Apellido", value: "", placeholder: "Segundo Apellido" },
        {
            label: "Relación comercial",
            value: "client",
            options: [
                { value: "client", text: "client" },
                { value: "provider", text: "provider" },
            ],
        },
        {
            label: "Tipo de documento",
            value: "NIT",
            options: [
                { value: "NIT", text: "NIT" },
                { value: "CC", text: "CC" },
                { value: "CE", text: "CE" },
            ],
        },
        { label: "Número de documento", value: "830513602" },

        { label: "Dígito de verificación", value: "7" },
        {
            label: "Correo electrónico",
            value: "financiero@aciertopublicidad.com",
        },
        { label: "Número telefónico", value: "320 4664732" },
        {
            label: "País",
            value: "",
            placeholder: "País de origen de registro",
        },

        {
            label: "Ciudad",
            value: "",
            placeholder: "Ciudad o departamento",
        },
        {
            label: "Dirección",
            value: "",
            placeholder: "Cl - Cra...",
        },
    ];

    return (
        <section className="bankDetails">
            <button
                className="bankDetailsBreadcrumb"
                type="button"
                onClick={onBack}
            >
                <span>Bancos</span>
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                <strong>{info?.title ?? "Banco"}</strong>
            </button>

            <header className="bankDetailsAccountHeader">
                <button
                    className="bankDetailsCarouselButton"
                    type="button"
                    aria-label="Cuenta anterior"
                    onClick={() => changeAccount(-1)}
                    disabled={accounts.length < 2}
                >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>

                <div className="bankDetailsAccountSummary">
                    <span>{activeAccount?.name}</span>
                    <h1>{formatCurrency(activeAccount?.balance)}</h1>

                    <p>
                        {showAccountNumber
                            ? activeAccount?.fullNumber
                            : activeAccount?.number}
                        <button
                            type="button"
                            className="bankDetailsShowNumber"
                            aria-label={
                                showAccountNumber
                                    ? "Ocultar número de cuenta"
                                    : "Mostrar número de cuenta"
                            }
                            onClick={() =>
                                setShowAccountNumber((visible) => !visible)
                            }
                        >
                            <i
                                className={`fa-regular ${
                                    showAccountNumber ? "fa-eye-slash" : "fa-eye"
                                }`}
                                aria-hidden="true"
                            />
                        </button>
                    </p>

                    <div className="bankDetailsCarouselIndicators">
                        {accounts.map((account, index) => (
                            <button
                                key={account.id}
                                type="button"
                                aria-label={`Ver cuenta ${index + 1}`}
                                aria-current={index === safeAccountIndex}
                                onClick={() => {
                                    setActiveAccountIndex(index);
                                    setShowAccountNumber(false);
                                }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className="bankDetailsCarouselButton"
                    type="button"
                    aria-label="Cuenta siguiente"
                    onClick={() => changeAccount(1)}
                    disabled={accounts.length < 2}
                >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
            </header>

            <nav className="bankDetailsTabs" aria-label="Secciones del banco">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        className={activeTab === tab ? "active" : ""}
                        aria-current={activeTab === tab ? "page" : undefined}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {activeTab === "Movimientos" && (
                <section className="bankDetailsSection">
                    <div className="bankDetailsToolbar">
                        <SearchBar
                            placeholder="Buscar movimiento"
                            value={movementSearch}
                            action={setMovementSearch}
                        />

                        <div className="bankDetailsDateFilters">
                            <input
                                type="date"
                                aria-label="Fecha inicial"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                            />
                            <span>–</span>
                            <input
                                type="date"
                                aria-label="Fecha final"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                            />
                        </div>

                        <div className="bankDetailsToolbarActions">
                            <ButtonDownload
                                info={visibleMovements}
                                columns={downloadColumns}
                                title={`Movimientos_${info?.title ?? "Banco"}`}
                                text="Descargar movimientos"
                            />

                            <button
                                className="bankDetailsNewButton"
                                type="button"
                            >
                                Nuevo
                                <i
                                    className="fa-solid fa-plus"
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    </div>

                    <UniversalTable
                        columns={movementColumns}
                        results={visibleMovements}
                        searchValue={movementSearch}
                        getRowKey={(row) => row.id}
                        emptyMessage="No hay movimientos que coincidan con la búsqueda"
                    />
                </section>
            )}

            {activeTab === "Información general" && (
                <section className="bankDetailsSection bankDetailsGeneral">
                    {generalInformation.map((field) => (
                        <label className="bankDetailsField" key={field.label}>
                            <span>{field.label}</span>

                            {field.options ? (
                                <select value={field.value} disabled>
                                    {field.options.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.text}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={field.value}
                                    placeholder={field.placeholder ?? ""}
                                    readOnly
                                />
                            )}
                        </label>
                    ))}
                </section>
            )}

            {activeTab === "Cuentas Bancarias" && (
                <section className="bankDetailsSection">
                    <div className="bankDetailsAccountsToolbar">
                        <SearchBar
                            placeholder="Buscar cuenta bancaria"
                            value={accountSearch}
                            action={setAccountSearch}
                        />

                        <select
                            aria-label="Filtrar cuentas por tipo"
                            value={accountType}
                            onChange={(event) =>
                                setAccountType(event.target.value)
                            }
                        >
                            <option value="Todas">Todas las cuentas</option>
                            <option value="Cuenta corriente">Corriente</option>
                            <option value="Cuenta de ahorros">Ahorros</option>
                        </select>

                        <select
                            aria-label="Ordenar cuentas"
                            value={accountOrder}
                            onChange={(event) =>
                                setAccountOrder(event.target.value)
                            }
                        >
                            <option value="A-Z">Orden: A - Z</option>
                            <option value="Z-A">Orden: Z - A</option>
                        </select>

                        <button
                            className="bankDetailsNewButton"
                            type="button"
                        >
                            Nueva
                            <i
                                className="fa-solid fa-plus"
                                aria-hidden="true"
                            />
                        </button>
                    </div>

                    <div className="bankDetailsAccounts">
                        {visibleAccounts.length > 0 ? (
                            visibleAccounts.map((account) => (
                                <BankAccountCard
                                    key={account.id}
                                    account={account}
                                    bankName={info?.title}
                                    onDetails={() =>
                                        handleAccountDetails(account)
                                    }
                                />
                            ))
                        ) : (
                            <p className="bankDetailsNoAccounts">
                                No se encontraron cuentas bancarias.
                            </p>
                        )}
                    </div>
                </section>
            )}

            {![
                "Movimientos",
                "Información general",
                "Cuentas Bancarias",
            ].includes(activeTab) && (
                <section className="bankDetailsSection bankDetailsEmpty">
                    <i
                        className="fa-regular fa-folder-open"
                        aria-hidden="true"
                    />
                    <p>Esta sección estará disponible próximamente.</p>
                </section>
            )}
        </section>
    );
}

export function BankAccountCard({ account, bankName, onDetails }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [showBalance, setShowBalance] = useState(true);

    return (
        <article className="bankAccountCard">
            <div className="bankAccountCardHeading">
                <h3>{bankName ?? "Banco"}</h3>
                <span>{account.number}</span>
            </div>

            <p className="bankAccountCardDescription">
                {account.description ?? account.name}
            </p>

            <div className="bankAccountCardBalance">
                <strong>
                    {showBalance
                        ? formatCurrency(account.balance)
                        : "••••••••"}
                </strong>

                <button
                    type="button"
                    aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                    title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                    onClick={() => setShowBalance((visible) => !visible)}
                >
                    <i
                        className={`fa-regular ${
                            showBalance ? "fa-eye" : "fa-eye-slash"
                        }`}
                        aria-hidden="true"
                    />
                </button>
            </div>

            <div className="bankAccountCardActions">
                <button
                    className={`bankAccountFavorite ${
                        isFavorite ? "favorite" : ""
                    }`}
                    type="button"
                    aria-label={
                        isFavorite
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }
                    title={
                        isFavorite
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }
                    onClick={() => setIsFavorite((favorite) => !favorite)}
                >
                    <i
                        className={`fa-${isFavorite ? "solid" : "regular"} fa-heart`}
                        aria-hidden="true"
                    />
                </button>

                <button
                    className="bankAccountDetails"
                    type="button"
                    onClick={onDetails}
                >
                    Ver detalles
                </button>

                <div className="bankAccountOptions">
                    <MoreOptions
                        options={accountOptions}
                        children={<i className="fa-solid fa-gear" />}
                    />
                </div>
            </div>
        </article>
    );
}