import express from 'express';
import sequelize from './database/db.js';
import Livro from './models/Livro.js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import Usuario from './models/Usuario.js';
import jwt from 'jsonwebtoken';
import auth from './middlewares/auth.js';

//aprendendo a usar o express, criei um servidor básico.
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;


app.use(express.static('Front/src'));

sequelize.sync()
  .then(() => {
    console.log('Tabelas criadas/sincronizadas');
  })
  .catch(err => {
    console.error(err);
  });
  
// Rota de teste para verificar se o servidor está funcionando
app.get('/users', (req, res) => {

    res.json('oK, DEU CERTO');

});

//Rota para cadastro
app.post('/register', async (req, res) => {
  try {

    const { nome, email, senha } = req.body;

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash
    });

    res.status(201).json(usuario);

  } catch (erro) {

    console.log("ERRO COMPLETO:");
    console.log(erro);

    res.status(500).json({
      erro: erro.message,
      detalhe: erro.original?.sqlMessage
    });

  }
});

//Rota para login

app.post('/login', async (req, res) => {

  const { email, senha } = req.body;

  const usuario = await Usuario.findOne({
    where: { email }
  });

  if (!usuario) {
    return res.status(401).json({
      erro: 'Usuário não encontrado'
    });
  }

  const senhaValida = await bcrypt.compare(
    senha,
    usuario.senha
  );

  if (!senhaValida) {
    return res.status(401).json({
      erro: 'Senha inválida'
    });
  }

  const token = jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});




// Rotas para CRUD de livros

app.get('/livros', auth, async (req, res) => {

  try {

    const { categoria } = req.query;

    let livros;

    if (categoria) {
      livros = await Livro.findAll({
        where: { categoria }
      });
    } else {
      livros = await Livro.findAll();
    }

    res.json(livros);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar livros' });
  }

});


// Rota para buscar um livro por id
app.get('/livros/:id', auth, async (req, res) => {
  try {

    const livro = await Livro.findByPk(req.params.id);

    if (!livro) {
      return res.status(404).json({
        erro: 'Livro não encontrado'
      });
    }

    res.json(livro);

  } catch (erro) {

    res.status(500).json({
      erro: erro.message
    });

  }
});

// Rota para criar um novo livro
app.post('/livros', auth, async (req, res) => {
  try {

    const {
      titulo,
      ano_publicacao,
      quantidade,
      autor_id,
      capa,
      categoria} = req.body;

    if (!titulo) {
      return res.status(400).json({
        erro: 'Título é obrigatório'
      });
    }

    const livro = await Livro.create({
     titulo,
     ano_publicacao,
     quantidade,
     autor_id,
     capa,
     categoria
    });

    res.status(201).json(livro);

  } catch (erro) {

    res.status(500).json({
      erro: erro.message
    });

  }
});


// Rota para atualizar um livro existente
app.put('/livros/:id', auth, async (req, res) => {
  try {

    const livro = await Livro.findByPk(req.params.id);

    if (!livro) {
      return res.status(404).json({
        erro: 'Livro não encontrado'
      });
    }

    await livro.update(req.body);

    res.json(livro);

  } catch (erro) {

    res.status(500).json({
      erro: erro.message
    });

  }
});

// Rota para deletar um livro
app.delete('/livros/:id', auth, async (req, res) => {
  try {

    const livro = await Livro.findByPk(req.params.id);

    if (!livro) {
      return res.status(404).json({
        erro: 'Livro não encontrado'
      });
    }

    await livro.destroy();

    res.json({
      mensagem: 'Livro removido com sucesso'
    });

  } catch (erro) {

    res.status(500).json({
      erro: erro.message
    });

  }
});

sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao MySQL!');
  })
  .catch((erro) => {
    console.error('Erro ao conectar:', erro);
  });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on ${PORT}`);
});
