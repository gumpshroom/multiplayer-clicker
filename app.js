
var app = require('http').createServer(response);
var fs = require('fs');
var io = require('socket.io')(app);
/*app.get('/', function(req, res){
  console.log(req.url)
  try {
    if (fs.existsSync(req.url)) {
      res.sendFile(__dirname + req.url);
    }
  } catch(err) {
    console.error(err)
  }


});*/
async function response(req, res) {
  var file = "";
  if(req.url === "/") {
      file = __dirname + "/index.html"
  } else {
      file = __dirname + req.url;
  }


  fs.readFile(file,
      function (err, data) {
        if (err) {
          res.writeHead(404);
          return res.end('Page or file not found');
        }
        res.writeHead(200);
        res.end(data);
      }
  );

}
app.listen(process.env.PORT || 3000);
io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});
/*http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});*/
