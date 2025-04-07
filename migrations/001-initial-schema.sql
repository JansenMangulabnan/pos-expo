CREATE DATABASE PossieDB;

USE PossieDB;

CREATE TABLE Shop (
    shop_id INT IDENTITY(1,1) PRIMARY KEY,
    shop_name VARCHAR(255) NOT NULL
);

CREATE TABLE [User] (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_permission INT NOT NULL
);

CREATE TABLE [Product] (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    product_img VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description VARCHAR(MAX) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    shop_id INT NOT NULL,
    edit_permission INT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES Shop(shop_id)
);

INSERT INTO [User] (user_name, user_email, user_password, user_permission)
VALUES 
('User1', 'user1@example.com', 'pass', 1),
('User2', 'user2@example.com', 'pass', 2),
('User3', 'user3@example.com', 'pass', 3);

INSERT INTO Shop (shop_name) VALUES ('Shop 1'), ('Shop 2'), ('Shop 3');

INSERT INTO [Product] (product_img, product_name, product_description, product_price, shop_id, edit_permission)
VALUES 
('img1.jpg', 'Product 1', 'Description 1', 10.00, 1, 1),
('img2.jpg', 'Product 2', 'Description 2', 20.00, 2, 2),
('img3.jpg', 'Product 3', 'Description 3', 30.00, 3, 3);

SELECT * FROM [Product];