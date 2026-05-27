const { onValueUpdated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

exports.checkBuzzer = onValueUpdated({ 
    region: "asia-southeast1", 
    ref: "/rooms/{roomId}/player/{playerId}" 
}, async (event) => {
    const db = admin.database();
    const { roomId, playerId } = event.params;

    const beforeData = event.data.before.val();
    const afterData = event.data.after.val();

    if (!afterData || afterData.isPushing !== true) return null;
    if (beforeData && beforeData.isPushing === true) return null;
    if (afterData.rank !== 0) return null;
    if (beforeData && ( beforeData.isLost || beforeData.isWon || beforeData.freeze >= 1)) return null;

    const roomPlayersRef = db.ref(`rooms/${roomId}/player`);

    await roomPlayersRef.transaction((players) => {
        if (!players) return players;

        if (players[playerId] && players[playerId].rank !== 0) {
            return players;
        }

        const ansPlayerCount = Object.values(players).filter(player => player && player.rank !== 0).length;

        if (players[playerId]) {
            players[playerId].rank = ansPlayerCount + 1;
        }

        return players;
    });

    return null;
});

exports.onHostAction = onValueUpdated({ 
    region: "asia-southeast1", 
    ref: "/rooms/{roomId}/hostAction" 
}, async (event) => {
    const db = admin.database();
    const { roomId } = event.params;

    const actionData = event.data.after.val();
    if (!actionData || !actionData.timestamp) return null;

    const { action, targetPlayerId } = actionData;

    if (action === "correct" && targetPlayerId && targetPlayerId !== "none") {
        const playerRef = db.ref(`rooms/${roomId}/player/${targetPlayerId}`);
        const ruleSnapshot = await db.ref(`rooms/${roomId}/roomRule`).get();
        const ruleData = ruleSnapshot.exists() ? ruleSnapshot.val() : null;

        await playerRef.transaction((player) => {
            if (!player) return player;

            if (ruleData && ruleData.rule == "ox") {
                player.o = (player.o || 0) + 1;
                if (ruleData.winO <= player.o) {
                    player.isWon = true;
                }
            }
            return player;
        });
    } 

    else if (action === "wrong" && targetPlayerId && targetPlayerId !== "none") {
        const playerRef = db.ref(`rooms/${roomId}/player/${targetPlayerId}`);
        const ruleSnapshot = await db.ref(`rooms/${roomId}/roomRule`).get();
        const ruleData = ruleSnapshot.exists() ? ruleSnapshot.val() : null;

        await playerRef.transaction((player) => {
            if (!player) return player;

            if (ruleData && ruleData.rule == "ox") {
                player.x = (player.x || 0) + 1;
                if (ruleData.lostX <= player.x) {
                    player.isLost = true;
                }
            }
            return player;
        });
    }

    const playersRef = db.ref(`rooms/${roomId}/player`);
    const snapshot = await playersRef.get();
    const playersData = snapshot.val();

    if (playersData) {
        const updates = {};
        Object.keys(playersData).forEach((playerId) => {
            updates[`rooms/${roomId}/player/${playerId}/rank`] = 0;
            updates[`rooms/${roomId}/player/${playerId}/isPushing`] = false;
        });
        await db.ref().update(updates);
    }

    await db.ref(`rooms/${roomId}/hostAction`).update({
        action: "idle",
        targetPlayerId: "none",
        timestamp: null
    });

    return null;
});