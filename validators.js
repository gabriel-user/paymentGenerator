function validateCSV(req, res, next) {
  // Implemente a validação do CSV aqui
  // Por exemplo, verificar se todas as colunas necessárias estão presentes
  next();
}

module.exports = { validateCSV };