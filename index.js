const express =require ('express');
const cors = require ('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app= express();
const port= process.env.PORT || 8080;

// middleware
app.use(cors());
app.use(express.json());


console.log(process.env.ACCESS_TOKEN_SECRET);
const uri ='mongodb://0.0.0.0:27017'
//  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9lqzgjv.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT =(req,res,next) => {
  console.log('hitting verify JWT');
  console.log('kkdd',req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  console.log('token', token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
    if(error){
      return res.status(403).send({error:true, message: 'unauthenticated access'});
    }
    req.decoded = decoded;
    next();
  })

      
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const doctorDataCollection = client.db('usersDB').collection('doctorData');
    const bookingDataCollection = client.db('usersDB').collection('patientData');
    
    // jwt services

    // jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log({user});
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'5s'
      })
      console.log(token);
      res.send({token})
    })
    
    app.get('/data', async(req,res)=>{
      const cursor = doctorDataCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/data/:id', async (req,res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)};
      const options ={
        projection : {title:1, price: 1,service_id:1,facility:1, img:1}
      };
      const result = await doctorDataCollection.findOne(query, options);
      res.send(result)

    })
    // booking
    
    app.get('/booking',verifyJWT, async (req,res)=>{
      const decoded = req.decoded
      console.log('came bac---------------------------',decoded);
      if(decoded.email !== req.query.email){
        res.status(403).send({error: true, message: 'forbidden access'});  
      }
      // const book = req.headers.authorization;
      // console.log(book);
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingDataCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/booking/:id', async (req,res)=>{
      const bookId = req.params.id;
      console.log({bookId});
      const query = {_id: new ObjectId(bookId) };
      const result = await bookingDataCollection.findOne(query);
      console.log(result);
      res.send(result);
    })
    
    app.post('/booking', async (req,res)=>{
      const booking = req.body;
      console.log({booking});
      const result = await bookingDataCollection.insertOne(booking);
      res.send(result)
    })

     app.patch('/booking/:id', async (req,res)=>{
      const id= req.params.id;
      console.log({id});
      const filter = {_id: new ObjectId(id)};
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc = {
        $set:{status:updateBooking.status} 
      }
      const result = await bookingDataCollection.updateOne(filter,updateDoc);
      res.send(result)
      console.log({result});
    })

    app.delete('/booking/:id', async (req,res)=>{
      const id = req.params.id;
      // console.log({id});
      const query = {_id: new ObjectId(id)};
      // console.log({query});
      const result = await bookingDataCollection.deleteOne(query);
      res.send(result);
    });

   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
  res.send('my server in running state')
})

app.listen(port, ()=>{
  console.log(`my server listening on port ${port}`);
})