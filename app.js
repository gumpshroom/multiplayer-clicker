var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  if(req.url == "/socket.io/socket.io.js") {
    res.writeHead(200, {"Content-Type": "text/plain"})
  }
  res.sendFile(__dirname + '/index.html');

});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
