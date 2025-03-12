CREATE TABLE Product (
    product_id INT INDENTITY(1,1) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    shop_id INT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES Shop(shop_id)
);

CREATE TABLE Shop (
    shop_id INT PRIMARY KEY,
    shop_name VARCHAR(255) NOT NULL
);