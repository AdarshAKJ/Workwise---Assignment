const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/config');
const cors = require('cors');
const seatModel = require('./src/models/seatModel');

dotenv.config();
connectDB();

const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(cors());

app.use((req, res, next) => {
    req.io = io;
    next();
})

app.get("/", (req, res) => {
    console.log("working");
    res.json({ data: "Hello World" });
});

app.use(bodyParser.json());

app.use('/api/user', require('./src/routes/authRoutes'));
app.use('/api/seat', require('./src/routes/authSeats'));

io.on('connection', (socket) => {
    console.log('socket Connected');
    socket.on('join', (data) => {
        console.log(data);
        socket.emit('message', 'Hello');
    })
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});

// (async function () {
//     const vp = [];

//     // Create 11 arrays of size 7, filled with 0
//     for (let j = 0; j < 11; j++) {
//         const v = new Array(7).fill(0); // Create an array of size 7 filled with 0
//         vp.push(v);
//     }

//     // Create one additional array of size 3, filled with 0, and push it to vp
//     const v = new Array(3).fill(0); // Create an array of size 3 filled with 0
//     vp.push(v);

//     console.log(vp);

//     await seatModel.create({
//         seatArray: vp,
//     })
//     console.log(vp);
// })();