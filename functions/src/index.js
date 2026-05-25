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