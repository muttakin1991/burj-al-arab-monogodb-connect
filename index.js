const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ummfz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = 5000


const app = express()


app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./Configs/burj-al-arab-51648-firebase-adminsdk-1p3yw-f226574833.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIR_DB
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const booking = client.db("BurjAlArab").collection("Booking");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        booking.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        console.log(newBooking);
    })

    app.get('/booking', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;

                   if(tokenEmail == queryEmail){
                        booking.find({email:queryEmail})
                        .toArray((err, documents) => {
                        res.status(200).send(documents) 
                        })
                   }
                   else{
                    res.status(401).send('unauthorized access')
                   }
                })
                .catch((error) => {
                    res.status(401).send('unauthorized access');
                });
        }
        else{
            res.status(401).send('unauthorized access')
        }
      
    })

});


app.listen(port)