import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js"
import { getDatabase, ref, set, onValue, get, update, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js"
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

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
const auth = getAuth(app);

let currentUid = null;

const gameRules = [
    {
        ruleName: "Free ○×",
        id: "freeox",
        ruleOverView: "勝利条件なし、○と×の数が記録されるルールです。",
        playerCard: "ox"
    },
    {
        ruleName: "Free Point",
        id: "freepoint",
        ruleOverView: "勝利条件なし、ポイントが記録されるルールです。",
        playerCard: "point",
        parameters: [
            {id: "correctPoint", inputPosition: 3, text: "正解時ポイント", default: 1},
            {id: "lostX", inputPosition: 3, text: "誤答時ポイント", default: -1},
        ]
    },
    {
        ruleName: "N○M×",
        id: "nomx",
        ruleOverView: "N○に達したら勝ち抜け、M×に達すると失格する、基本的なルールです。",
        playerCard: "ox",
        parameters: [
            {id: "wonO", inputPosition: "front", text: "○で勝ち抜け", default: 7 },
            {id: "lostX", inputPosition: "front", text: "×で失格", default: 3 }
        ]
    },
    {
        ruleName: "N+/M-",
        id: "npmm",
        ruleOverView: "正解でNポイント加点、誤答でMポイント減点される、基本的なルールです。",
        playerCard: "point",
        parameters: [
            {id: "correctPoint", inputPosition: 3, text: "正解時ポイント", default: 1},
            {id: "lostX", inputPosition: 3, text: "誤答時ポイント", default: -1},
            {id: "wonPoint", inputPosition: "front", text: "ポイントで勝ち抜け", default: 10}
        ]
    },
    {
        ruleName: "X by Y",
        id: "xbyy",
        ruleOverView: "正解で加点されるXに、誤答で減点されるYを乗じた数Zがスコアになるルールです。Yが0になると失格します。",
        playerCard: "xyz",
        parameters: [
            {id: "startX", inputPosition: "back", text: "スタート時のX", default: 0},
            {id: "startY", inputPosition: "back", text: "スタート時のY", default: 10},
            {id: "correctX", inputPosition: 3, text: "正解時X", default: 1},
            {id: "correctY", inputPosition: 3, text: "誤答時Y", default: -1},
            {id: "winZ", inputPosition: 2, text: "Zがで以上で勝ち抜け", default: 100}
        ]
    },
    {
        ruleName: "Swedish N",
        id: "swedishn",
        ruleOverView: "正解を積み重ねるほど誤答時の×の数が増加するルールです。",
        playerCard: "ox",
        parameters: [
            {id: "wonO", inputPosition: "front", text: "○で勝ち抜け", default: 10 },
            {id: "lostX", inputPosition: "front", text: "×で勝ち抜け", default: 10 },
            {id: "damage_", inputPosition: 3, text: "誤答時○以上で+1×", default: 1, type: "increasable"}
        ]
    },
    {
        ruleName: "Freeze N",
        id: "freezen",
        ruleOverView: "正解で+1ポイント、Nポイントに達すると勝ち抜け、誤答で正解数の分フリーズ（お休み）状態になるルールです。",
        playerCard: "point",
        parameters: [
            { id: "wonPoint", inputPosition: "front", text: "ポイントで勝ち抜け", default: 10 },
        ],
    },
    {
        ruleName: "N up down",
        id: "nupdown",
        ruleOverView: "テレビ番組「アップダウンクイズ」に由来するルールで、正解で1ポイント、誤答で0ポイントにリセット、Nポイントに達したら勝ち抜けるルールです。",
        playerCard: "point",
        parameters: [
            { id: "wonPoint", inputPosition: "front", text: "ポイントで勝ち抜け", default: 10, },
        ],
    },
    {
        ruleName: "Exclude",
        id: "exclude",
        ruleOverView: "誤答した時、別のプレイヤーが誤答するまでLOCK状態になるルールです。",
        playerCard: "point",
        parameters: [
            { id: "wonPoint", inputPosition: "front", text: "ポイントで勝ち抜け", default: 5, },
        ],
    },
    {
        ruleName: "N Star",
        id: "nstar",
        ruleOverView: "正解でNポイント、誤答で点数の一の位を切り捨て（一の位が0場合、-10ポイント。また、0ptの場合はフリーズ（お休み）状態になる）、スターを1つ削るルールです。スターが0個になったら失格します。",
        playerCard: "point-star",
        parameters: [
            { id: "wonPoint", inputPosition: "front", text: "ポイントで勝ち抜け", default: 7 },
            { id: "correctPoint", inputPosition: 3, text: "正解時ポイント", default: 7 },
            { id: "life", inputPosition: 5, text: "スタート時スター", default: 7 },
            { id: "freeze", inputPosition: 9, text: "0ポイントの誤答で問休み", default: 3 }
        ],
    }
]

signInAnonymously(auth)
    .then(() => {})
    .catch((error) => {
        console.error("匿名ログインに失敗しました:", error);
    });

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUid = user.uid;
        console.log("ユーザーIDが確定しました:", currentUid);
    }
});

let myPlayerId
const url = new URL(window.location.href)
const roomId = url.searchParams.get("rid")

const ansSound = new Audio("sound/ans.mp3")
const correctSound = new Audio("sound/correct.mp3")
const wrongSound = new Audio("sound/wrong.mp3")

let firstPlayer = false

function initRuleUI() {
    const ruleSelect = document.getElementById("ruleSelect");
    const selectedRuleName = document.getElementById("selectedRuleName");
    const ruleOptionsContainer = document.getElementById("ruleOptions");

    if (!ruleSelect || !selectedRuleName || !ruleOptionsContainer) return;

    ruleOptionsContainer.innerHTML = "";

    gameRules.forEach((rule, index) => {
        const option = document.createElement("div");
        option.className = "option";
        option.dataset.value = rule.id;
        option.textContent = rule.ruleName;

        option.addEventListener("click", (e) => {
            e.stopPropagation();

            ruleOptionsContainer.querySelectorAll(".option").forEach(o => o.classList.remove("selectedOption"));
            option.classList.add("selectedOption");

            selectRule(rule);

            ruleSelect.classList.remove("open");
        });

        ruleOptionsContainer.appendChild(option);
    });

    selectedRuleName.addEventListener("click", (e) => {
        e.stopPropagation();
        ruleSelect.classList.toggle("open");
    });

    if (gameRules.length > 2) {
        const defaultOption = ruleOptionsContainer.children[2];
        if (defaultOption) {
            defaultOption.classList.add("selectedOption");
            selectRule(gameRules[2]);
        }
    }
}

$('#checkFreeze').on('change', function() {
    if (!isHost) return;
    const isChecked = $(this).is(':checked');

});

function selectRule(rule) {
    const selectedRuleName = document.getElementById("selectedRuleName");
    const ruleTypeInput = document.getElementById("ruleType");
    const ruleOverviewText = document.getElementById("ruleOverviewText");
    const parametersContainer = document.getElementById("parametersContainer");

    if (selectedRuleName) selectedRuleName.textContent = rule.ruleName;
    if (ruleTypeInput) ruleTypeInput.value = rule.id;
    if (ruleOverviewText) ruleOverviewText.textContent = rule.ruleOverView;
    if (parametersContainer) parametersContainer.innerHTML = ""; // 前のパラメータを消去

    if (!rule.parameters) return;

    rule.parameters.forEach(param => {
        const text = param.text;
        const value = param.default !== undefined ? param.default : "";
        const pos = param.inputPosition;

        const inputField = `
            <div class="settingInput" style="--inputBoxWidth:100px">
                <input id="input_${param.id}" value="${value}" class="inputGameruleValue">
            </div>
        `;

        let html = `<div class="settingItem-left">`;

        if (pos === "front") {
            html += `${inputField}<p class="settingLabel" style="margin-left:10px;">${text}</p>`;
        } else if (pos === "back") {
            html += `<p class="settingLabel" style="margin-right:10px;">${text}</p>${inputField}`;
        } else if (typeof pos === "number") {
            const textBefore = text.slice(0, pos);
            const textAfter = text.slice(pos);

            if (textBefore) html += `<p class="settingLabel" style="margin-right:10px;">${textBefore}</p>`;
            html += inputField;
            if (textAfter) html += `<p class="settingLabel" style="margin-left:10px;">${textAfter}</p>`;
        }

        html += `</div>`;
        parametersContainer.insertAdjacentHTML("beforeend", html);
    });
}

document.addEventListener("click", (e) => {
    const ruleSelect = document.getElementById("ruleSelect");
    if (ruleSelect && !ruleSelect.contains(e.target)) {
        ruleSelect.classList.remove("open");
    }
});

const nameInputModal = document.getElementById("nameInputModal")
const playerNameInput = document.getElementById("playerNameInput")
const entrySubmitBtn = document.getElementById("entrySubmitBtn")

let isHost = false

onValue(ref(db, `rooms/${roomId}`), (snapshot) => {
    const roomData = snapshot.val();
    if (!roomData) return;
    const myUid = auth.currentUser ? auth.currentUser.uid : null;
    if (roomData.hostUid && myUid && roomData.hostUid === myUid) {
        isHost = true;
    }

    if (!isHost) {
        $("#settingsScreen").remove();
        $(".hostButtons").remove()
    }else{
        $(".buttonObj").remove()
        $(".hostbutton").show()
    }

    const Qnum = roomData.nowQNum

    if(!roomData.quizList || roomData.quizList.length == 0){
        $(".noQ").show();
        $(".question-box").hide();
    }else{
        $(".noQ").hide();
        $(".question-box").show();

        $("#totalQ").text(roomData.quizList.length-1)

        if(Qnum == 0){
            $(".q0").show();
            $(".question-box").hide();
        }else{
            $(".q0").hide();
            $(".question-box").show();

            $("#qText").text(roomData.quizList[Qnum].q)
            $("#ansText").text(roomData.quizList[Qnum].ans)
        }
    }

    $("#currentQ").text(Qnum)

});

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
        scorex: 0,
        scorey: 0,
        scorez: 0,
        freeze: 0,
        isPushing: false,
        pushedAt: 0,
        isHost: isHost,
        rank: 0,
        isWon: false,
        isLost: false
    }

    console.log("initital")
    setPlayerData()

    try {
        set(path, iPlayerData)
    } catch (error) { }
})

function copy() {
    const targetCode = document.getElementById("roomidText")
    navigator.clipboard.writeText(targetCode.textContent)
}

let playedAnsSound = false;
let lastPlayedActionId = "";

$('#submit').click(function() {
    console.log('ルール適用ボタンがクリックされました！');

    if (!isHost) {
        return;
    }

    const currentRuleId = $('.selectedOption').data('value'); 
    
    if (!currentRuleId) {
        alert("ルールが選択されていません。");
        return;
    }

    const ruleParameters = {};
    
    $('#parametersContainer .inputGameruleValue').each(function() {
        const fullId = $(this).attr('id');
        const paramKey = fullId.replace('input_', '');
        const paramValue = Number($(this).val());
        
        ruleParameters[paramKey] = paramValue;
    });

    const updateData = {
        rule: currentRuleId,
        customRule: ruleParameters
    };

    const roomRef = ref(db, `rooms/${roomId}/roomRule`);
    
    update(roomRef, updateData)
        .then(() => {
            console.log('Firebaseへのルール適用が成功しました！', updateData);
            alert('ルールを適用しました！');
        })
        .catch((error) => {
            console.error('Firebaseへの書き込みに失敗しました:', error);
            alert('ルールの適用に失敗しました。');
        });
});

$(window).on('load', function() {
    
    const buzzerObject = document.querySelector('.buzzerBtn');
    if (!buzzerObject) return;

    const svgDoc = buzzerObject.contentDocument;
    if (!svgDoc) return;

    const svgButton = svgDoc.getElementById('button');
    if (!svgButton) return;

    let isKeyPressed = false;


    $(window).on('keydown', function(e) {
        if (e.originalEvent.repeat) return;

        if (e.key === ' ' || e.key === 'Enter') {
            isKeyPressed = true;
            svgButton.classList.add('push');
        }
    });

    $(window).on('keyup', function(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            isKeyPressed = false;
            svgButton.classList.remove('push');
        }
    });
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

$('#parametersContainer').on('change', '.inputGameruleValue', function(e) {

    const hasId = this.id.replace("input_","")

    
});


document.addEventListener('DOMContentLoaded', (event) => {
    const roomidtext = document.getElementById('roomidText');
    if (roomidtext) roomidtext.textContent = roomId;

    const savedName = localStorage.getItem("qitPlayerName")
    if (savedName && playerNameInput) {
        playerNameInput.value = savedName
    }

    if (nameInputModal) nameInputModal.classList.add("active");
    initRuleUI();
});

function updatePlayerSvg(svgDoc, playerId, player) {
    const playerNameObj = svgDoc.getElementById('playerName');
    if (playerNameObj) playerNameObj.textContent = player.name;

    const slashNum = svgDoc.getElementById('slashNum');
    const lamplit = svgDoc.getElementById('lamp');
    const oCount = svgDoc.getElementById('oCount');
    const xCount = svgDoc.getElementById('xCount');

    if (oCount) oCount.textContent = player.o;
    if (xCount) xCount.textContent = player.x;

    const wonEl = svgDoc.getElementById('won');
    if (wonEl) {
        if (player.isWon) wonEl.classList.remove("hidden");
        else wonEl.classList.add("hidden");
    }

    const lostEl = svgDoc.getElementById('lost');
    if (lostEl) {
        if (player.isLost) lostEl.classList.remove("hidden");
        else lostEl.classList.add("hidden");
    }

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

let currentPlayersData = {};

window.addEventListener('keydown', (event) => {
    const myId = localStorage.getItem("qitPlayerUUID");
    if (!myId || !currentPlayersData[myId]) return;

    if (currentPlayersData[myId].rank !== 0) return;

    if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
        if (isSubmitting) return;
        isSubmitting = true;

        if (!playedAnsSound) {
            ansSound.currentTime = 0;
            ansSound.play().catch(e => console.log("自動再生ブロック:", e));
            playedAnsSound = true;
        }

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


onValue(ref(db, `rooms/${roomId}/player`), (snapshot) => {
    const playersData = snapshot.val();
    if (!playersData) return;

    currentPlayersData = playersData;
    setPlayerData(playersData);

    const myId = localStorage.getItem("qitPlayerUUID");
    
    const activePlayerId = Object.keys(playersData).find(
        id => playersData[id] && playersData[id].rank === 1
    );

    if (activePlayerId) {
        if (activePlayerId !== myId && !playedAnsSound) {
            console.log("他人が押した音を再生します");
            ansSound.currentTime = 0;
            ansSound.play().catch(e => console.log("自動再生ブロック:", e));
            playedAnsSound = true;
        }
    }
});

let isSubmitting = false;

$(document).on("click", ".correctButton, .wrongButton, .throughButton, .resetButtom", function () {
    this.blur();

    const activePlayerId = Object.keys(currentPlayersData).find(
        id => currentPlayersData[id] && currentPlayersData[id].rank === 1
    );

    let actionType = "";
    if ($(this).hasClass("correctButton")) actionType = "correct";
    if ($(this).hasClass("wrongButton")) actionType = "wrong";
    if ($(this).hasClass("throughButton")) actionType = "through";
    if ($(this).hasClass("throughButton")) actionType = "reset";

    if (actionType !== "through" && !activePlayerId) {
        return;
    }

    const hostActionRef = ref(db, `rooms/${roomId}/hostAction`);

    update(hostActionRef, {
        action: actionType,
        targetPlayerId: activePlayerId || "none",
        timestamp: Date.now(),
    }).then(() => {
        // switch (actionType) {
        //     case "correct": {
        //         correctSound.currentTime = 0;
        //         correctSound.play()
        //     } break

        //     case "wrong": {
        //         wrongSound.currentTime = 0;
        //         wrongSound.play()
        //     } break
        // }
    }).catch((error) => {
        console.error("ホスト権限がありません:", error);
    });
});

const hostActionRef = ref(db, `rooms/${roomId}/hostAction`);
let lastSoundTimestamp = 0;

onValue(hostActionRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (!data.timestamp || data.timestamp <= lastSoundTimestamp) {
        if (data.timestamp) lastSoundTimestamp = data.timestamp;
        return;
    }
    
    lastSoundTimestamp = data.timestamp;

    switch (data.action) {
        case "correct": {

            console.log("correctSoundPlayed")

            correctSound.currentTime = 0;
            correctSound.play().catch(e => console.log("自動再生ブロック:", e));
            playedAnsSound = false;
        } break;

        case "wrong": {

            console.log("wrongSoundPlayed")

            wrongSound.currentTime = 0;
            wrongSound.play().catch(e => console.log("自動再生ブロック:", e));
            playedAnsSound = false;
        } break;
        
    }
});

document.getElementById("csvFileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        const quizList = {};
        let qCount = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "") continue;

            const parts = line.split(",");

            if (parts.length >= 2) {
                const question = parts[0].trim();
                const answer = parts[1].trim();

                quizList[qCount] = {
                    q: question,
                    ans: answer
                };
                qCount++;
            }
        }

        const quizListRef = ref(db, `rooms/${roomId}/quizList`);

        set(quizListRef, quizList)
            .then(() => {
                alert(`${qCount - 1}問のクイズを読み込みました。`);
                document.getElementById("totalQ").textContent = qCount - 1;
            })
            .catch((error) => {
                console.error("CSVの書き込みに失敗しました:", error);
                alert("データベースへの保存に失敗しました。");
            });
    };
    reader.readAsText(file, "UTF-8");
});

$(document).ready(function () {
    $(document).on('change', 'input[type="checkbox"][data-target]', function () {
        const targetSelector = $(this).data('target');
        const $targetElement = $(targetSelector);

        if ($(this).is(':checked')) {
            $targetElement.fadeIn(200);
        } else {
            $targetElement.fadeOut(200);
        }
    });

    $('input[type="checkbox"][data-target]').each(function () {
        const targetSelector = $(this).data('target');
        if ($(this).is(':checked')) {
            $(targetSelector).show();
        } else {
            $(targetSelector).hide();
        }
    });
});

$(document).ready(function() {


    $("#toggleSettingsBtn").on("click", function(e) {
        e.stopPropagation();
        $("#settingsScreen").toggleClass("open");
    });

    $(document).on("click", function(e) {
        if (!$(e.target).closest("#settingsScreen").length) {
            $("#settingsScreen").removeClass("open");
        }
    });
});