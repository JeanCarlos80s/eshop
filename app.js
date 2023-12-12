const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose')
const cors = require('cors');
const authJwt = require('./helpers/jwt');

app.use(cors());
app.options('*', cors());

require('dotenv/config');

// MIDDLEWARES
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(authJwt());

// ROUTERS
const categoriesRouter = require('./routers/categories')
const productRouter = require('./routers/products');
const userRouter = require('./routers/users')
const ordersRouter = require('./routers/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/products`, productRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, ordersRouter);

mongoose.connect(process.env.CONNECTION_STRING).then(() => {
    console.log('Database connectio is ready...');
}).catch((err) => {
    console.log(err);
});

app.listen(3000, () => {
    console.log('Server is running http://localhost:3000');
})
