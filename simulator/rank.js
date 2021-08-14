var { rating, rate, ordinal } = require('openskill');

class Rank {
    constructor() { }

    calculateRanks(players, teams) {

        if (teams) {
            return this.calculateTeams(players, teams);
        }

        return this.calculateFFA(players);
    }

    calculateTeams(players, teams) {
        return true;
    }

    calculateFFA(players) {
        let rank = [];
        let score = [];
        let ratings = [];
        let teams = [];

        if (!players)
            return false;

        try {
            //create the arrays required by openskill library
            //sync teams and players list to match with the ratings list
            for (var id in players) {
                let player = players[id];
                let playerRating = rating({ mu: player.mu, sigma: player.sigma });
                ratings.push([playerRating]);
                teams.push([id]);
                rank.push(player.rank);
                if (player.score)
                    score.push(player.score);
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
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }
}

module.exports = new Rank();