const { onValueUpdated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

exports.checkBuzzer = onValueUpdated({ region: "asia-southeast1", ref: "/rooms/{roomId}/player/{playerId}" }, async (event) => {
    const db = admin.database();
    const { roomId, playerId } = event.params;

    const afterData = event.data.after.val();

    if (!afterData || afterData.isPushing !== true) {
        return null;
    }


    if (afterData.rank === 1) {
        return null;
    }

    const roomPlayersRef = db.ref(`rooms/${roomId}/player`);

    await roomPlayersRef.transaction((players) => {

        if (!players) return players;


        const isAlreadyAnswered = Object.values(players).some(p => p.rank === 1);

        if (!isAlreadyAnswered) {
            if (players[playerId]) {
                players[playerId].rank = 1;
            }
        }

        return players;
    });

    return null;
});