-- Cuentas por pagar a proveedores (contraparte de "Treasury".accounts_receivable),
-- soporte para purchaseService (api/services/purchaseService.js).

CREATE TABLE "Treasury".accounts_payable(
    company_id bigint NOT NULL,
    "thirdParty_id" bigint NOT NULL,
    document_id bigint NOT NULL,
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total numeric(18,6) NOT NULL DEFAULT 0,
    paid_amount numeric(18,6) NOT NULL DEFAULT 0,
    pending_amount numeric(18,6) GENERATED ALWAYS AS ((total - paid_amount)) STORED,
    due_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_id FOREIGN KEY (company_id) REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    CONSTRAINT document_id FOREIGN KEY (document_id) REFERENCES "Ecosystem".documents(id),
    CONSTRAINT "thirdParty_id" FOREIGN KEY ("thirdParty_id") REFERENCES "Ecosystem".thirdparties(id)
);

CREATE MATERIALIZED VIEW "Treasury".mv_thirdparty_payable_balances AS
SELECT
    "thirdParty_id",
    company_id,
    sum(total) AS total_debt,
    sum(paid_amount) AS total_paid,
    sum(pending_amount) AS balance,
    sum(CASE WHEN due_date >= CURRENT_TIMESTAMP THEN pending_amount ELSE 0::numeric END) AS current_balance,
    sum(CASE WHEN due_date < CURRENT_TIMESTAMP THEN pending_amount ELSE 0::numeric END) AS overdue_balance,
    count(id) AS open_invoices_count,
    max(updated_at) AS last_update
FROM "Treasury".accounts_payable
GROUP BY "thirdParty_id", company_id;

CREATE UNIQUE INDEX idx_mv_thirdparty_payable_unique ON "Treasury".mv_thirdparty_payable_balances USING btree ("thirdParty_id", company_id);
