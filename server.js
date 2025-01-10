const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const words = ['elma', 'armut', 'kiraz', 'muz', 'çilek', 'şeftali', 'karpuz', 'üzüm', 'nar', 'incir'];

let players = [];
let gameStarted = false;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Yeni oyuncu bağlandı:', socket.id);

    if (players.length < 2) {
        players.push(socket.id);
         io.emit('updatePlayers', players);
    } else {
        socket.emit('lobbyFull', 'Lobi şu anda dolu. Başka bir zaman tekrar deneyin.');
        return;
    }
    socket.on('disconnect', () => {
        console.log('Oyuncu ayrıldı:', socket.id);
        players = players.filter(id => id !== socket.id);
        io.emit('updatePlayers', players);
        if (gameStarted) {
            resetGame();
        }
    });

     socket.on('startGame', () => {
        if (players.length === 2 && !gameStarted) {
             gameStarted = true;
            const randomWord = words[Math.floor(Math.random() * words.length)];
            io.emit('gameStarted', {
                word: randomWord,
                player1: players[0],
                player2: players[1],
            });
        } else {
             socket.emit('error', 'Oyun başlatılamadı. İki oyuncu gereklidir veya oyun zaten başlamış.');
        }
    });
    socket.on('submitSentence', (data) => {
        const sentenceCount = (data.sentence.match(/\./g) || []).length;
        if (sentenceCount < 3 || sentenceCount > 5) {
            socket.emit('error', 'Cümle 3 ila 5 arasında olmalı!');
            return;
        }
        io.emit('sentenceReceived', {playerId: socket.id, sentence: data.sentence});
    });
});

function resetGame() {
    gameStarted = false;
    io.emit('gameReset');
    console.log("Oyun resetlendi.");
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});