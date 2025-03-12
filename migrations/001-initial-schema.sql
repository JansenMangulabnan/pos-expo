CREATE TABLE Product (
    product_id INT INDENTITY(1,1) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    shop_id INT NOT NULL,
    edit_permision INT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES Shop(shop_id),
    FOREIGN KEY (edit_permision) REFERENCES User(user_permission)
);

CREATE TABLE Shop (
    shop_id INT PRIMARY KEY,
    shop_name VARCHAR(255) NOT NULL
);

CREATE TABLE User (
    user_id INT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL
    user_email VARCHAR(255) NOT NULL
    user_password VARCHAR(255) NOT NULL
    user_permission INT NOT NULL
);