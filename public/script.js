
var IamWhite ;
var resign = 0; // 1 for white, -1 for black

var socket;
var firstTimeConnected = true;

socket = io.connect('http://localhost:3000');

socket.on('movemade',updatePos);

function updatePos(pgn) {
  console.log("Other played " + pgn)
  game.load_pgn(pgn)
  board.position(game.fen())
  updateStatus()
  
}
const resignButton = document.getElementById("resign")

resignButton.addEventListener("click",function Iresign(){
  resign = 1;
  updateStatus()
  socket.emit('sendresign', roomName, IamWhite, game.pgn())
  resignButton.disabled = true
})

socket.on('recresign',function updateresign(color){
    if(color == true)
    resign = 1
    if(color == false)
    resign = -1
    updateStatus()
    resignButton.disabled = true
})

function moveMade() {
  console.log(game.pgn());
  
  socket.emit('movemade', roomName, game.pgn());
}

var board = null
var game = new Chess()
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
var $status = $('#status')
var $pgn = $('#pgn')

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
  
}

function onDragStart (source, piece) {
  if((game.turn() === 'w' && IamWhite === false) ||
  (game.turn() === 'b' && IamWhite === true) ){
    return false;
  }
  
  if(resign == 1 || resign == -1) return false

  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  removeGreySquares()

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'
  updateStatus()
  moveMade()
}

function onMouseoverSquare (square, piece) {

  if((game.turn() === 'w' && IamWhite === false) ||
  (game.turn() === 'b' && IamWhite === true) ){
    return ;
  }

  if(resign == 1 || resign == -1) return 

  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
    resignButton.disabled = true // disable the resign button when a player is in checkmate
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  if(resign == 1){
    status = 'White resigned the game'
  }
  if(resign == -1){
    status = 'Black resigned the game'
  }

  $status.html(status)
  $pgn.html(game.pgn())
}
socket.on('updatepgn',updatePos)
var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

board = Chessboard('myBoard', config)
updateStatus()


//socket.on('updatepgn',updatePos)

if(firstTimeConnected) {
  socket.emit('connectedToRoom', roomName);
  firstTimeConnected = false;
  // game.load_pgn(roomPgn)
  // board.position(game.fen())
}

socket.on('piececolor',function(str){
  if(str == 'w'){
    board.orientation('white');
    IamWhite = true;
  }
  
  if(str == 'b'){
    board.orientation('black');
    IamWhite = false;
  }
  
})









