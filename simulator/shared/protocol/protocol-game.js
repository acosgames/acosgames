const Player = {
    "displayname": 1,
    "shortid": 2,
    "portraitid": 3,
    "teamid": 4,
    "rank": 5,
    "score": 6,
    "ready": 7,
    "rating": 8
}

const Team = {
    "team_slug": 1,
    "name": 2,
    "color": 3,
    "order": 4,
    "players": 5,
    "rank": 6,
    "score": 7
}

const Room = {
    "room_slug": 1,
    "starttime": 2,
    "endtime": 3,
    "sequence": 4,
    "updated": 5,
    "next_player": 6,
    "next_team": 7,
    "next_id": 8,
    "next_action": 9,
    "timeend": 10,
    "timesec": 11,
    "status": 12,
    "isreplay": 13,
    "_players": 14,
    "_teams": 15,
    "events": {
        "$byte": 16,
        "$array": {
            "type": 2,
            "payload": 3
        }
    },
    "meta": 17
}

const PROTOCOL = {
    "room": 1,
    "teams": {
        "$byte": 2,
        "$array": Team
    },
    "players": {
        "$byte": 3,
        "$array": Player
    },

    "state": 4
}

export default PROTOCOL;