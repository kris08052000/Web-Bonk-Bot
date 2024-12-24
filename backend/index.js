const express = require("express");
const app = express();
app.use(express.json())
const JWT_SECRET = "123456"
const {userModel} = require("./models");
const { Keypair, Transaction, Connection } = require("@solana/web3.js");
const jwt = require("jsonwebtoken");
const bs58 = require('bs58');
const cors = require("cors");
app.use(cors())

const connection = new Connection("https://api.devnet.solana.com")

app.post("/api/v1/signup",async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const keypair = new Keypair();
    await userModel.create({
        username,
        password,
        publickey: keypair.publicKey.toString(),
        privatekey: keypair.publicKey.toString()
    })

    res.json({
        message : keypair.publicKey.toString()
    })
})

app.post("/api/v1/signin",async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    const user = await userModel.findOne({
    username: username,
    password: password
    })
    if(user){
        const token = jwt.sign({
            id: user
        }, JWT_SECRET)
        res.json({
            token
        })
    }else {
        res.status(403).json({
            message : "Credentials are incorrect"
        })
    }
})

app.post("/api/v1/txn/sign", async (req, res) => {

    const serializedTransaction = req.body.message;

    console.log("before serialise")
    console.log(serializedTransaction);

    const tx = Transaction.from(Buffer.from(serializedTransaction));
    console.log("after serialise")
    const keypair = Keypair.fromSecretKey(bs58.default.decode(process.env.privatekey));

    const {blockhash} = await connection.getLatestBlockhash();
    tx.blockhash = blockhash;
    tx.feePayer = keypair.publicKey

    tx.sign(keypair)

    const signature = await connection.sendTransaction(tx, [keypair])
    console.log(signature);


    res.json({
        message : "txn sign"
    })
})

app.get("/api/v1/txn", (req, res) => {
    res.json({
        message : "txn"
    })
})


app.listen(3000);