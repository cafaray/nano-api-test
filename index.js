const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const customers = [
  {
    id: 5,
    first_name: 'Dodol',
    last_name: 'Dargombez'
  },
  {
    id: 6,
    first_name: 'Nyongot',
    last_name: 'Gonzales'
  }
];

const clients = [
  {
    id: 1,
    first_name: 'Haha',
    last_name: 'Hehe'
  },
  {
    id: 2,
    first_name: 'Lala',
    last_name: 'Lili'
  }
];

app.use(bodyParser.json());

app.get('/customers', (req, res) => {
  console.log(JSON.stringify(req.headers));
  res.json(customers);
});

app.get('/customers/:id', (req, res) => {
  res.json(customers[req.params.id]);
});

app.get('/clients', (req, res) => {
  res.json(clients);
});

app.get('/clients/:id', (req, res) => {
  res.json(clients[req.params.id]);
});

app.listen(10000, () => {
  console.log(`Server started!`);
});
