const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs')

const mongodb = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const binary = mongodb.Binary

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload())

MongoClient.connect("mongodb://127.0.0.1:27017", function (err, client) {
  if (err) return console.log(err)
  db = client.db('SistemaMedico')

  app.listen(3000, function () {
    console.log('Server rodando na porta 3000')
  })
})

app.route('/')

  .get(function (req, res) {
    db.collection('prontuarios').find().toArray((err, results) => {
      console.log(toString(results))
      if (err) {
        return console.log(err)
      }
      res.render('pacientes.ejs', { prontuarios: results })
    })
  })

app.route('/NovoCadastro')

  .get(function (req, res) {
    const cursor = db.collection('prontuarios').find()
    res.render('cadastro.ejs')
  })

  .post(function (req, res) {
    db.collection('prontuarios').insertOne(req.body, function (err, result) {

      if (err) {
        return console.log(err)
      }
      console.log('Salvo no Banco de Dados')
      res.redirect('/')

    })
  })

app.route('/show/:id')

  .get(function (req, res) {
    var id = req.params.id

    db.collection('prontuarios').find(ObjectId(id)).toArray(function (err, result) {

      if (err) {
        return console.log(err)
      }

      db.collection('arquivos').find({ id_paciente: ObjectId(id) }).toArray(function (err, resulta) {

        if (err) {
          return console.log(err)
        }

        res.render('prontuario.ejs', { points: result, types: resulta });

      })
    })
  })

app.route('/edit/:id')

  .get(function (req, res) {
    var id = req.params.id

    db.collection('prontuarios').find(ObjectId(id)).toArray(function (err, result) {

      if (err) {
        return console.log(err)
      }
      res.render('editProntuario.ejs', { prontuarios: result })
    })
  })

  .post(function (req, res) {
    var id = req.params.id
    var nome = req.body.nome
    var sobrenome = req.body.sobrenome
    var rg = req.body.rg
    var cpf = req.body.cpf
    var endereco = req.body.endereco

    db.collection('prontuarios').updateOne({ _id: ObjectId(id) }, {
      $set: {
        nome: nome,
        sobrenome: sobrenome,
        rg: rg,
        cpf: cpf,
        endereco: endereco,
      }
    }, function (err, result) {
      if (err) {
        return res.send(err)
      }
      res.redirect('/')
      console.log('Atualizado no Banco de Dados')
    })
  })

app.route('/delete/:id')

  .get(function (req, res) {
    var id = req.params.id

    db.collection('prontuarios').deleteOne({ _id: ObjectId(id) }, function (err, result) {
      if (err) {
        return res.send(500, err)
      }
      console.log('Deletado do Banco de Dados!')
    
     //db.arquivos.deleteOne({ id_paciente:ObjectId("5dc1cdafceaab60e9c30f094") })
     db.collection('arquivos').deleteMany({ id_paciente:ObjectId(id) });

     console.log('Deletado do Arquivos!')
     res.redirect('/')
    })
  })

  // Deletando exames(imagens) da collection arquivos
  app.route('/deleteImagem/:id')

  .get(function (req, res) {
    var id = req.params.id

    db.collection('arquivos').deleteOne({ _id: ObjectId(id) }, function (err, result) {
      if (err) {
        return res.send(500, err)
      }
      console.log('Deletado do Banco de Dados!')
      res.redirect('back')
    })
  })


app.route('/upload/:id')

  .post(function (req, res) {

    var myobj = { nome_exame: req.body.name, id_paciente: ObjectId(req.params.id), imagem_exame: binary(req.files.uploadedFile.data) };
    db.collection('arquivos').insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
    });

    res.redirect('back')
    console.log('Atualizado no Banco de Dados')
  })

app.route('/visualizar/:id')

  .get(function (req, res) {
    var id = req.params.id

    db.collection('arquivos').find({ _id: ObjectId(id) }).toArray((err, doc) => {

      let buffer = doc[0].imagem_exame.buffer // buffer da imagem -------- <Buffer ff d8 ff e0 00 10 4a.....>
      let nome = doc[0].nome_exame

      var s = binary(buffer); // Retorna um json binário (grid) -------- Binary { _bsontype: 'Binary', sub_type 0, position: 20905, buffer <Buffer ff d8 ff e0 00....}

      var a = JSON.stringify(s); // do json para string -------- "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAA.......4KP1P/2!=="

      var ret = a.replace('"',''); // (Só funciona com string), remove o " para renderizar a imagem  ----------- /9j/4AAQSk........
     
      var z = "<img src=\"data:image/gif;base64," + ret + "><br><h3>Nome do Exame: " + nome +"</h3>"; // Acopla na string de dados o formato base64 para renderizar a imagem em html

      console.log(s);

      res.send( z );
     //res.status(204).render(z);

    })
  })