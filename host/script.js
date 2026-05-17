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
        uuid = self.crypto.randomUUID()
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
        isHost: false
    }

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
    var targetCode = document.getElementById("roomidText")
    navigator.clipboard.writeText(targetCode)
    alert("コピーしました！")
}

onValue(ref(db, "rooms/43143/player"), (snapshot) => {
    setPlayerData()
    console.log(`a`)
})


function setPlayerData() {

    get(ref(db, "rooms/43143/player")).then((snapshot) => {
        const playersData = snapshot.val()
        if (!playersData) return
        console.log(playersData)

        const mainObjContainer = document.querySelector('.mainObj')

        console.log(playersData)

        const playerData = Object.entries(playersData)

        Object.entries(playersData).forEach(([playerId, player]) => {

            let svgObj = mainObjContainer.querySelector(`[data-id="${playerId}"]`);

            if (svgObj) {
                const svgDoc = svgObj.getSVGDocument()
                updatePlayerSvg(svgDoc, playerId, player)
            } else {
                svgObj = document.createElement('object')
                svgObj.setAttribute('data', 'img/ox.svg')
                svgObj.setAttribute('type', 'image/svg+xml')
                svgObj.setAttribute('data-id', localStorage.getItem("qitPlayerUUID"))
                svgObj.classList.add('player')
                svgObj.dataset.id = playerId
                mainObjContainer.appendChild(svgObj)

                console.log(player)

                svgObj.addEventListener('load', () => {
                    const svgDoc = svgObj.getSVGDocument()
                    updatePlayerSvg(svgDoc, playerId, player)
                })
            }

        })
    })
}

function updatePlayerSvg(svgDoc, playerId, player) {
    const playerNameObj = svgDoc.getElementById('playerName')
    playerNameObj.textContent = player.name
}



window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
        
        ansSound.currentTime = 0;
        ansSound.play()

        const playerRef = ref(db, `rooms/${roomId}/player/${localStorage.getItem("qitPlayerUUID")}`)

        update(playerRef, {
            isPushing: true,
            pushedAt: serverTimestamp()
        }).then(() => {
            console.log("早押しボタンが押されました！")
        }).catch((error) => {
            console.error("送信失敗:", error)
        })
    }
})