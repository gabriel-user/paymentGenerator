const csv = require('csv-parser');
const { Readable } = require('stream');

function processCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());

    readableStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const processedData = processCSV(results);
        resolve(processedData);
      })
      .on('error', reject);
  });
}

function processCSV(data) {
  const comissaoCapa = data.filter(row => row.nome === "COMISSÃO CAPA").map(formatComissaoCapa);
  const regularPayments = data.filter(row => row.nome !== "COMISSÃO CAPA");
  const groups = groupByContaCorrente(regularPayments);
  const groupedPayments = Object.values(groups).map(formatGroup);

  return [...comissaoCapa, ...groupedPayments];
}

function groupByContaCorrente(data) {
  return data.reduce((acc, row) => {
    const key = row.contaCorrente;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});
}

function formatComissaoCapa(row) {
  const parseMiles = (value) => parseFloat(value.replace(/\./g, '').replace(',', '.'));
  const parseMilesValue = (value) => parseFloat(value.replace("R", '').replace("$", "").replace(",", "."));

  const quantidadeMilhas = parseMiles(row.quantidadeMilhas);
  const valorMilheiro = parseMilesValue(row.valorMilheiro).toFixed(2);
  console.log(valorMilheiro);
  const valorPagamento = (quantidadeMilhas / 1000) * valorMilheiro;

  return `Dados bancários para depósito - COMISSÃO CAPA
Nome Ofertante: LEANDRO MIQUERI DE CARVALHO
CPF/CNPJ do Ofertante: 05844403673
Companhia: ${row.ciaAerea}
Quantidade de milhas: ${quantidadeMilhas}
Milheiro: ${valorMilheiro}
Pagamento será feito na conta: ( ) Titular do contrato ( ) Terceiro
Nome completo: Capa Gestão & Negócios LTDA
Banco: SICOOB-756
Agência: 3103
Conta: 10.656-9
Chave PIX: SUPORTE@CAPABR.COM.BR
Tipo de conta: (x) Corrente ( ) Poupança
CPF/CNPJ: 43.466.354/0001-39
Valor do Pagamento: ${valorPagamento.toFixed(2)}`;
}

function formatGroup(group) {
  const firstRow = group[0];
  const parseMiles = (value) => parseFloat(value.replace(/\./g, '').replace(',', '.'));
  const parseMilesValue = (value) => parseFloat(value.replace("R", '').replace("$", "").replace(",", "."));

  const totalMiles = group.reduce((sum, row) => sum + parseMiles(row.quantidadeMilhas), 0);
  const valorMilheiro = parseMilesValue(firstRow.valorMilheiro).toFixed(2);
  const valorPagamento = (totalMiles / 1000) * parseFloat(valorMilheiro);

  const maxmilhasLogins = group.map(row => row.maxmilhasLogin).join(', ');
  const nomeDaEmpresa = firstRow.nomeDaEmpresa && firstRow.nomeDaEmpresa !== '0' ? firstRow.nomeDaEmpresa : firstRow.nome;
  const CNPJDaEmpresaRecebedora = firstRow.CNPJDaEmpresaRecebedora || firstRow.cpf;

  return `Dados bancários para depósito (${maxmilhasLogins})
Nome Ofertante: ${firstRow.nome}
CPF/CNPJ do Ofertante: ${firstRow.cpf}
Companhia: ${firstRow.ciaAerea}
Quantidade de milhas: ${totalMiles}
Milheiro: ${valorMilheiro}
Pagamento será feito na conta: ( ) Titular do contrato ( ) Terceiro
Nome completo: ${nomeDaEmpresa}
Banco: ${firstRow.nomeDoBanco}
Agência: ${firstRow.agencia}
Conta: ${firstRow.contaCorrente}
Chave PIX: ${firstRow.chavePix}
Tipo de conta: (x) Corrente ( ) Poupança
CPF/CNPJ: ${CNPJDaEmpresaRecebedora}
Valor do Pagamento: ${valorPagamento.toFixed(2)}`;
}

module.exports = {
  processCSVBuffer
};