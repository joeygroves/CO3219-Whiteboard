require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = Infinity;


//Basic express server

const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http, {
    'pingInterval': 25000,
    'pingTimeout': 50000
});

io.setMaxListeners(50);

const users = {};



app.use(express.static(__dirname + '/public'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: false}));


//Database
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://jgroves:QA6CcxO7idKq1YU8@cluster0.eeeuh.mongodb.net/whiteboard?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const Schema = mongoose.Schema;

const WhiteboardSchema = new Schema({
    data: Object
});

const Whiteboard = mongoose.model('Whiteboard', WhiteboardSchema);


function onConnection(socket) {

    Whiteboard.find({}, { _id: 0, __v: 0 }, function (err, results) {
        socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
        //console.log(results);
        for (item in results) {
            socket.emit('drawing', results[item].data);
        }
    })



    socket.on('drawing', (data) => {

        socket.broadcast.emit('drawing', data);
        //console.log(data);
        const whiteboard = new Whiteboard({
            data: data
        });
        whiteboard.save();
        //console.log(typeof data.x0);
        //console.log(data.color);
    });

    




    socket.on('new-user', (name) => {

        users[socket.id] = name;
        console.log(`${name} is here`);
        socket.broadcast.emit('user-connected', name);
    });

    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} disconnected`);
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    });


    //Clear whiteboard

    socket.on('clear', () => {
        Whiteboard.deleteMany({}, function(){
            io.emit('cleared');
            //console.log("TEST");
        });

    });

}

io.on('connection', onConnection);

db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

http.listen(port, () => console.log('listening on port ' + port));
