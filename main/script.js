import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js"
import { getDatabase, ref, set, onValue, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js"

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

const createBtn = document.getElementById('makeRoomBtn');
const roomCodeInput = document.getElementById('roomCode');

createBtn.onclick = async () => {
    const roomId = Math.floor(10000 + Math.random() * 90000).toString();

    const hostToken = self.crypto.randomUUID();
    localStorage.setItem(`qitHostToken_${roomId}`, hostToken);

    try {
        await set(ref(db, `rooms/${roomId}`), {
            hostName: "TestNameA",
            hostAction: {
                hostToken: hostToken
            },
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
            quizList: {},
            player: {},
            winner: false
        });

        window.location.href = `../host/index.html?rid=${roomId}`;

    } catch (e) { }
};

const inputs = document.querySelectorAll(".digit-input");

inputs.forEach((input, index) => {
    
    input.addEventListener("click", () => {
        input.select();
    });

    input.addEventListener("input", async (e) => {
        if (input.value.length >= 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
        }

        const roomId = Array.from(inputs).map(i => i.value.trim()).join('');

        if (roomId.length === 5) {
            try {
                const roomRef = ref(db, `rooms/${roomId}`);
                const snapshot = await get(roomRef);
                if (snapshot.exists()) {
                    window.location.href = `../host/index.html?rid=${roomId}`;
                } else {
                    inputs.forEach(i => i.value = "");
                    inputs[0].focus();
                }
            } catch (e) {
                console.error("Firebase Error:", e);
            }
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value.length === 0 && index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].select();
        } else if (e.key === "ArrowRight" && index < inputs.length - 1) {
            e.preventDefault();
            inputs[index + 1].focus();
            inputs[index + 1].select();
        } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputs[index - 1].focus();
            inputs[index - 1].select();
        }
    });
});