var socket = io();
var pcode = 0;
var w = window
w.findClickPos = function(e) {
  var posx, posy;
  posx = 0;
  posy = 0;
  if (!e) e = window.event;
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  return {
    x: posx,
    y: posy
  };
};
socket.on("joinedGame", function(gameData, p) {
  setScreen("game_screen")
  setPosition("circle", gameData.targetX, gameData.targetY)
  if(gameData.p1 === p) {
    pcode = 1
    setText("yourScore", gameData.p1score)
    setText("theirScore", gameData.p2score)
  } else {
    pcode = 2
    setText("yourScore", gameData.p2score)
    setText("theirScore", gameData.p1score)
  }
})
socket.on("queueing", function() {
  setText("start_button", "waiting p2...")
})
onEvent("start_button", "click", function() {
  socket.emit("startQueue")
});
onEvent("circle", "click", function(e) {
  var pos = window.findClickPos(e)
  console.log(pos.x)
  socket.emit("clicked", pos.x, pos.y)
});
onEvent("background", "click", function() {
  setScreen("lose_screen");
});
onEvent("playAgain_button", "click", function() {
  setScreen("welcome_screen");
});
onEvent("tryAgain_button", "click", function() {
  setScreen("welcome_screen");
});
