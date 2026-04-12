import { rating, rate, ordinal } from "openskill";

interface Player {
    shortid?: string;
    rank?: number;
    score?: number;
    mu?: number;
    sigma?: number;
    rating?: number;
    [key: string]: unknown;
}

interface Team {
    players: string[];
    rank?: number;
    score?: number;
    [key: string]: unknown;
}

class Rank {
    isObject(x: unknown): x is Record<string, unknown> {
        return (
            x != null &&
            (typeof x === "object" || typeof x === "function") &&
            !Array.isArray(x)
        );
    }

    calculateRanks(players: Player[] | Record<string, Player>, teams?: Team[]): boolean {
        if (Array.isArray(teams) && teams.length > 0)
            return this.calculateTeams(players as Record<string, Player>, teams);

        return this.calculateFFA(players as Record<string, Player>);
    }

    calculateTeams(players: Record<string, Player>, teams: Team[]): boolean {
        const teamRatingGroup: ReturnType<typeof rating>[][] = [];
        const teamPlayerIdsGroup: string[][] = [];
        const teamRanks: number[] = [];
        const teamScores: number[] = [];

        if (!players) return false;

        try {
            for (const team of teams) {
                if (!team || !team.players || !Array.isArray(team.players))
                    return this.calculateFFA(players);

                const playerList: Player[] = [];
                for (let i = 0; i < team.players.length; i++) {
                    const playerid = team.players[i];
                    const player = players[playerid];
                    player.shortid = playerid;
                    playerList.push(player);
                }

                playerList.sort((a, b) => {
                    const arank = a.rank || 0;
                    const brank = b.rank || 0;
                    if (arank === brank) {
                        const ascore = a.score || 0;
                        const bscore = b.score || 0;
                        return bscore - ascore;
                    }
                    return arank - brank;
                });

                const teamRatings: ReturnType<typeof rating>[] = [];
                const teamIds: string[] = [];
                for (let i = 0; i < playerList.length; i++) {
                    const player = playerList[i];
                    const playerRating = rating({ mu: player.mu, sigma: player.sigma });
                    teamRatings.push(playerRating);
                    teamIds.push(player.shortid!);
                }

                teamRatingGroup.push(teamRatings);
                teamPlayerIdsGroup.push(teamIds);

                if (Number.isInteger(team.rank)) {
                    teamRanks.push(team.rank!);
                } else if (Number.isInteger(team.score)) {
                    teamScores.push(team.score!);
                } else {
                    return this.calculateFFA(players);
                }
            }

            let results: ReturnType<typeof rating>[][];
            if (teamRanks.length > teamScores.length)
                results = rate(teamRatingGroup as any, { rank: teamRanks });
            else results = rate(teamRatingGroup as any, { score: teamScores });

            for (let i = 0; i < teamPlayerIdsGroup.length; i++) {
                const teamPlayerIds = teamPlayerIdsGroup[i];
                for (let j = 0; j < teamPlayerIds.length; j++) {
                    const id = teamPlayerIds[j];
                    const player = players[id];
                    const playerRating = results[i][j];
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

    calculateFFA(players: Record<string, Player>): boolean {
        const rankArr: number[] = [];
        const score: number[] = [];
        const ratings: ReturnType<typeof rating>[][] = [];
        const teams: string[][] = [];

        if (!players) return false;

        try {
            for (const id in players) {
                const player = players[id];
                const playerRating = rating({ mu: player.mu, sigma: player.sigma });
                ratings.push([playerRating]);
                teams.push([id]);
                rankArr.push(player.rank ?? 0);
                if (player.score) score.push(player.score);
            }

            let results: ReturnType<typeof rating>[][];
            if (score.length !== rankArr.length) {
                results = rate(ratings as any, { rank: rankArr });
            } else {
                results = rate(ratings as any, { rank: rankArr, score });
            }

            for (let i = 0; i < teams.length; i++) {
                const team = teams[i];
                for (let j = 0; j < team.length; j++) {
                    const id = team[j];
                    const player = players[id];
                    const playerRating = results[i][j];
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

export default new Rank();
