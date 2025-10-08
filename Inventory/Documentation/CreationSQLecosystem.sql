
CREATE DATABASE IF NOT EXISTS sga_ecosystem;
USE sga_ecosystem;

CREATE TABLE users(
    company_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(200) NOT NULL,
    user_mail VARCHAR(300) NOT NULL UNIQUE,
    user_password VARCHAR(100) NOT NULL,
    user_key VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE users_access(
    user_id BIGINT UNSIGNED NOT NULL,
    user_roll VARCHAR(200) NOT NULL DEFAULT 'operator',
    sga_inventory_access TEXT,
    sga_process_access TEXT,
    sga_contability_access TEXT,
    sga_certicloud_access TEXT,
    sga_facturation_access TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE companies(
    company_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    indentification_type ENUM('CC','NIT','CE','PAS'),
    indentification_number VARCHAR(100) NOT NULL UNIQUE,
    company_mail VARCHAR(100) NOT NULL,
    company_key VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE stores(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100),
    zone VARCHAR(100),
    city VARCHAR(100),
    location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE thirdParties(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    names VARCHAR(200) NOT NULL,
    lastNames VARCHAR(200) NOT NULL,
    indentification_type ENUM('CC','NIT','CE','PAS'),
    indentification_number VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(300) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(300),
    type ENUM('client','supplier','employee','contractor','partner','other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE payment_methods(
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(400) NOT NULL,
    type ENUM('cash','bank_transfer','debit_card','credit_card','digital_wallet','check','cash_onDelivery','crypto_currency'),
    state ENUM('active','suspended','blocked','disabled') DEFAULT 'active',
    currency VARCHAR(100),
    variable BOOLEAN DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE taxes(
    company_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100),
    rate FLOAT NOT NULL DEFAULT 0,
    base FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE concepts(
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(100) DEFAULT 'active',
    payment_method BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (payment_method) REFERENCES payment_methods(id)
);


CREATE TABLE concept_taxes(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    concept_id BIGINT UNSIGNED NOT NULL,
    tax_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE CASCADE,
    UNIQUE (concept_id, tax_id)
);


CREATE TABLE transactions(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (concept_id) REFERENCES concepts(id)
);


CREATE TABLE transaction_detail(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    account_type ENUM('PUC','Personalized'),
    type ENUM('tax','withholding','discount','operation'),
    subtotal FLOAT NOT NULL,
    total FLOAT NOT NULL,
    status ENUM('draft','posted','cancelled','pendingPayment') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE TABLE account_templates_puc (
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    type ENUM('DB','CR') NOT NULL,
    account_path VARCHAR(300) NOT NULL,
    active TINYINT(1) DEFAULT '1',
    UNIQUE KEY (id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE acount_plans (
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('PUC','Personalized') DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (id),
    KEY company_id (company_id),
    CONSTRAINT acount_plans_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE contable_accounts (
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    type ENUM('DB','CR') NOT NULL,
    account_path VARCHAR(300) NOT NULL,
    active TINYINT(1) DEFAULT '1',
    UNIQUE KEY (id),
    KEY company_id (company_id),
    CONSTRAINT contable_accounts_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE puc (
    company_id BIGINT UNSIGNED NOT NULL,
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    type ENUM('D','C') NOT NULL,
    acount_path VARCHAR(300) NOT NULL,
    active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY id (id),
    KEY company_id (company_id),
    CONSTRAINT puc_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(company_id)
);


CREATE TABLE services (
    company_id BIGINT UNSIGNED NOT NULL,
    sga_inventory VARCHAR(100) DEFAULT 'none',
    sga_process VARCHAR(100) DEFAULT 'none',
    sga_certicloud VARCHAR(100) DEFAULT 'none',
    sga_contability VARCHAR(100) DEFAULT 'none',
    sga_facturation VARCHAR(100) DEFAULT 'none',
    state VARCHAR(100) DEFAULT 'active',
    start_date DATE DEFAULT NULL,
    expiration_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY company_id (company_id),
    CONSTRAINT services_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(company_id)
);
