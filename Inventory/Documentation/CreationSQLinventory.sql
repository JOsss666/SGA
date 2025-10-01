
CREATE DATABASE IF NOT EXISTS sga_inventory;
USE sga_inventory;


CREATE TABLE users(
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(200) NOT NULL,
    user_mail VARCHAR(300) NOT NULL UNIQUE,
    user_pass VARCHAR(200) NOT NULL,
    company_id INT NOT NULL,
    user_session VARCHAR(200),
    user_role VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);


CREATE TABLE suppliers(
    supplier_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_mail VARCHAR(200) NOT NULL,
    supplier_nit BIGINT NOT NULL UNIQUE,
    supplier_phone VARCHAR(100),
    supplier_location VARCHAR(200),
    supplier_tags VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);


CREATE TABLE clients(
    client_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_nit VARCHAR(100) NOT NULL,
    client_mail VARCHAR(200),
    client_phone VARCHAR(100),
    client_location VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);


CREATE TABLE stores(
    store_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_name VARCHAR(100),
    store_zone VARCHAR(100),
    store_city VARCHAR(100),
    store_location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);


CREATE TABLE cellars(
    cellar_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cellar_name VARCHAR(200),
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);


CREATE TABLE cellarSections(
    section_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cellar_id INT NOT NULL,
    section_name VARCHAR(100),
    section_location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id)
);


CREATE TABLE categories(
    category_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(200),
    category_name VARCHAR(200) NOT NULL,
    company_id INT NOT NULL,
    category_description VARCHAR(1000),
    category_color VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id)
);


CREATE TABLE subCategories(
    subCategory_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    father_id INT DEFAULT 0,
    subCategory_name VARCHAR(200),
    subCategory_description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);


CREATE TABLE products(
    product_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    product_code VARCHAR(300) NOT NULL,
    product_name VARCHAR(300),
    supplier_id INT NOT NULL,
    category_id INT,
    subCategory_id INT,
    stock INT NOT NULL DEFAULT 0,
    units VARCHAR(100) NOT NULL,
    product_description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (subCategory_id) REFERENCES subCategories(subCategory_id)
);


CREATE TABLE pricesList(
    list_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_name VARCHAR(500) NOT NULL,
    list_state VARCHAR(200) NOT NULL,
    list_description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);


CREATE TABLE storesLists(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    list_id INT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (list_id) REFERENCES pricesList(list_id)
);


CREATE TABLE pricesProducts(
    price_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_id INT,
    product_id INT NOT NULL,
    unit_value FLOAT NOT NULL DEFAULT 0,
    total_cost FLOAT NOT NULL DEFAULT 0,
    unit_cost FLOAT NOT NULL DEFAULT 0,
    price_state VARCHAR(100) DEFAULT 'pendingOfPrice',
    min_stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (list_id) REFERENCES pricesList(list_id)
);


CREATE TABLE stocks(
    stock_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_id INT,
    product_id INT NOT NULL,
    cellar_id INT NOT NULL,
    section_id INT,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (section_id) REFERENCES cellarSections(section_id)
);


CREATE TABLE departures(
    departure_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_id INT NOT NULL,
    section_id INT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    client_id INT NOT NULL,
    departure_units FLOAT NOT NULL,
    departure_value FLOAT NOT NULL,
    departure_status VARCHAR(100) DEFAULT 'Pendiente',
    departure_type VARCHAR(200) NOT NULL DEFAULT 'sell',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);


CREATE TABLE entries(
    entry_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_id INT NOT NULL,
    section_id INT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    units FLOAT NOT NULL,
    entry_value FLOAT NOT NULL,
    unit_value FLOAT NOT NULL DEFAULT 0,
    entry_status VARCHAR(100) DEFAULT 'Pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);


CREATE TABLE inventoryMovements (
    movement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_id INT NOT NULL,
    movement_date DATE NOT NULL,
    document_number VARCHAR(200) NOT NULL,	
    movement_type VARCHAR(100),
    movement_value FLOAT NOT NULL,
    movement_transactions VARCHAR(2000) NOT NULL,
    movement_state VARCHAR(200) DEFAULT 'Pendiente',
    movement_description VARCHAR(10000),
    attach_id VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES sga_ecosystem.companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
