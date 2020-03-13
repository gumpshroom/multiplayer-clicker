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
                io.to(`${currentGame.p2}`).emit("oppdisconnect")
            } else {
                io.to(`${currentGame.p1}`).emit("oppdisconnect")
            }
            games.splice(games.indexOf(currentGame), 1)
        }
        if(queue === socket.id) {
            queue = ""
        }
        var p = ids.indexOf(socket.id);
        sockets.splice(p, 1)
        var i = sockets.indexOf(socket);
        sockets.splice(i, 1);
    });
    socket.on("startQueue", function () {

        if (queue === "" || queue === socket.id) {
            queue = socket.id;
            //console.log(queue)
            //console.log(ids)
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
                targetY: getRandomInt(50, 280),
                timeRemaining: 60000
            }
            setInterval(function() {
                var tempGame = findObjectByKey(games, "p1", socket.id)
                tempGame.timeRemaining -= 1000
                socket.emit("update", tempGame, socket.id)
                io.to(`${tempGame.p2}`).emit("update", tempGame, tempGame.p2)
                if(tempGame.timeRemaining === 0) {
                    finishGame(socket.id)
                    clearInterval(this)
                }
            }, 1000)
            games.push(newGame)
            socket.emit("joinedGame", newGame, socket.id)
            //console.log(otherUser)
            //console.log(sockets)
            io.to(`${otherUser}`).emit("joinedGame", newGame, otherUser)
        }

    })
    socket.on("clicked", function(mouseX, mouseY) {
        var currentGame = findObjectByKey(games, "p1", socket.id) || findObjectByKey(games, "p2", socket.id)
        if(currentGame) {
            var clickedPlayer
            var clickedPlayerNum = 0;
            if(findObjectByKey(games, "p1", socket.id)) {
                clickedPlayer = findObjectByKey(games, "p1", socket.id).p1
                clickedPlayerNum = 1
            } else {
                clickedPlayer = findObjectByKey(games, "p2", socket.id).p2
                clickedPlayerNum = 2
            }
            var square = generateSquareWithCenter(currentGame.targetX, currentGame.targetY, 15)
            if(mouseX >= square.x1 && mouseY >= square.y1 && mouseX <= square.x2 && mouseY <= square.y2) {
                //console.log("wow")
                currentGame.targetX = getRandomInt(50, 280)
                currentGame.targetY = getRandomInt(50, 280)
                if(clickedPlayerNum === 1) {
                    currentGame.p1score ++
                    io.to(`${currentGame.p2}`).emit("update", currentGame, currentGame.p2)
                } else {
                    currentGame.p2score ++
                    io.to(`${currentGame.p1}`).emit("update", currentGame, currentGame.p1)
                }
                socket.emit("update", currentGame, clickedPlayer)
            } else {
                if(clickedPlayerNum === 1) {
                    currentGame.p1score --
                    io.to(`${currentGame.p2}`).emit("update", currentGame, currentGame.p2)
                } else {
                    currentGame.p2score --
                    io.to(`${currentGame.p1}`).emit("update", currentGame, currentGame.p1)
                }
                socket.emit("update", currentGame, clickedPlayer)
            }
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
        x1: x,
        y1: y,
        x2: x + radius * 2,
        y2: y + radius * 2
    }
    return square
}
function finishGame(p1) {
    var currentGame = findObjectByKey(games, "p1", p1)
    var gameoverdata = {
        p1: currentGame.p1,
        p2: currentGame.p2,
        p1score: currentGame.p1score,
        p2score: currentGame.p2score
    }
    if(currentGame.p1score > currentGame.p2score) {
        gameoverdata.judgement = "player 1 wins"
    } else if(currentGame.p2score > currentGame.p1score) {
        gameoverdata.judgement = "player 2 wins"
    } else {
        gameoverdata.judgement = "tie"
    }
    io.to(`${currentGame.p1}`).emit("gameover", gameoverdata)
    io.to(`${currentGame.p2}`).emit("gameover", gameoverdata)
    games.splice(games.indexOf(currentGame), 1)

}
