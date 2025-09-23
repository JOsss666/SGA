

CREATE TABLE cellars(
	cellar_id INT NOT NULL UNIQUE auto_increment,
    cellar_name VARCHAR(200),
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    PRIMARY KEY(cellar_id)
);


CREATE TABLE cellarSections(
	section_id INT NOT NULL UNIQUE auto_increment,
    cellar_id INT NOT NULL,
    section_name VARCHAR(100),
    section_location VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW())
);

CREATE TABLE products(
    company_id INT NOT NULL,
	product_id INT NOT NULL UNIQUE auto_increment,
    product_code VARCHAR(300) NOT NULL,
    product_name VARCHAR(300),
    supplier_id INT NOT NULL,
    category_id INT,
    stock INT NOT NULL,
    units VARCHAR(100) NOT NULL,
    product_description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE companies;

ALTER TABLE sga_inventory.products
ADD CONSTRAINT fk_products_company
FOREIGN KEY (company_id)
REFERENCES sga_ecosystem.companies(company_id);

CREATE TABLE pricesList(
    list_id INT NOT NULL UNIQUE AUTO_INCREMENT,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_name VARCHAR(500) NOT NULL,
    list_state VARCHAR(200) NOT NULL,
    list_description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DELETE FROM pricesList;

ALTER TABLE pricesList
ADD CONSTRAINT fk_pricesList_stores
FOREIGN KEY (store_id)
REFERENCES stores(store_id);

DROP TABLE pricesList;

CREATE TABLE storesLists(
    id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    list_id INT,
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    FOREIGN KEY(store_id) REFERENCES stores(store_id),
    FOREIGN KEY(list_id) REFERENCES pricesList(list_id)
);

CREATE TABLE pricesProducts(
    price_id INT NOT NULL AUTO_INCREMENT,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_id INT,
    product_id INT NOT NULL,
    unit_value FLOAT NOT NULL DEFAULT 0,
    total_cost FLOAT NOT NULL DEFAULT 0,
    unit_cost FLOAT NOT NULL DEFAULT 0,
    price_state VARCHAR(100) DEFAULT "pendingOfPrice",
    min_stock INT NOT NULL DEFAULT 0,
    PRIMARY KEY(price_id),

    FOREIGN KEY(company_id) REFERENCES companies(company_id),
    FOREIGN KEY(store_id) REFERENCES stores(store_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id)
);

DROP TABLE pricesProducts;

SELECT * FROM pricesProducts;

CREATE TABLE stocks(
    stock_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    list_id INT,
    product_id INT NOT NULL,
    cellar_id INT NOT NULL,
    section_id INT,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(company_id),
    FOREIGN KEY(store_id) REFERENCES stores(store_id),
    FOREIGN KEY(cellar_id) REFERENCES cellars(cellar_id)
);

DROP TABLE stocks;

UPDATE stocks set stock = 0;


CREATE TABLE categories(
	category_id INT NOT NULL UNIQUE auto_increment,
    category_code VARCHAR(2000),
    category_name VARCHAR(200),
    company_id INT NOT NULL,
    category_description VARCHAR(1000),
    category_color VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE categories;

CREATE TABLE departures(
	departure_id INT NOT NULL UNIQUE auto_increment,
    company_id INT NOT NULL,
    store_id INT NOT NULL DEFAULT 0,
    cellar_id INT NOT NULL DEFAULT 0,
    section_id INT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    client_id INT NOT NULL,
    departure_units FLOAT NOT NULL,
    departure_value FLOAT NOT NULL,
    departure_status VARCHAR(100) DEFAULT "Pendiente",
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE departures MODIFY COLUMN departure_type VARCHAR(200) NOT NULL DEFAULT 'sell';


UPDATE departures SET departure_type = 'sell';

CREATE TABLE entries(
	entry_id INT NOT NULL UNIQUE auto_increment,
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
    entry_status VARCHAR(100) DEFAULT "Pendiente",
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE entries;

CREATE TABLE inventoryMovements (
    movement_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_id INT NOT NULL,
    movement_date VARCHAR(100) NOT NULL,
    document_number VARCHAR(200) NOT NULL,	
    movement_type VARCHAR(100),
    movement_value FLOAT NOT NULL,
    movement_transactions VARCHAR(2000) NOT NULL,
    movement_state VARCHAR(200) DEFAULT 'Pendiente',
    movement_description VARCHAR(10000),
    attach_id VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (cellar_id) REFERENCES cellars(cellar_id)
);


DROP TABLE inventoryMovements;

SELECT * FROM departures;


INSERT INTO companies (company_name,company_location,company_NIT,company_mail) VALUES (
	"SGA-TEST",
    "Bogotá",
    10345171796,
    "murillojose.nvc@gmail.com"
);

INSERT INTO categories(category_name,company_id,category_description) VALUES (
    "Electrodomesticos",
    1,
    "Todo producto para el hogar con componentes electronicos"
);

INSERT INTO subCategories(category_id,father_id,subCategory_name,subCategory_description) VALUES (
    1,
    0,
    "Neveras",
    "Neveras de 2 a 3 metros cubicos"
);


DROP TABLE products;


INSERT INTO products (
    company_id,
    father_id,
    product_code,
    product_name,
    supplier_id,
    category_id,
    subCategory_id,
    stock,
    units,
    product_description
) VALUES(
    1,
    1,
    "11134",
    "Producto 1",
    1,
    1,
    15,
    0,
    "500 g",
    "Descripción del producto 1"
);

DELETE FROM pricesProducts;

SELECT * FROM departures WHERE product_id = 2;

SELECT SUM(departure_units) FROM departures WHERE DATE(created_at) BETWEEN '2025-04-30' AND '2025-08-06' AND product_id = 2;

SELECT SUM(units) FROM entries WHERE DATE(created_at) BETWEEN '2025-07-30' AND '2025-08-05' AND product_id = 2;

SELECT *  FROM departures WHERE product_id = 2 AND DATE(created_at) BETWEEN '2025-08-06' AND '2025-08-07';

SELECT SUM(stock) FROM stocks WHERE product_id = 2 AND DATE(created_at) BETWEEN '2025-07-30' AND '2025-08-05' AND product_id = 2;


CREATE DATABASE sga_ecosystem;