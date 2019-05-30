const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "lojaa"
});

connection.connect(err => {
  if (err) {
    return err;
  }
});

app.use(cors());

app.get("/show", (req, res) => {
  let order = "";
  let limit = "";
  let where = "";

  if (req.query.order) {
    order = "ORDER BY " + req.query.order;
  }

  if (req.query.where) {
    where = "WHERE " + req.query.where;
    where = where.replace(/@@@/g, "%");
  }

  if (req.query.limit) {
    limit = "LIMIT " + req.query.limit;
  }

  const { table } = req.query;

  const select = `SELECT * FROM ${table} ${where} ${order} ${limit}`;
  connection.query(select, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      return res.json({
        data: results
      });
    }
  });
});

app.get("/add", (req, res) => {
  const { table, campos, valores } = req.query;
  const insert = `INSERT INTO ${table} (${campos}) VALUES (${valores})`;
  connection.query(insert, (err, results) => {
    if (err) {
      return err;
    } else {
      return res.send("enviado");
    }
  });
});

app.get("/update", (req, res) => {
  const { table, alt, id } = req.query;
  const update = `UPDATE ${table} SET ${alt} WHERE id=${id}`;
  connection.query(update, (err, results) => {
    if (err) {
      return err;
    } else {
      return res.send("update");
    }
  });
});

app.get("/remove", (req, res) => {
  const { table, id } = req.query;
  const remove = `DELETE FROM ${table} WHERE id=${id}`;
  connection.query(remove, (err, results) => {
    if (err) {
      return err;
    } else {
      return res.send("remove");
    }
  });
});

const fileUpload = require("express-fileupload");
const bodyParcer = require("body-parser");

//npm install file-system --save
var fs = require("file-system");

app.use(fileUpload());
app.use(bodyParcer.json());
app.use(bodyParcer.urlencoded({ extended: false }));

app.use("/public/uploads", express.static(__dirname + "/uploads"));

//remover imagem da pasta do diretorio
app.post("/remove/:name", (req, res, next) => {
  // nome do arquivo que serar removido
  const filename = req.params.name;

  // verificação se existe o arquivo na pasta
  fs.stat(`public/uploads/${filename}`, function(err, stats) {
    // console.log(stats); aqui temos todas as informações do arquivo na variável stats

    if (err) {
      return console.error(err);
    }
    // remover arquivo
    fs.unlink(`public/uploads/${filename}`, function(err) {
      if (err) return console.log(err);
    });
  });
});

app.post("/upload", (req, res, next) => {
  let imageFile = req.files.file;
  // Constante para gerar um nome unico para a imagem.
  const fileName = Date.now();
  // local para onde é copiada a imagem
  imageFile.mv(
    `${__dirname}/public/uploads/${fileName}.jpg`,

    function(err) {
      if (err) {
        return res.status(500).send(err);
      }
      // retornar o caminho da imagem
      res.json({ file: `${fileName}.jpg` });
    }
  );
});

app.get("/boleto", (req, res) => {
  const fs = require("fs");
  const { bradesco } = require("boleto-pdf");
  let code = "";
  let dataC = new Date();

  for (let i = 0; i < 45; i++) {
    code += Math.floor(Math.random() * 9);
  }

  let array = code.split("");
  let word = "";

  for (let i = 0; i < array.length; i++) {
    if (i === 5 || i === 15 || i === 26) {
      word += ".";
    }
    if (i === 10 || i === 21 || i === 32 || i === 33) {
      word += " ";
    }

    if (array[i] !== "." && array[i] !== " ") {
      word += array[i];
    }
  }
  console.log(req.query.cep);
  const boleto = {
    barcodeData: code,
    digitableLine: word,
    paymentPlace:
      "Pagável preferencialmente na rede Bradesco ou Bradesco Expresso.",
    beneficiary: "BaraTudo Store - CNPJ: 074.064.502/0001-12",
    beneficiaryAddress:
      "Rua Dr. José Torquato, 1010 - Centro - São Miguel - RN  - CEP 59920-000",
    instructions:
      "Após o vencimento cobrar multa de 2,00% , mais juros ao mes de 1,00%.",
    agency: "7506",
    agencyDigit: "0",
    account: "54291",
    accountDigit: "1",
    expirationDay: new Date(
      dataC.getFullYear(),
      dataC.getMonth() + 1,
      dataC.getDate() + 3
    ),
    documentDate: dataC, // 18/08/2017
    processingDate: dataC, // 18/08/2017
    card: "09",
    documentNumber: "42493",
    formatedOurNumber: "09/19000001208-0",
    formatedValue: "R$: " + req.query.total,
    documentType: "DS",
    accept: "N",
    currencyType: "Real (R$)",
    amount: " ",
    valueOf: " ",
    descountValue: "R$: " + req.query.desc,
    otherDiscounts: " ",
    feeValue: " ",
    outherFees: " ",
    chargeValue: " ",
    payer: {
      name: req.query.nome,
      registerNumber: req.query.cpf,
      street: req.query.rua,
      number: req.query.casa,
      complement: " ",
      district: req.query.bairro,
      city: req.query.cidade,
      state: req.query.uf,
      postalCode: req.query.cep
    },
    guarantor: {
      name: "ACME Telecomunicações Ltda",
      registerNumber: "074.064.502/0001-12",
      street: "Servidão",
      number: "439",
      district: "Estrada Nova",
      complement: " ",
      city: "Jaraguá do Sul",
      state: "SC",
      postalCode: "89254-375"
    }
  };

  bradesco(boleto)
    .then(data => {
      fs.writeFile(
        `./Boleto/PDF/boleto - ${req.query.nome}.pdf`,
        data,
        "binary",
        err => {
          if (err) {
            console.log(err);
            return;
          }

          console.log("file saved");
        }
      );
    })
    .catch(err => {
      console.log(err);
    });
});

app.listen(4000, () => {});
console.log("4000");
