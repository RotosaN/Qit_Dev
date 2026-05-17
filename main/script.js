import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDoPV7LFkGhG8qBGVHa-YwmP4L2ycghdRc",
    authDomain: "qit-hayaoshi-database.firebaseapp.com",
    databaseURL: "https://qit-hayaoshi-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "qit-hayaoshi-database",
    storageBucket: "qit-hayaoshi-database.firebasestorage.app",
    messagingSenderId: "457647660304",
    appId: "1:457647660304:web:663017b8846e8e0ddad995",
    measurementId: "G-WZ5EW3P7KF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

const createBtn = document.getElementById('createRoomBtn');
const roomCodeInput = document.getElementById('roomCode');

roomCodeInput.addEventListener('input', async () => {
    const roomId = roomCodeInput.value.trim();
    if (roomId.length == 5){
        try {
            const roomRef = ref(db, `rooms/${roomId}`);
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                window.location.href = `../host/index.html?rid=${roomId}`;
            } else {
                roomCodeInput.value = "";
            }
        } catch (e) {}
    }
});

// 部屋を作るボタンの処理（既存）
createBtn.onclick = async () => {
    const roomId = Math.floor(10000 + Math.random() * 90000).toString();

    try {
        await set(ref(db, `rooms/${roomId}`), {
            hostName: "TestNameB",
            status: "waiting",
            createdAt: Date.now(),
            roomRule: {
                rule: "ox",
                ansRule: "push",
                winO: 7,
                lostX: 3,
                winPoint: false,
                customRule: {
                    correct: { o: 1 },
                    incorrect: { x: 1 }
                }
            },
            questionData: {},
            player: {
                "uid_example_alex": {
                    isHost: true,
                    playerName: "Alex",
                    o: 0,
                    x: 0,
                    point: 0,
                    boardAns: false,
                    freeze: 0
                },
            },
            slashData: {
                "player1": { pushDate: Date.now() },
                "player2": { pushDate: Date.now() + 100 }
            },
            winner: "player2"
        });

        window.location.href = `../host/index.html?rid=${roomId}`;

    } catch (e) { }
};