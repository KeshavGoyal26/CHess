//                    All required modules / framework                //
const express = require('express');
const bodyParser = require("body-Parser");
const {
    compile
} = require('ejs');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bcrypt = require('bcrypt')
const saltRounds = 10
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportLocalMongoose = require('passport-local-mongoose')

const mongoose = require('mongoose'); // mongoDB connection through moongose


mongoose.connect("mongodb://localhost:27017/usersDB", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
    .then(() => console.log('DB Connected!')) // promise resolved
    .catch(err => {
        console.log(error in connecting);
    });

mongoose.set("useCreateIndex", true)

app.set('views', './views') // setting ejs
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({
    extended: true
}))

app.use(bodyParser.urlencoded({ // used to get posted date on page 
    extended: true
}))

app.use(session({
    name : "sid",
    cookie : {
        maxAge : 1000*6000,
        sameSite : true,
    },
    secret : "mysecret",
    resave : false,
    saveUninitialized : false
}))

app.use(passport.initialize())
app.use(passport.session())

var nRooms = 1;
var PmatchMake = [];
var games = [];
var pgnServer = 'start';

app.get('/', (req, res) => {
    res.redirect('/home')
})

app.get('/login', (req, res) => {
    if(req.isAuthenticated()){
        res.redirect('/')
    }
    else {
        res.render('login')
    }
})

app.get('/register', (req, res) => {
    if(req.isAuthenticated()){
        res.redirect('/')
    }
    else {
        res.render('register')
    }
})

app.get('/home', (req, res) => {
    
    if(req.isAuthenticated()){
        res.render('main')
    }
    else {
        res.redirect('/login')
    }
    
})

// schema  /// login / signup
const userSchema = new mongoose.Schema ({
    username:{
        type : String
    } ,
    password:{
        type : String
    } 
});

userSchema.plugin(passportLocalMongoose)


const User = new mongoose.model("User", userSchema); // model name is User that uses userSchema

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const gameSchema = {
    room:{
        type : String,
    },
    black:{
        type : String,
    },
    white:{
        type : String,
    },
    pgn:{
        type : String,
    }
}

const Game = new mongoose.model("Game", gameSchema);





app.post('/register', (req, res) => {
    User.register(new User({username : req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err)
            res.redirect('/register')
        }
        else{
            passport.authenticate('local')(req, res, function(){
                res.redirect('/home')
            })
        }
    })
});

app.post('/login', (req, res) => {
    const user = new User({
        username : req.body.username,
        password : req.body.password
    })

    req.login(user, function(err) {
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate('local')(req, res, function(){
                res.redirect('/home')
            })
        }
    })
    console.log(req.user.username)
});


app.get('/:room', (req, res) => {
    console.log("user : " + req.user.username)
    var gameoverPgn = 'start'

    Game.findOne({
        room: req.params.room
    },(err, foundGame) => {
        if(err){
            console.log(error)
        }
        else{
            if(foundGame != null)
            gameoverPgn = foundGame.pgn
            // console.log(gameoverPgn)
        }
    })
    res.render('room', {
        roomName: req.params.room,
        roomPgn: gameoverPgn
    })
})


server.listen(3000)

//          socket.io logics        /////////

io.sockets.on('connect', function newConnection(socket) {
    //socket.emit('updatepgn',pgnServer);
    socket.on('connectedToRoom', function (room) {
        socket.join(room)
        let roomNum = room.substr(4);
        console.log(games)

        if (games[roomNum].white == null) {
            games[roomNum].white = socket;
            socket.emit('piececolor', 'w');
        } else {
            games[roomNum].black = socket;
            socket.emit('piececolor', 'b');
        }
        console.log('Room no. : ' + roomNum)
        // console.log('Black : ' + games[roomNum].black)
        // console.log('White : ' + games[roomNum].white)


    })
    socket.on('movemade', function updatePGN(room, pgn) {

        //socket.broadcast.emit('movemade',pgn) 
        io.sockets.to(room).emit('movemade', pgn)
        pgnServer = pgn; //storing current pgn in server
        console.log(pgn);

        
        
    })

    socket.on('sendresign', function sendResign(room, color, pgn){

        io.sockets.to(room).emit('recresign', color)

        const newGame = new Game({
            room : room,
            black : 'abc',
            white : 'xyz',
            pgn : pgn
        })
        // newGame.save();

    })
})

io.sockets.on('connection', function AllConnected(socket) {

    console.log("New socket connected : " + socket.id);
    socket.on('readyMatch', function () {
        if (!PmatchMake.includes(socket)) {
            PmatchMake.push(socket);
            //console.log(PmatchMake)
            if (PmatchMake.length > 1) {
                PmatchMake[0].emit('roomName', 'room' + nRooms)
                PmatchMake[1].emit('roomName', 'room' + nRooms)

                games[nRooms] = {
                    white: null,
                    black: null,
                    room: 'room' + nRooms
                };

                PmatchMake.shift()
                PmatchMake.shift()
                nRooms++;
            }
        }

    })

})