require('dotenv').config();
const express = require('express');
const propertyRoutes = require('./routes/property');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/property', propertyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
