import express from "express"
import 'dotenv/config'
import cors from "cors";
const app = express();
const port = process.env.port || 5000;

app.use(express.json());



app.use(cors({
     origin: `${process.env.FRONTEND_URL_LOCAL}`,
}));

app.get('/', (req, res) => {
    res.send('Welcome to Server')
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})