const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
require("dotenv").config();
const URL = process.env.db;
const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(
  cors({
    origin: "*",

    credentials: true,
  })
);

app.get("/", (req, res) => res.send(`Server Running`));
///authentication for student
let authenticate = function (req, res, next) {
  if (req.headers.authorization) {
    try {
      let verify = jwt.verify(req.headers.authorization, process.env.SECRET);

      if (verify) {
        req.userid = verify._id;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.json("errors");
    res.status(401).json({ message: "Unauthorized" });
  }
};
//autenticate for mentor
let authenticatementor = function (req, res, next) {
  if (req.headers.authorization) {
    try {
      let verify = jwt.verify(req.headers.authorization, process.env.SECRET);

      if (verify) {
        req.userid = verify._id;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.json("errors");
    res.status(401).json({ message: "Unauthorized" });
  }
};

//1.register a student
app.post("/register", async function (req, res) {
  console.log("data123");
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data1");
    const db = await connection.db("query");
    console.log("data2");
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("login").insertOne(req.body);
    console.log("data3");
    await connection.close();

    res.json({
      message: "Successfully Registered",
    });
  } catch (error) {
    res.json({
      message: error,
    });
  }
});
//2.login a student
app.post("/login", async function (req, res) {
  console.log(req.body);
  console.log("datassss");
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("query");
    console.log("data1");
    const user = await db
      .collection("login")
      .findOne({ username: req.body.username });
    // await connection.close();
    console.log(user);

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET);

        res.json({
          message: "Welcome to Query Ticket Raising Portal",
          token,
        });
      } else {
        res.json({
          message: "Password is incorrect",
        });
      }
    } else {
      res.json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log("error");
  }
});

//3.Admin login
app.post("/admin", async function (req, res) {
  console.log(req.body);
  try {
    const connection = await mongoClient.connect(URL);
    const db = await connection.db("query");
    const admin = await db.collection("admin").findOne({ name: req.body.name });
    if (admin) {
      const match = await db
        .collection("admin")
        .findOne({ password: req.body.password });
      if (match) {
        res.json({
          message: "Successfully logged in",
        });
      } else {
        res.json({
          message: "password incorrect",
        });
      }
    } else {
      res.json({
        message: "user name is not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
///mentorlogin
app.post("/mentorlogin", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("query");

    const user = await db
      .collection("mentor")
      .findOne({ name: req.body.mentorname });

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET);

        res.json({
          message: "Welcome to Query Ticket Raising Portal",
          token,
        });
      } else {
        res.json({
          message: "Password is incorrect",
        });
      }
    } else {
      res.json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log("error");
  }
});
//create a mentor
app.post("/mentor", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = await connection.db("query");
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("mentor").insertOne(req.body);
    await connection.close();
    res.json({
      message: "mentor created",
    });
  } catch (error) {
    console.log(error);
  }
});

//to create a query
app.post("/form", authenticate, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = await connection.db("query");
    req.body.userid = mongodb.ObjectId(req.userid);

    req.body.date = new Date().toLocaleDateString();
    req.body.time = new Date().toLocaleTimeString();
    const body = await db.collection("form").insertOne(req.body);

    await connection.close();
    res.json({
      message: "query created",
    });
  } catch (error) {
    console.log(error);
  }
});

//dashboard of student
app.get("/dashboard", authenticate, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data");
    const db = connection.db("query");
    console.log(req.userid);
    const data = await db
      .collection("form")
      .find({ userid: mongodb.ObjectId(req.userid) })
      .sort({ _id: -1 })
      .toArray();
    console.log(data);
    await connection.close();
    res.send(data);
  } catch (error) {
    // res.json({
    //   message: "query displaced",

    // });
    console.log(error);
  }
});

/// assigning a mentor for queries
app.post("/mentorassign", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = await connection.db("query");

    const data = await db
      .collection("mentor")
      .findOne({ subject: req.body.subcategory });

    await connection.close();

    res.json({
      message: "queryassigned",
      data,
    });
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ssavitha1905@gmail.com",
        pass: process.env.password,
      },
    });
    var mailoptions = {
      from: "ssavitha1905@gmail.com",
      to: "saviravi1905@gmail.com",
      text: `Hi ${data.name} A student  from Batch 5 reaised a query  on ${req.body.subcategory}.
  QUERY DESCRIPTION:${req.body.querydescription}
  Please resolve this query through google meet or telephone. 
  student number:${req.body.phonenumber}  
                           Thankyou
 By:
 ZEN PORTAL
 CHENNAI`,
    };
    transporter.sendMail(mailoptions, function (error) {
      if (error) {
        res.json({
          meassage: error,
        });
      } else {
        res.json({
          message: "query sent  to mentor",
        });
      }
    });
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ssavitha1905@gmail.com",
        pass: process.env.password,
      },
    });
    var mailoptions = {
      from: "ssavitha1905@gmail.com",
      to: "saviravi1905@gmail.com",
      text: `Hi 
you raised a query on ${req.body.subcategory} and it is assigned to ${data.name}.
 Thank you for raising query
 
  
                           Thankyou
 By:
 ZEN PORTAL
 CHENNAI`,
    };
    transporter.sendMail(mailoptions, function (error) {
      if (error) {
        res.json({
          meassage: error,
        });
      } else {
        res.json({
          message: "query sent  to student",
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});
//dashboard of mentor

app.get("/mentorpage", authenticatementor, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = await connection.db("query");
    const mentor = await db
      .collection("form")
      .find({ id: req.userid })
      .sort({ _id: -1 })
      .toArray();
    //mongodb.ObjectId
    console.log(mentor);
    res.send(mentor);

    await connection.close();
  } catch (error) {
    console.log(error);
  }
});
app.put("/updatementor", authenticate, async function (req, res) {
  console.log(req.body);
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data");
    const db = await connection.db("query");
    console.log("data2");

    const user = mongodb.ObjectId(req.userid);
    console.log(user);
    const data1 = await db
      .collection("form")
      .update(
        { userid: mongodb.ObjectId(req.userid), subcategory: req.body.subject },
        { $set: { mentor: req.body.name, id: req.body._id } }
      );
    console.log(req.body.name);
    console.log(data1);
    await connection.close();
    res.json({
      message: "updated",
    });
  } catch (error) {
    console.log(error);
  }
});
app.put("/status", async function(req,res){
  console.log(req.body)
  try {
    const connection = await mongoClient.connect(URL);
    console.log("data");
    const db = await connection.db("query");
    console.log("data2");

    const data1 = await db
      .collection("form")
      .updateOne({ _id: mongodb.ObjectId(req.body._id) }, { $set:{status: "resolved" } });

    console.log(data1);
    await connection.close();
    res.json({
      message: "updated",
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/getqueries",async function(req,res){
  try{
    const connection = await mongoClient.connect(URL);

    const db = await connection.db("query");
    const fetch=await db.collection("form").find().sort({date:-1}).toArray();

    await connection.close();
    res.json({
      fetch
    })
  }
 
  catch(error){
console.log(error)
  }
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("running in ");
});
