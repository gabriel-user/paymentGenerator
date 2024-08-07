const express = require('express');
const multer = require('multer');
const path = require('path');
const csvProcessor = require('./csvProcessor');
const { validateCSV } = require('./validators');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Apenas arquivos CSV são permitidos'));
    }
    cb(null, true);
  }
});

app.use(express.static('public'));

app.post('/upload', upload.single('csvFile'), validateCSV, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const csvBuffer = req.file.buffer;
    const processedData = await csvProcessor.processCSVBuffer(csvBuffer);
    res.json(processedData);
  } catch (error) {
    console.error('Erro ao processar CSV:', error);
    res.status(500).send('Erro ao processar o arquivo CSV.');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});