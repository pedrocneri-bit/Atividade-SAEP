CREATE DATABASE IF NOT EXISTS consultorio_odonto;
USE consultorio_odonto;

-- Tabela de Usuários (para autenticação)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Dentistas
CREATE TABLE dentistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cro VARCHAR(20) NOT NULL UNIQUE,
    especialidade VARCHAR(50) NOT NULL
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf_criptografado VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    dentista_id INT NOT NULL,
    FOREIGN KEY (dentista_id) REFERENCES dentistas(id) ON DELETE CASCADE
);

-- Tabela de Agendamentos
CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_hora DATETIME NOT NULL,
    cliente_id INT NOT NULL,
    dentista_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (dentista_id) REFERENCES dentistas(id) ON DELETE CASCADE
);

-- INSERÇÃO DE DADOS INICIAIS (3 registros por tabela)

INSERT INTO usuarios (nome, email, senha) VALUES 
('Administrador', 'admin@consultorio.com', '$2b$10$hashSeguroSenha1'),
('Recepcionista Ana', 'ana@consultorio.com', '$2b$10$hashSeguroSenha2'),
('Gestor Carlos', 'carlos@consultorio.com', '$2b$10$hashSeguroSenha3');

INSERT INTO dentistas (nome, cro, especialidade) VALUES 
('Dr. Roberto Silva', 'CRO-SP 12345', 'Ortodontia'),
('Dra. Maria Oliveira', 'CRO-SP 67890', 'Endodontia'),
('Dr. Lucas Santos', 'CRO-SP 54321', 'Pediatria');

-- CPFs simulados criptografados/hashed para a regra
INSERT INTO clientes (nome, cpf_criptografado, telefone, dentista_id) VALUES 
('João Pedro', 'e10adc3949ba59abbe56e057f20f883e', '(11) 98888-1111', 1),
('Beatriz Costa', 'c33367701511b4f6020ec61ded352059', '(11) 97777-2222', 2),
('Gabriel Souza', '1a1dc91c907325c69271ddf0c944bc72', '(11) 96666-3333', 1);

INSERT INTO agendamentos (data_hora, cliente_id, dentista_id) VALUES 
('2026-10-15 09:00:00', 1, 1),
('2026-10-15 10:30:00', 2, 2),
('2026-10-16 14:00:00', 3, 1);