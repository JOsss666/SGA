

CREATE DATABASE sga_process;

CREATE TABLE OPS(
    op_id SERIAL PRIMARY KEY,
    company_id  BIGINT UNSIGNED NOT NULL,
    store_id INT NOT NULL,
    user_id  BIGINT UNSIGNED NOT NULL,
    thirdParty_id INT,
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    budgetIncome FLOAT NOT NULL DEFAULT 0,
    budgetCost FLOAT NOT NULL DEFAULT 0,
    executedCost FLOAT NOT NULL DEFAULT 0,
    invoicedValue FLOAT NOT NULL DEFAULT 0,
    expiration_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id)
);

DELETE FROM OCS;

CREATE TABLE OCS(
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    user_id  BIGINT UNSIGNED NOT NULL,
    op_id INT NOT NULL,
    thirdParty_id BIGINT UNSIGNED NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    budgetIncome FLOAT NOT NULL DEFAULT 0,
    budgetCost FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thirdParty_id) REFERENCES sga_ecosystem.thirdParties(id),
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id)
);



INSERT INTO sga_process.OCS(user_id,op_id,thirdParty_id,description,budgetIncome,budgetCost)
VALUES(
    1,
    2,
    1,
    'Compra 100 hamburguesas',
    100000,
    20000
);

CREATE TABLE DCS(
    id SERIAL PRIMARY KEY,
    op_id INT NOT NULL,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    user_id  BIGINT UNSIGNED NOT NULL,
    thirdParty_id BIGINT UNSIGNED NOT NULL,
    description text,
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    value FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thirdParty_id) REFERENCES sga_ecosystem.thirdParties(id),
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id)

);

CREATE TABLE FVS(
    id SERIAL PRIMARY KEY,
    op_id INT NOT NULL,
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    user_id  BIGINT UNSIGNED NOT NULL,
    thirdParty_id BIGINT UNSIGNED NOT NULL,
    description text,
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    value FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thirdParty_id) REFERENCES sga_ecosystem.thirdParties(id),
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id)
);

SELECT * FROM sga_process.OCS;

CREATE TABLE CIS(
    id SERIAL PRIMARY KEY,
    op_id INT NOT NULL,
    user_id  BIGINT UNSIGNED NOT NULL,
    thirdParty_id BIGINT UNSIGNED NOT NULL,
    description text,
    status VARCHAR(100) NOT NULL DEFAULT 'active',
    company_id INT NOT NULL,
    store_id INT NOT NULL,
    cellar_id INT NOT NULL,
    movement_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thirdParty_id) REFERENCES sga_ecosystem.thirdParties(id),
    FOREIGN KEY (user_id) REFERENCES sga_ecosystem.users(user_id)
);

DROP TABLE OCS;
DROP TABLE DCS;
DROP TABLE FVS;
DROP TABLE CIS;

CREATE TABLE users_actions(
    id SERIAL PRIMARY KEY,
    user_id  BIGINT UNSIGNED NOT NULL,
    type VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT(NOW()),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


DELETE FROM OPS WHERE op_id !=