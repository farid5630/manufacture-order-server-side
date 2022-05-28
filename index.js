const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fg5ow3h.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
    try {
        await client.connect();
        const partsCollection = client
          .db("tools-manufacturer")
            .collection("parts");
        const userCollection = client.db("tools-manufacturer").collection('users')
        const ordersCollection = client.db('tools-manufacturer').collection('orders')

      
       const verifyAdmin = async (req, res, next) => {
         const requester = req.decoded.email;
         const requesterAccount = await userCollection.findOne({
           email: requester,
         });
         if (requesterAccount.role === "admin") {
           next();
         } else {
           res.status(403).send({ message: "forbidden" });
         }
      };
      
        app.get('/parts', async(req, res) => {
            const query = {};
            const result = await partsCollection.find(query).toArray()
            res.send(result)
        })
        app.post("/parts", async (req, res) => {
            const parts = req.body;
            const result = await partsCollection.insertOne(parts);
            res.send(result);
        })

      // admin check 
       app.get("/admin/:email", async (req, res) => {
         const email = req.params.email;
         const user = await userCollection.findOne({ email: email });
         const isAdmin = user.role === "admin";
         res.send({ admin: isAdmin });
       });

        // order 
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await partsCollection.findOne(query);
            res.send(result);
        })
        // MY ORDER
        app.get('/order', verifyJWT, async (req, res) => {
            const email = req.query.email;
             const decodedEmail = req.decoded.email;
             if (email === decodedEmail) {
               const query = { email: email };
               const orders = await ordersCollection.find(query).toArray();
               return res.send(orders);
             } else {
               return res.status(403).send({ message: "forbidden access" });
             }
        })

        app.post('/order', async (req, res) => {
             const order = req.body;
             const result = await ordersCollection.insertOne(order);
             return res.send({ success: true, result });
        });

        // my Order Delete 
         app.delete("/order/:id", async (req, res) => {
           const id = req.params.id;
           const query = { _id: ObjectId(id) };
           const result = await ordersCollection.deleteOne(query);
           res.send(result);
         });

        // user creating 
           app.put("/user/:email", async (req, res) => {
             const email = req.params.email;
             const user = req.body;
             const filter = { email: email };
             const options = { upsert: true };
             const updateDoc = {
               $set: user,
             };
             const result = await userCollection.updateOne(
               filter,
               updateDoc,
               options
             );
             const token = jwt.sign(
               { email: email },
               process.env.ACCESS_TOKEN_SECRET,
               { expiresIn: "2h" }
             );
             res.send({ result, token }); //
           });




    }
    finally {
        
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('tools manufacturing server is runing');
})

app.listen(port, () => {
    console.log('this server port number', port);
})