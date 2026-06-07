const express = require('express');
const app = express();

const userRoutes = require('./routes/user.routes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('src/views'));

app.use('/users', userRoutes);

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
