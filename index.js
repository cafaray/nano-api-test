const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const customers = [
  {
    id: 1,
    first_name: 'Ian',
    last_name: 'Lightfoot'
  },
  {
    id: 6,
    first_name: 'Barley',
    last_name: 'Lightfood'
  }
];

const clients = [
  {
    id: 1,
    first_name: 'Manticore',
    last_name: 'Spencer'
  },
  {
    id: 2,
    first_name: 'Laurel',
    last_name: 'Dreyfus'
  }
];

app.use(bodyParser.json());

app.get('/api/v1/customers', (req, res) => {
  console.log(JSON.stringify(req.headers));
  res.json(customers);
});

app.get('/api/v1/customers/:id', (req, res) => {
  res.json(customers[req.params.id]);
});

app.get('/api/v1/clients', (req, res) => {
  res.json(clients);
});

app.get('/api/v1/clients/:id', (req, res) => {
  res.json(clients[req.params.id]);
});

app.listen(10000, () => {
  console.log(`Server started!`);
});
