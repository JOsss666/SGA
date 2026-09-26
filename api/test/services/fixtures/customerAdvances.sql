-- Minimal, isolated PostgreSQL fixture. Never execute against the SGA database.
CREATE SCHEMA "Ecosystem";
CREATE SCHEMA "Treasury";
CREATE SCHEMA "Facturation";
CREATE TABLE public.schema_migrations(filename text PRIMARY KEY);
CREATE TABLE "Ecosystem".companies(company_id bigint PRIMARY KEY);
CREATE TABLE "Ecosystem".thirdparties(id bigint PRIMARY KEY, company_id bigint NOT NULL);
CREATE TABLE "Ecosystem".company_settings(company_id bigint, time_zone text);
CREATE TABLE "Ecosystem".contable_accounts(id bigint PRIMARY KEY);
CREATE TABLE "Ecosystem".concepts(id bigint PRIMARY KEY, company_id bigint, account_id bigint,
    status text DEFAULT 'active', for_balance boolean DEFAULT false, for_wallet boolean DEFAULT false, "for_cashExit" boolean DEFAULT false);
CREATE TABLE "Ecosystem".payment_methods(id bigint PRIMARY KEY, company_id bigint, account_id bigint,
    status text DEFAULT 'active', for_balance boolean DEFAULT false, for_wallet boolean DEFAULT false, currency text DEFAULT 'COP');
CREATE TABLE "Ecosystem".documents(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id bigint, store_id bigint,
    "thirdParty_id" bigint, document_type text, status text DEFAULT 'active', "subTotal" numeric(18,6), total numeric(18,6),
    paid_amount numeric(18,6) DEFAULT 0, created_by bigint, description text, attached jsonb, instance_id bigint, step_instance bigint,
    "ownSerial" bigint GENERATED ALWAYS AS IDENTITY, "specialConfig" jsonb);
CREATE TABLE "Ecosystem".transactions(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id bigint, "thirdParty_id" bigint,
    company_id bigint, store_id bigint, concept_id bigint, doc_date date, doc_type text, doc_id bigint, "subTotal" numeric,
    total numeric, "costCenter_id" bigint, bussines_id bigint);
CREATE TABLE "Ecosystem".transaction_detail(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id bigint,
    transaction_id bigint, "thirdParty_id" bigint, account_id bigint, type text, "subTotal" numeric, total numeric,
    nature text, "paymentMethod_id" bigint, voucher text, status text);
CREATE TABLE "Facturation".shift_settlement_details(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id bigint,
    user_id bigint, "cashBox_id" bigint, "transactionDetail_id" bigint, shift_id bigint);
CREATE TABLE "Treasury".accounts_receivable(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id bigint,
    "thirdParty_id" bigint, document_id bigint, total numeric, paid_amount numeric DEFAULT 0, due_date timestamptz);
CREATE TABLE "Treasury".portfolio_payments(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id bigint,
    store_id bigint, "thirdParty_id" bigint, document_id bigint, instance_id bigint, paid_value numeric, "creationDocument_id" bigint);
INSERT INTO "Ecosystem".companies VALUES (1),(2);
INSERT INTO "Ecosystem".thirdparties SELECT id, CASE WHEN id=99 THEN 2 ELSE 1 END FROM generate_series(1,99) id;
INSERT INTO "Ecosystem".company_settings VALUES (1,'America/Bogota'),(2,'America/New_York');
INSERT INTO "Ecosystem".contable_accounts VALUES (10),(20),(30),(40);
INSERT INTO "Ecosystem".concepts(id,company_id,account_id,for_balance,for_wallet) VALUES (1,1,20,true,false),(2,1,30,false,true),(3,1,40,false,false);
INSERT INTO "Ecosystem".payment_methods(id,company_id,account_id,for_balance,for_wallet,currency)
VALUES (1,1,10,false,false,'COP'),(2,1,20,true,false,'COP'),(3,1,30,false,true,'COP'),(4,1,20,true,false,'USD'),(5,1,40,true,false,'COP');
