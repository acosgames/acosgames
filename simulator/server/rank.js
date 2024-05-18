var { rating, rate, ordinal } = require("openskill");

class Rank {
    constructor() {}

    isObject(x) {
        return (
            x != null &&
            (typeof x === "object" || typeof x === "function") &&
            !Array.isArray(x)
        );
    }

    calculateRanks(players, teams) {
        if (this.isObject(teams) && Object.keys(teams).length > 0)
            return this.calculateTeams(players, teams);

        return this.calculateFFA(players);
    }

    calculateTeams(players, teams) {
        let teamRatingGroup = [];
        let teamPlayerIdsGroup = [];
        let teamRanks = [];
        let teamScores = [];

        if (!players) return false;

        try {
            for (var teamid in teams) {
                //teams must have a players array list that holds the ids of players on this team
                let team = teams[teamid];
                if (!team || !team.players || !Array.isArray(team.players))
                    return this.calculateFFA(players);

                //move players into an array list
                let playerList = [];
                for (var i = 0; i < team.players.length; i++) {
                    let playerid = team.players[i];
                    let player = players[playerid];
                    player.shortid = playerid;
                    playerList.push(player);
                }

                //sort from players in this team by their rank
                playerList.sort((a, b) => {
                    let arank = a.rank || 0;
                    let brank = b.rank || 0;
                    if (arank == brank) {
                        let ascore = a.score || 0;
                        let bscore = b.score || 0;
                        return bscore - ascore;
                    }
                    return arank - brank;
                });

                //build the player ratings required by OpenSkill
                let teamRatings = [];
                let teamIds = [];
                for (var i = 0; i < playerList.length; i++) {
                    let player = playerList[i];
                    let playerRating = rating({
                        mu: player.mu,
                        sigma: player.sigma,
                    });
                    teamRatings.push(playerRating);
                    teamIds.push(player.shortid);
                }

                //move the ratings and ids into the team group
                teamRatingGroup.push(teamRatings);
                teamPlayerIdsGroup.push(teamIds);

                //capture the team rank or score for choosing the winning team
                if (Number.isInteger(team.rank)) {
                    teamRanks.push(team.rank);
                } else if (Number.isInteger(team.score)) {
                    teamScores.push(team.score);
                } else {
                    //no rank or score exists, reject and fallback to FFA
                    return this.calculateFFA(players);
                }
            }

            //calculate the results
            let results = null;
            if (teamRanks.length > teamScores.length)
                results = rate(teamPlayerIdsGroup, { rank: teamRanks });
            else results = rate(teamPlayerIdsGroup, { score: teamScores });

            //update player ratings for saving to storage
            for (var i = 0; i < teamPlayerIdsGroup.length; i++) {
                let teamPlayerIds = teamPlayerIdsGroup[i];
                for (var j = 0; j < teamPlayerIds.length; j++) {
                    let id = teamPlayerIds[j];
                    let player = players[id];
                    let playerRating = results[i][j];
                    player.mu = playerRating.mu;
                    player.sigma = playerRating.sigma;
                    player.rating = Math.round(playerRating.mu * 100.0);
                }
            }

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    calculateFFA(players) {
        let rank = [];
        let score = [];
        let ratings = [];
        let teams = [];

        if (!players) return false;

        try {
            //create the arrays required by openskill library
            //sync teams and players list to match with the ratings list
            for (var id in players) {
                let player = players[id];
                let playerRating = rating({
                    mu: player.mu,
                    sigma: player.sigma,
                });
                ratings.push([playerRating]);
                teams.push([id]);
                rank.push(player.rank);
                if (player.score) score.push(player.score);
            }

            //calculate the results
            let results = null;
            if (score.length != rank.length) {
                results = rate(ratings, { rank });
            } else {
                results = rate(ratings, { rank, score });
            }

            //update player ratings for saving to storage
            for (var i = 0; i < teams.length; i++) {
                let team = teams[i];
                for (var j = 0; j < team.length; j++) {
                    let id = team[j];
                    let player = players[id];
                    let playerRating = results[i][j];
                    player.mu = playerRating.mu;
                    player.sigma = playerRating.sigma;
                    player.rating = Math.round(playerRating.mu * 100.0);
                }
            }

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}

module.exports = new Rank();
