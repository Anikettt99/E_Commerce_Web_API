const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require('cors');


const productRouter = require('./routes/products');
const categoryRouter = require('./routes/categories');
const userRouter = require('./routes/users');
const orderRouter = require('./routes/orders')

require("dotenv/config");
const authJwt = require('./helpers/jwt');
const error_handler = require('./helpers/error-handler');

const api = process.env.API_URL;

app.use(cors());
app.options('*' , cors());

// ------------------- middlewares-----------------------------//

//app.use(express.json());  // we can use this to parse incoming json data  and this is a middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
//app.use(authJwt());
app.use('/public/uploads' , express.static(__dirname + 'public/uploads'));   // use to make this path as static folder...not a API
app.use(error_handler);
 
//--------------------------------------------------------//

//Routes

app.use(`${api}/products` , productRouter);
app.use(`${api}/categories` , categoryRouter);
app.use(`${api}/users` , userRouter);
app.use(`${api}/orders` , orderRouter);

mongoose 
  .connect(process.env.CONNECTION_STRING, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Database connection is ready");
    app.listen(3000, () => {
      console.log("Listening on port 3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
