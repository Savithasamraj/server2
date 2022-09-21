const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
  require("dotenv").config()
const URL = process.env.db;


const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(
  cors({
    origin:'*',
    
    credentials:true
  })
);

app.get("/", (req, res) =>
  res.send(`Server Running`)
);
let authenticate = function (req, res, next) {
  if (req.headers.authorization) {
    try {
      let verify = jwt.verify(req.headers.authorization,process.env.SECRET);

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

app.post("/register", async function (req, res) {
  console.log("data123")
  try {
    const connection = await mongoClient.connect(URL);
console.log("data1")
    const db =  await connection.db("query");
    console.log("data2")
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("login").insertOne(req.body);
    console.log("data3")
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
app.post("/login", async function (req, res) {
  console.log(req.body);
  console.log("datassss")
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("query");
console.log("data1")
    const user = await db.collection("login")
      .findOne({ username: req.body.username });
      // await connection.close();
      console.log(user);

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id },process.env.SECRET);

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
app.post("/form",authenticate, async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
  
    const db = await connection.db("query");
    req.body.userid = mongodb.ObjectId(req.userid);
    
req.body.date=new Date().toLocaleDateString() ;
req.body.time=new Date().toLocaleTimeString()
    const body = await db.collection("form").insertOne(req.body);
    // const req.body.question=body.length

    await connection.close();
    res.json({
      message: "query created",
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/dashboard",authenticate, async function (req, res) {
  
  try{
    const connection = await mongoClient.connect(URL);
    console.log("data")
    const db = connection.db("query");
    console.log(req.userid);
    const data = await db.collection("form").find({userid:mongodb.ObjectId (req.userid)}).sort({"_id":-1}).toArray()
    console.log(data);
    await connection.close();
    res.send(data);
  }
    // res.json({
    //   message: "query displaced",
    
    // });
    catch(error){
console.log(error)
    }
  
});


app.get("/mentorassign",async function(req,res){
  const connection= await mongoClient.connect(URL)
  const db=await connection.db("query")
  const user=await db.collection("mentor").findOne({subject:req.values.subcategory})
   await connection.close();
res.json({
  message:"queryassigned"
})

})
const port=process.env.PORT ||5000
app.listen(port, () => {
  console.log("running in ");
});
