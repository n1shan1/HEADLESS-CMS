const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors()); 
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Vignesh@2003',
  database: 'headless_cms'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

db.query(`CREATE TABLE IF NOT EXISTS entities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) throw err;
  console.log('Entities table created or already exists');
});

db.query(`CREATE TABLE IF NOT EXISTS attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_id INT,
  name VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
)`, (err) => {
  if (err) throw err;
  console.log('Attributes table created or already exists');
});

db.query(`CREATE TABLE IF NOT EXISTS data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_id INT,
  attribute_id INT,
  value_datetime DATETIME,
  value_text VARCHAR(255),
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
)`, (err) => {
  if (err) throw err;
  console.log('Data table created or already exists');
});

app.post('/api/entities', (req, res) => {
  const { name, attributes } = req.body;
  db.query('INSERT INTO entities (name) VALUES (?)', [name], (err, entityResult) => {
    if (err) {
      console.error('Error creating entity:', err);
      res.status(500).json({ error: 'An error occurred during entity creation' });
      return;
    }
    const entityId = entityResult.insertId;
    console.log(entityId);
    console.log('Attributes:', attributes);
    for (const attribute of attributes) {
      db.query('INSERT INTO attributes (entity_id, name, data_type) VALUES (?, ?, ?)', [entityId, attribute.name, attribute.dataType], (err, attributeResult) => {
        if (err) {
          console.error('Error creating attribute:', err);
          res.status(500).json({ error: 'An error occurred during attribute creation' });
          return;
        }
      });
    }
    res.status(201).json({ message: 'Entity created successfully', id: entityId });
  });
});

app.get('/api/entities', (req, res) => {
  db.query('SELECT * FROM entities', (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/entities/:id/attributes', (req, res) => {
  const entityId = req.params.id;
  db.query('SELECT * FROM attributes WHERE entity_id = ?', [entityId], (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const formattedAttributes = results.map(row => ({
        name: row.name,
        dataType: row.data_type,
        id: row.id,
        entityId: row.entity_id
      }));
      res.json({ Attributes: formattedAttributes });
    }
  });
});

app.put('/api/entities/:id', (req, res) => {
  const entityId = req.params.id;
  const { attributeId, valueDatetime, valueText } = req.body;
  db.query('INSERT INTO data (entity_id, attribute_id, value_datetime, value_text) VALUES (?, ?, ?, ?)', [entityId, attributeId, valueDatetime, valueText], (err) => {
    if (err) {
      console.error('Error adding data to entity:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Data added successfully' });
    }
  });
});


app.delete('/api/entities/:id', (req, res) => {
  const entityId = req.params.id;
  db.query('DELETE FROM entities WHERE id = ?', [entityId], (err, result) => {
    if (err) {
      console.error('Error deleting entity:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Entity not found' });
    } else {
      res.json({ message: 'Entity deleted successfully' });
    }
  });
});

//create object
app.post('/api/entities/:entityId/attributes/:attributeId/data', (req, res) => {
  const {data} = req.body;
  const entityId = req.params.entityId;  
  const attributeId = req.params.attributeId;  
  console.log('data:', data);
  console.log('datetime:', data.value_datetime);
  console.log('value_text:', data.value_text);
  const value_datetime = data.value_datetime || null;
  const value_text = data.value_text || null;

  //const { value_datetime, value_text } = data;

  console.log('Received entityId:', entityId);
  console.log('Received attributeId:', attributeId);
  console.log('Received value_datetime:', value_datetime);
  console.log('Received value_text:', value_text);
  
  db.query('INSERT INTO data (entity_id, attribute_id, value_datetime, value_text) VALUES (?, ?, ?, ?)', [entityId, attributeId, value_datetime, value_text], (err, attributeData) => {
    if (err) {
      console.error('Error entering attribute data:', err);
      res.status(500).json({ error: 'An error occurred during entering attriubte data' });
      return;
    }
    const dataId = attributeData.insertId;
    res.status(201).json({ message: 'Attribute data entered successfully', id: dataId });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
