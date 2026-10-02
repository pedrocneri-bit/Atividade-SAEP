const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração da conexão com o banco PostgreSQL no pgAdmin
const pool = new Pool({
    user: 'postgres',          // Usuário padrão
    host: 'localhost',
    database: 'consultorio_odonto', // Nome do banco de dados
    password: 'postgres',      // Sua senha do pgAdmin
    port: 5432,
});

// Chave para Criptografia do CPF (AES-256)
const SECRET_KEY = crypto.scryptSync('chave_secreta_saep', 'salt', 32);

function criptografarCPF(cpf) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
    let encrypted = cipher.update(cpf, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

// ----------------------------------------------------
// ROTAS E ENDPOINTS DA APLICAÇÃO
// ----------------------------------------------------

// 1. POST /login - Autenticação
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const query = 'SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha = $2';
        const { rows } = await pool.query(query, [email, senha]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
        }
        return res.json({ message: 'Login realizado com sucesso', usuario: rows[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno no servidor ao realizar login' });
    }
});

// 2. POST /logout - Encerramento de sessão
app.post('/logout', (req, res) => {
    return res.json({ message: 'Sessão encerrada com sucesso.' });
});

// 3. POST /dentistas - Cadastro de Dentista
app.post('/dentistas', async (req, res) => {
    const { nome, cro, especialidade } = req.body;
    try {
        const query = 'INSERT INTO dentistas (nome, cro, especialidade) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await pool.query(query, [nome, cro, especialidade]);
        return res.status(201).json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar dentista.' });
    }
});

// 4. GET /dentistas - Consulta com busca por termo
app.get('/dentistas', async (req, res) => {
    const { termo } = req.query;
    try {
        let query = 'SELECT * FROM dentistas';
        let params = [];

        if (termo) {
            query += ' WHERE nome ILIKE $1 OR cro ILIKE $1 OR especialidade ILIKE $1';
            params = [`%${termo}%`];
        }

        const { rows } = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar dentistas.' });
    }
});

// 5. POST /clientes - Cadastro de Cliente (Vínculo obrigatório e CPF Criptografado)
app.post('/clientes', async (req, res) => {
    const { nome, cpf, telefone, dentista_id } = req.body;

    if (!dentista_id) {
        return res.status(400).json({ error: 'A associação a um dentista é obrigatória.' });
    }

    try {
        const cpfCriptografado = criptografarCPF(cpf);
        const query = `
            INSERT INTO clientes (nome, cpf_criptografado, telefone, dentista_id) 
            VALUES ($1, $2, $3, $4) RETURNING id, nome, telefone, dentista_id
        `;
        const { rows } = await pool.query(query, [nome, cpfCriptografado, telefone, dentista_id]);
        return res.status(201).json({ message: 'Cliente cadastrado com sucesso!', cliente: rows[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
    }
});

// 6. GET /clientes - Listagem de Clientes
app.get('/clientes', async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.nome, c.telefone, d.nome AS dentista_responsavel 
            FROM clientes c
            JOIN dentistas d ON c.dentista_id = d.id
        `;
        const { rows } = await pool.query(query);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});

// 7. POST /agendamentos - Novo Agendamento
app.post('/agendamentos', async (req, res) => {
    const { data_hora, cliente_id, dentista_id } = req.body;
    try {
        const query = `
            INSERT INTO agendamentos (data_hora, cliente_id, dentista_id) 
            VALUES ($1, $2, $3) RETURNING *
        `;
        const { rows } = await pool.query(query, [data_hora, cliente_id, dentista_id]);
        return res.status(201).json({ message: 'Agendamento cadastrado!', agendamento: rows[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao realizar agendamento.' });
    }
});

// 8. GET /agendamentos - Consulta ordenada por data trazendo dados completos
app.get('/agendamentos', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id,
                a.data_hora,
                c.id AS cliente_id, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
                d.id AS dentista_id, d.nome AS dentista_nome, d.cro, d.especialidade
            FROM agendamentos a
            JOIN clientes c ON a.cliente_id = c.id
            JOIN dentistas d ON a.dentista_id = d.id
            ORDER BY a.data_hora ASC
        `;
        const { rows } = await pool.query(query);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
});

// Inicialização
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});