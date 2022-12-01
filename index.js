const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
// const stripe = require("stripe")(process.env.SECRET_KEY)

ghh

app.use(cors())
app.use(express.json())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ap9xvzb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });





//JWT

function verifyJWT(req, res, next) {


  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).send('unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
          return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded;
      next();
  })

}


async function run() {
  try {
      const productCategoryCollection = client.db('resaleMarket').collection('category')
      const productCollection = client.db('resaleMarket').collection('product')
      const bookingCollection = client.db('resaleMarket').collection('booking')
      const usersCollection = client.db('resaleMarket').collection('users')
      const paymentsCollection = client.db('resaleMarket').collection('payments')


      //jwt
      app.get('/jwt', async (req, res) => {
          const email = req.query.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          if (user) {
              const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' })
              return res.send({ accessToken: token });
          }
          res.status(403).send({ accessToken: '' })
      });

      //verify Admin


      const verifyAdmin = async (req, res, next) => {
          const decodedEmail = req.decoded.email;
          const query = { email: decodedEmail };
          const user = await usersCollection.findOne(query);

          if (user?.role !== 'admin') {
              return res.status(403).send({ message: 'forbidden access' })
          }
          next();
      }



      //category


      app.get('/category', async (req, res) => {
          const query = {}
          const cursor = productCategoryCollection.find(query)
          const category = await cursor.toArray()
          res.send(category);
      })


      app.get('/category/:id', async (req, res) => {
          const id = req.params.id
          const query = { category_id: (id) }
          const cursor = productCollection.find(query)
          const product = await cursor.toArray();
          res.send(product)
      })

      //product


      app.get('/product', verifyJWT, async (req, res) => {
          const query = {}
          const cursor = productCollection.find(query)
          const products = await cursor.toArray()
          res.send(products);
      })

      app.post('/product', async (req, res) => {

          const products = req.body;
          const result = await productCollection.insertOne(products)

          res.send(result);

      })

      app.get('/myproduct', async (req, res) => {
          let query = {}
          if (req.query.email) {
              query = {
                  email: req.query.email
              }
          }
          const cursor = productCollection.find(query)
          const product = await cursor.toArray();
          res.send(product)
      })

      app.patch('/product/:id', async (req, res) => {
          const id = req.params.id;
          const status = req.body.status
          const query = { _id: ObjectId(id) }
          const updatedDoc = {
              $set: {
                  status: status
              }
          }
          const result = await productCollection.updateOne(query, updatedDoc);
          res.send(result);
      })

      app.delete('/product/:id', async (req, res) => {
          const id = req.params.id
          const query = { _id: ObjectId(id) }
          const result = await productCollection.deleteOne(query)

          res.send(result);

      })




      //booking

      app.get('/bookings', verifyJWT, async (req, res) => {
          const email = req.query.email;
          const decodedEmail = req.decoded.email;

          if (email !== decodedEmail) {
              return res.status(403).send({ message: 'forbidden access' });
          }

          const query = { email: email };
          const bookings = await bookingCollection.find(query).toArray();
          res.send(bookings);
      })


      app.get('/bookings/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const booking = await bookingCollection.findOne(query);
          res.send(booking);
      })

      app.post('/bookings', async (req, res) => {
          const booking = req.body;
          const result = await bookingCollection.insertOne(booking)

          res.send(result);

      })


      // seller


      app.get('/users/seller/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email }
          const user = await usersCollection.findOne(query);
          res.send({ isSeller: user?.role === 'Seller' });
      })

      app.get('/users/seller', async (req, res) => {
          const role = "Seller"
          console.log(role)
          const query = { role: role }
          const cursor = usersCollection.find(query)
          const seller = await cursor.toArray();
          res.send(seller)
      })

      app.delete('/users/seller/:id', async (req, res) => {
          const id = req.params.id
          console.log(id)
          const query = { _id: ObjectId(id) }
          const result = await usersCollection.deleteOne(query)

          res.send(result);

      })

      app.patch('/users/seller/:id', async (req, res) => {
          const id = req.params.id;
          const status = req.body.status
          const query = { _id: ObjectId(id) }
          const updatedDoc = {
              $set: {
                  status: status
              }
          }
          const result = await usersCollection.updateOne(query, updatedDoc);
          res.send(result);
      })


      //buyer


      app.get('/users/buyer/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email }
          const user = await usersCollection.findOne(query);
          res.send({ isBuyer: user?.role === 'Buyer' });
      })


      app.get('/users/buyer', async (req, res) => {
          const role = "Buyer"
          console.log(role)
          const query = { role: role }
          const cursor = usersCollection.find(query)
          const buyer = await cursor.toArray();
          res.send(buyer)
      })

      app.delete('/users/buyer/:id', async (req, res) => {
          const id = req.params.id
          console.log(id)
          const query = { _id: ObjectId(id) }
          const result = await usersCollection.deleteOne(query)

          res.send(result);

      })


      //all user

      app.get('/users', async (req, res) => {
          const query = {}
          const user = await usersCollection.find(query).toArray()
          res.send(user)
      })
      app.post('/users', async (req, res) => {
          const user = req.body
          const result = await usersCollection.insertOne(user)
          res.send(result)
      })


      //user admin


      app.get('/users/admin/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email }
          const user = await usersCollection.findOne(query);
          res.send({ isAdmin: user?.role === 'admin' });
      })



      //payment
      app.post('/create-payment-intent', async (req, res) => {
          const booking = req.body;
          const price = booking.price;
          const amount = price * 100;

          const paymentIntent = await stripe.paymentIntents.create({
              currency: 'usd',
              amount: amount,
              "payment_method_types": [
                  "card"
              ]
          });
          res.send({
              clientSecret: paymentIntent.client_secret,
          });
      });



      app.post('/payments', async (req, res) => {
          const payment = req.body;
          const result = await paymentsCollection.insertOne(payment);
          const id = payment.bookingId
          const filter = { _id: ObjectId(id) }
          const updatedDoc = {
              $set: {
                  paid: true,
                  transactionId: payment.transactionId
              }
          }
          const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
          res.send(result);
      })


  }
  finally {

  }
}

run().catch(err => console.log(err))








app.get('/', (req, res) => {
  res.send('Resale Market ')
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`)
});
