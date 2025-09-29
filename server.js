const express = require("express");
// const { main } = require("./models/index");
const productRoute = require("./router/product");
const userRoute = require("./router/user");
const storeRoute = require("./router/store");
const purchaseRoute = require("./router/purchase");
const salesRoute = require("./router/sales");
const consumedRoute = require("./router/consumed");
const cors = require("cors");
const User = require("./models/users");
const Consumed = require("./models/consumed.js");
const connectdb = require("./db/index.js");

const app = express();
connectdb();

const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],

}));

// Handle preflight requests for all routes
app.options('*', cors());


// Store API
app.use("/api/store", storeRoute);

// Products API
app.use("/api/product", productRoute);

// User API
app.use("/api/user", userRoute);

// Purchase API
app.use("/api/purchase", purchaseRoute);

// Sales API
app.use("/api/sales", salesRoute);

app.use("/api/consumed", consumedRoute);

// ------------- Signin --------------
let userAuthCheck;
app.post("/api/login", async (req, res) => {
  console.log(req.body);
  // res.send("hi");
  try {
    const user = await User.findOne({
      email: req.body.email,
      password: req.body.password,
    });
    console.log("USER: ", user);
    if (user) {
      res.send(user);
      userAuthCheck = user;
    } else {
      res.status(401).send("Invalid Credentials");
      userAuthCheck = null;
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

// Getting User Details of login user
app.get("/api/login", (req, res) => {
  res.send(userAuthCheck);
});
// ------------------------------------

// Registration API
app.post("/api/register", (req, res) => {
  let registerUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    phoneNumber: req.body.phoneNumber,
    imageUrl: req.body.imageUrl,
  });

  registerUser
    .save()
    .then((result) => {
      res.status(200).send(result);
      alert("Signup Successfull");
    })
    .catch((err) => console.log("Signup: ", err));
  console.log("request: ", req.body);
});

app.get("/testget", async (req, res) => {
  const result = await Consumed.find({});
  res.json(result);
});

// Here we are listening to the server
app.listen(PORT, () => {
  console.log(
    `server is working at port:${PORT} in ${process.env.NODE_ENV} mode`
  );
});
