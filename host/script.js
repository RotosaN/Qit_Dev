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
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const db = getDatabase(app)

let myPlayerId
const url = new URL(window.location.href)
const roomId = url.searchParams.get("rid")

const ansSound = new Audio("sound/ans.mp3")
const correctSound = new Audio("sound/correct.mp3")
const wrongSound = new Audio("sound/wrong.mp3")

document.querySelectorAll(".customSelect").forEach(customSelect => {

    const selected = customSelect.querySelector(".selected")
    const options = customSelect.querySelectorAll(".option")
    const hiddenInput = customSelect.querySelector("input")

    selected.addEventListener("click", () => {

        document.querySelectorAll(".customSelect").forEach(el => {
            if (el !== customSelect) {
                el.classList.remove("open")
            }
        })
        customSelect.classList.toggle("open")
    })

    options.forEach(option => {

        option.addEventListener("click", () => {

            const text = option.textContent
            const value = option.dataset.value

            selected.textContent = text

            if (hiddenInput) {
                hiddenInput.value = value
            }

            options.forEach(o => {
                o.classList.remove("selectedOption")
            })

            option.classList.add("selectedOption")

            customSelect.classList.remove("open")
        })

    })

})

document.addEventListener("click", (e) => {


    document.querySelectorAll(".customSelect").forEach(customSelect => {

        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove("open")
        }

    })

})


const nameInputModal = document.getElementById("nameInputModal")
const playerNameInput = document.getElementById("playerNameInput")
const entrySubmitBtn = document.getElementById("entrySubmitBtn")

document.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem("qitPlayerName")
    if (savedName) {
        playerNameInput.value = savedName
    }
    nameInputModal.classList.add("active")
})

entrySubmitBtn.addEventListener("click", () => {

    const enteredName = playerNameInput.value.trim()
    if (enteredName === "") {
        alert("名前を入力してください。")
        return
    }
    localStorage.setItem("qitPlayerName", enteredName)
    nameInputModal.classList.remove("active")


    const savedPlayerId = localStorage.getItem("qitPlayerUUID")
    if (!savedPlayerId) {
        const uuid = self.crypto.randomUUID()
        localStorage.setItem("qitPlayerUUID", uuid)
    }

    const path = ref(db, `rooms/${roomId}/player/${localStorage.getItem("qitPlayerUUID")}`)

    const iPlayerData = {
        name: enteredName,
        o: 0,
        x: 0,
        point: 0,
        life: 0,
        boardans: false,
        x: 0,
        y: 0,
        freeze: 0,
        isPushing: false,
        pushedAt: 0,
        isHost: false,
        rank: 0,
    }

    console.log("initital")

    setPlayerData()

    try {
        set(path, iPlayerData)
    } catch (error) { }

})

playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        entrySubmitBtn.click()
    }
})

function copy() {
    const targetCode = document.getElementById("roomidText")
    navigator.clipboard.writeText(targetCode)
}

let playedAnsSound = false;



let lastPlayedActionId = "";

onValue(ref(db, `rooms/${roomId}/hostAction`), (snapshot) => {
    const hostData = snapshot.val();
    if (!hostData || !hostData.timestamp) return; 

    const currentActionId = `${hostData.action}_${hostData.timestamp}`;
    if (lastPlayedActionId === currentActionId) {
        return; 
    }

    if (hostData.action === "wrong") {
        console.log("★本当のWrong検知");
        lastPlayedActionId = currentActionId;
        
        wrongSound.currentTime = 0;
        wrongSound.play()
            .then(() => console.log("🔊 Wrongサウンドの再生に成功しました！"))
            .catch(e => console.error("❌ Wrongサウンドの再生に失敗:", e));
    }

    if (hostData.action === "correct") {
        console.log("★本当のCorrect検知");
        lastPlayedActionId = currentActionId;
        
        correctSound.currentTime = 0;
        correctSound.play()
            .then(() => console.log("🔊 Correctサウンドの再生に成功しました！"))
            .catch(e => console.error("❌ Correctサウンドの再生に失敗:", e));
    }
});


onValue(ref(db, "rooms/43143/player"), (snapshot) => {
    const playersData = snapshot.val();
    if (!playersData) return;

    setPlayerData(playersData);

    const hasRankOne = Object.values(playersData).some(player => player.rank == 1);

    if (hasRankOne) {
        if (!playedAnsSound) {
            ansSound.currentTime = 0;
            ansSound.play();
            playedAnsSound = true;
        }
    } else {
        playedAnsSound = false;
    }
});

function setPlayerData(playersData) {
    const mainObjContainer = document.querySelector('.mainObj');
    if (!mainObjContainer || !playersData) return;

    Object.entries(playersData).forEach(([playerId, player]) => {
        let svgObj = mainObjContainer.querySelector(`[data-id="${playerId}"]`);

        if (svgObj) {
            const svgDoc = svgObj.getSVGDocument();
            if (svgDoc) updatePlayerSvg(svgDoc, playerId, player);
        } else {
            svgObj = document.createElement('object');
            svgObj.setAttribute('data', 'img/ox.svg');
            svgObj.setAttribute('type', 'image/svg+xml');
            svgObj.classList.add('player');
            svgObj.dataset.id = playerId;
            mainObjContainer.appendChild(svgObj);

            svgObj.addEventListener('load', () => {
                const svgDoc = svgObj.getSVGDocument();
                if (svgDoc) updatePlayerSvg(svgDoc, playerId, player);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    const roomidtext = document.getElementById('roomidText');
    roomidtext.textContent = roomId
});

function updatePlayerSvg(svgDoc, playerId, player) {
    const playerNameObj = svgDoc.getElementById('playerName');
    if (playerNameObj) playerNameObj.textContent = player.name;

    const slashNum = svgDoc.getElementById('slashNum');
    const lamplit = svgDoc.getElementById('lamp');

    if (player.rank != 0) {
        const rankColor = ["#edc500", "#939393", "#c97c2a", "#282828"];
        if (slashNum) {
            slashNum.setAttribute("fill", rankColor[Math.min(player.rank - 1, 3)]);
            slashNum.textContent = getOrdinal(player.rank);
        }

        if (player.rank == 1 && lamplit) {
            lamplit.classList.add("blink");
        }
    } else {
        if (slashNum) slashNum.textContent = "";
        if (lamplit) lamplit.classList.remove("blink");
    }
}
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}



window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
        const playerRef = ref(db, `rooms/${roomId}/player/${localStorage.getItem("qitPlayerUUID")}`)
        update(playerRef, {
            isPushing: true,
            pushedAt: serverTimestamp()
        })
    }

    if (event.key === 'o' && event.target.tagName !== 'INPUT') {
        const playerRef = ref(db, `rooms/${roomId}/player/${localStorage.getItem("qitPlayerUUID")}`)
        update(playerRef, {
            isPushing: true,
            pushedAt: serverTimestamp()
        })
    }

    if (event.key === 'x' && event.target.tagName !== 'INPUT') {
        const playerRef = ref(db, `rooms/${roomId}/player/${localStorage.getItem("qitPlayerUUID")}`)
        update(playerRef, {
            isPushing: true,
            pushedAt: serverTimestamp()
        })
    }
})




let currentPlayersData = {};

onValue(ref(db, `rooms/${roomId}/player`), (snapshot) => {
    const playersData = snapshot.val();
    if (!playersData) return;

    currentPlayersData = playersData; 
    setPlayerData(playersData);

    const hasRankOne = Object.values(playersData).some(player => player.rank == 1);

    if (hasRankOne) {
        if (!playedAnsSound) {
            ansSound.currentTime = 0;
            ansSound.play();
            playedAnsSound = true;
        }
    } else {
        playedAnsSound = false;
    }
});

let isSubmitting = false;

window.addEventListener('keydown', (event) => {
    const myId = localStorage.getItem("qitPlayerUUID");
    if (!myId || !currentPlayersData[myId]) return;

    if (currentPlayersData[myId].rank !== 0) {
        return; 
    }

    if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
        if (isSubmitting) return;
        isSubmitting = true;

        const playerRef = ref(db, `rooms/${roomId}/player/${myId}`);
        update(playerRef, {
            isPushing: true,
            pushedAt: serverTimestamp()
        }).then(() => {
            setTimeout(() => { isSubmitting = false; }, 1000);
        }).catch(() => {
            isSubmitting = false;
        });
    }
});

$(document).on("click", ".correctButton, .wrongButton, .throughButton", function() {
    const activePlayerId = Object.keys(currentPlayersData).find(
        id => currentPlayersData[id] && currentPlayersData[id].rank === 1
    );

    let actionType = "";
    if ($(this).hasClass("correctButton")) actionType = "correct";
    if ($(this).hasClass("wrongButton")) actionType = "wrong";
    if ($(this).hasClass("throughButton")) actionType = "through";

    if (actionType !== "through" && !activePlayerId) {
        alert("現在、解答権を持っている（1stの）プレイヤーがいません。");
        return;
    }

    let myHostToken = localStorage.getItem(`qitHostToken_${roomId}`);
    if (!myHostToken) {
        myHostToken = self.crypto.randomUUID();
        localStorage.setItem(`qitHostToken_${roomId}`, myHostToken);
    }

    const hostActionRef = ref(db, `rooms/${roomId}/hostAction`);
    
    update(hostActionRef, {
        action: actionType,
        targetPlayerId: activePlayerId || "none",
        timestamp: serverTimestamp(),
        token: myHostToken 
    }).then(() => {
        console.log(`${actionType} アクションを送信しました。`);
    }).catch((error) => {
        console.error("ホスト権限がありません:", error);
    });
});