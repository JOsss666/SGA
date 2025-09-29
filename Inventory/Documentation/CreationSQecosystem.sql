

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(200) NOT NULL,
    user_mail VARCHAR(300) NOT NULL UNIQUE,
    user_password VARCHAR(100) NOT NULL,
    user_key VARCHAR(100) NOT NULL UNIQUE DEFAULT('-'),
    status VARCHAR(100) NOT NULL DEFAULT 'active',
	created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users(user_name,user_mail,user_password) VALUES(
    'José Murillo',
    'murillojose.nvc@gmail.com',
    '123'
);

CREATE TABLE users_access(
    user_id  BIGINT UNSIGNED NOT NULL,
    user_roll VARCHAR(200) NOT NULL DEFAULT 'operator',
    sga_inventory_access TEXT,
    sga_process_access TEXT,
    sga_contability_access TEXT,
    sga_certicloud_access TEXT,
    sga_facturation_access TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO users_access(user_id,user_roll) VALUES (1,'Administrador');

CREATE TABLE companies(
	company_id SERIAL PRIMARY KEY,
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    indentification_type ENUM('CC', 'NIT', 'CE','PAS'),
    indentification_number VARCHAR(100) NOT NULL UNIQUE,
    company_mail VARCHAR(100) NOT NULL,
    company_key VARCHAR(100) NOT NULL UNIQUE DEFAULT('-'),
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sga_ecosystem.stores(
	id SERIAL PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100),
    zone VARCHAR(100),
    city VARCHAR(100),
    location VARCHAR(200),
	created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);

ALTER TABLE companies DROP COLUMN email;

CREATE TABLE thirdParties(
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    names VARCHAR(200) NOT NULL,
    lastNames VARCHAR(200) NOT NULL,
    indentification_type ENUM('CC', 'NIT', 'CE','PAS'),
    indentification_number VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(300) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(300),
    type ENUM('client', 'supplier', 'employee', 'contractor', 'partner', 'other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO sga_ecosystem.thirdParties(company_id,names,lastNames,indentification_type,indentification_number,email,phone,country,city,address,type)
VALUES(
    1,
    'Proveedor de prueba',
    'prueba no 1 proveedores',
    'CC',
    1034517196,
    'murillojose.nvc@gmail.com',
    '3026034563',
    'Colombia',
    'Bogotá',
    'Cll 147c 101 -53',
    'supplier'
);

CREATE TABLE sga_ecosystem.services(
    company_id BIGINT UNSIGNED NOT NULL,
    sga_inventory VARCHAR(100) DEFAULT 'none',
    sga_process VARCHAR(100) DEFAULT 'none',
    sga_certicloud VARCHAR(100) DEFAULT 'none',
    sga_contability VARCHAR(100) DEFAULT 'none',
    sga_facturation VARCHAR(100) DEFAULT 'none',
    state VARCHAR(100) DEFAULT 'active',
    start_date DATE,
    expiration_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);  

DROP TABLE sga_ecosystem.services;


INSERT INTO companies(
    legal_name,indentification_type,indentification_number,
    company_mail,phone,country,city,address
) VALUES (
    "SGA-TEST COMPANY S.A",
    "NIT",
    "1034517196",
    "murillojose.nvc@gmail.com",
    "3026034563",
    "Colombia",
    "Bogotá",
    "Cll 147c 101-53"
);

CREATE TABLE sga_ecosystem.acount_plans(
    company_id BIGINT UNSIGNED NOT NULL,
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('PUC','Personalized'),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

SELECT * FROM sga_ecosystem.acount_plans;

DROP TABLE sga_ecosystem.acount_plans;

CREATE TABLE sga_ecosystem.account_templates_PUC (
    company_id INT NOT NULL DEFAULT 0,
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    type ENUM('DB','CR') NOT NULL,
    account_path VARCHAR(300) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO
    sga_ecosystem.account_templates_PUC(company_id,code,name,level,type,account_path)
VALUES(
    1,
    '23651501',
    'RTE RENTA HONORARIOS - 3,5%',
    8,
    'DB',
    '23651501'
);

SELECT
    id,
    code
FROM
    sga_ecosystem.account_templates_PUC;

SELECT COUNT(*)
FROM sga_ecosystem.account_templates_PUC;

SELECT *
FROM sga_ecosystem.account_templates_PUC
WHERE code = '14'
ORDER BY account_path ASC;   -- ¡sin CAST!


SELECT *
FROM sga_ecosystem.account_templates_PUC
ORDER BY CAST(code AS UNSIGNED);

DROP TABLE sga_ecosystem.account_templates_PUC;

CREATE TABLE sga_ecosystem.contable_accounts(
    company_id BIGINT UNSIGNED NOT NULL,
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,         
    name VARCHAR(255) NOT NULL,        
    level INT NOT NULL,                  
    type ENUM('DB','CR') NOT NULL,
    account_path VARCHAR(300) NOT NULL,   
    active BOOLEAN DEFAULT TRUE,         
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

DELETE
FROM sga_ecosystem.contable_accounts;

SELECT COUNT(*) AS total_filas
FROM sga_ecosystem.account_templates_PUC;



SELECT * FROM (
    SELECT 
        id,code,name,level,account_path
    FROM sga_ecosystem.account_templates_PUC

    UNION ALL

    SELECT 
        id,code,name,level,account_path
    FROM sga_ecosystem.contable_accounts
) AS results ORDER BY account_path ASC;    


INSERT INTO sga_ecosystem.contable_accounts(
    company_id,
    code,
    name,
    level,
    type,
    account_path
) VALUES(
    1,
    '11050501',
    'DOLARES',
    8,
    'DB',
    '11050501'
);

DROP TABLE sga_ecosystem.contable_accounts;

INSERT INTO services(company_id) VALUES (1);


CREATE TABLE sga_ecosystem.concepts(
    company_id INT NOT NULL,
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    account_id INT NOT NULL,
    status VARCHAR(100) DEFAULT 'active',
    payment_method INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


SELECT * FROM sga_ecosystem.concepts;
SELECT id,name FROM sga_ecosystem.account_templates_PUC;


CREATE TABLE sga_ecosystem.taxes(
    company_id INT NOT NULL,
    account_id INT NOT NULL,
    id SERIAL PRIMARY KEY,
    code VARCHAR(100),
    rate FLOAT NOT NULL DEFAULT 0,
    base FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DELETE  FROM sga_ecosystem.concepts;

SELECT * FROM sga_ecosystem.taxes;

CREATE TABLE sga_ecosystem.concept_taxes(
    id SERIAL PRIMARY KEY,
    concept_id BIGINT UNSIGNED NOT NULL,
    tax_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (concept_id) REFERENCES sga_ecosystem.concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_id) REFERENCES sga_ecosystem.taxes(id) ON DELETE CASCADE,
    UNIQUE (concept_id, tax_id)
);


CREATE TABLE sga_ecosystem.payment_methods(
    company_id INT NOT NULL,
    id SERIAL PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(400) NOT NULL,
    type ENUM ('cash','bank_transfer','debit_card','credit_card','digital_wallet','check','cash_onDelivery','crypto_currency'),
    state ENUM ('active','suspended','blocked','disabled') DEFAULT 'active',
    currency VARCHAR(100),
    variable BOOLEAN DEFAULT 0
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE sga_ecosystem.payment_methods ADD COLUMN variable BOOLEAN DEFAULT 0;



INSERT INTO sga_ecosystem.payment_methods(
    company_id,
    code,
    name,
    type,
    currency
)VALUES(
    1,
    '04 - Pagos Internacionales',
    'Wire - Transfer',
    'credit_card',
    'USD'
);

SELECT * FROM sga_ecosystem.payment_methods;


DROP TABLE sga_ecosystem.taxes;

DELETE FROM sga_ecosystem.taxes;

INSERT INTO sga_ecosystem.taxes(company_id,name,code,rate,account_id) VALUES(
    1,
    'RTE RENTA - ART 383 - HONORARIOS',
    'A1',
    19,
    236601
);

CREATE TABLE sga_ecosystem.transactions(
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    concept_id BIGINT UNSIGNED NOT NULL,
    doc_date DATE NOT NULL,
    doc_type ENUM('DC','FV','FE','OC','NC','ND'),
    doc_id INT NOT NULL,
    subtotal FLOAT NOT NULL,
    total FLOAT NOT NULL,
    status ENUM('draft','posted','cancelled','pendingPayment') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id),
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES sga_ecosystem.stores(id),
    FOREIGN KEY (concept_id) REFERENCES sga_ecosystem.concepts(id)
)

SELECT * FROM sga_ecosystem.transactions;


CREATE TABLE sga_ecosystem.transaction_detail(
    id SERIAL PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    account_id INT NOT NULL,
    account_type ENUM('PUC','Personalized'),
    type ENUM('tax','withholding','discount','operation'),
    subtotal FLOAT NOT NULL,
    total FLOAT NOT NULL,
    status ENUM('draft','posted','cancelled','pendingPayment') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES sga_ecosystem.transactions(id) ON DELETE CASCADE
)

SELECT * FROM sga_ecosystem.transaction_detail;