var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

// Render will automatically provide the port, or it defaults to 4443
var serverPort = (process.env.PORT || 4443);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Helper function to find who is in a room
function socketIdsInRoom(name) {
  var room = io.sockets.adapter.rooms[name];
  if (room) {
    return Object.keys(room);
  } else {
    return [];
  }
}

io.on('connection', function(socket){
  console.log('A player connected!');
  
  socket.on('disconnect', function(){
    console.log('A player disconnected.');
    if (socket.room) {
      io.to(socket.room).emit('leave', socket.id);
      socket.leave(socket.room);
    }
  });

  // When a player wants to join a game room
  socket.on('join', function(name, callback){
    console.log('Player joining room:', name);
    var socketIds = socketIdsInRoom(name);
    callback(socketIds);
    socket.join(name);
    socket.room = name;
  });

  // When a player sends game data to another player
  socket.on('exchange', function(data){
    data.from = socket.id;
    var emitTo = io.sockets.connected[data.to];
    if (emitTo) {
      emitTo.emit('exchange', data);
    }
  });
});

server.listen(serverPort, function(){
  console.log('Server is officially up and running!');
});
