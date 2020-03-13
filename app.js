var app = require('http').createServer(response);
var fs = require('fs');
var io = require('socket.io')(app);
var ids = []
var queue = ""
var games = []
var sockets = []

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
    if (req.url === "/") {
        file = __dirname + "/game.html"
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
io.on('connection', function (socket) {
    sockets.push(socket)

    ids.push(socket.id)
    socket.on('disconnect', function() {
        var currentGame = findObjectByKey(games, "p1", socket.id) || findObjectByKey(games, "p2", socket.id)
        if(currentGame) {
            if(socket.id === currentGame.p1) {
                findObjectByKey(sockets, "id", currentGame.p2).emit("oppdisconnect")
            } else {
                findObjectByKey(sockets, "id", currentGame.p1).emit("oppdisconnect")
            }
            games.splice(games.indexOf(currentGame), 1)
        }
        var p = ids.indexOf(socket.id);
        sockets.splice(p, 1)
        var i = sockets.indexOf(socket);
        sockets.splice(i, 1);
    });
    socket.on("startQueue", function () {

        if (queue === "" || queue === socket.id) {
            queue = socket.id;
            console.log(queue)
            console.log(ids)
            socket.emit("queueing")
        } else {
            var otherUser = queue
            queue = ""
            var newGame = {
                p1: socket.id,
                p2: otherUser,
                p1score: 0,
                p2score: 0,
                targetX: getRandomInt(50, 280),
                targetY: getRandomInt(50, 280)
            }
            games.push(newGame)
            socket.emit("joinedGame", newGame, socket.id)
            findObjectByKey(sockets, "id", otherUser).emit("joinedGame", newGame, otherUser)
        }

    })
    socket.on("clicked", function(mouseX, mouseY) {
        var currentGame = findObjectByKey(games, "p1", socket.id) || findObjectByKey(games, "p1", socket.id)
        if(currentGame) {
            var clickedPlayer
            if(findObjectByKey(games, "p1", socket.id)) {
                clickedPlayer = findObjectByKey(games, "p1", socket.id).p1
            } else {
                clickedPlayer = findObjectByKey(games, "p2", socket.id).p2
            }
            var square = generateSquareWithCenter(currentGame.targetX, currentGame.targetY, 15)
            console.log(square)
        }
    })
});

/*http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});*/
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function objArrayToString(arr) {
    var string = "[";
    for (var i = 0; i < arr.length; i++) {
        if (i != arr.length - 1) {
            string += JSON.stringify(arr[i]) + ", "
        } else {
            string += JSON.stringify(arr[i])
        }
    }
    string += "]";
    return string
}

function numberWithCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
function generateSquareWithCenter(x, y, radius) {
    var square = {
        x1: x - radius,
        y1: y - radius,
        x2: x + radius,
        y2: y + radius
    }
    return square
}
