/**
 * Zero-copy gamestate wrapper.
 *
 * The passed gamestate object is never cloned. All readers hold direct
 * references to the real room, player, and team objects so reads and writes
 * mutate the live object used by worker.ts.
 */

import { GameStatus } from "./enums";

export class PlayerReader {
	private readonly playerRef: any;

	constructor(player: any) {
		this.playerRef = player;
	}

	get<K extends keyof Player>(key: K): Player[K];
	get(key: string): any;
	get(key: string): any {
		return this.playerRef?.[key];
	}

	set<K extends keyof Player>(key: K, value: Player[K]): Player[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.playerRef[key] = value;
		return value;
	}

	get shortid(): string { return this.playerRef.shortid; }
	get displayname(): string { return this.playerRef.displayname; }
	get portraitId(): number { return this.playerRef.portraitid ?? 0; }
	get countryCode(): string { return this.playerRef.countrycode ?? ""; }
	get rating(): number { return this.playerRef.rating ?? 0; }
	get rank(): number { return this.playerRef.rank ?? 0; }
	get score(): number { return this.playerRef.score ?? 0; }
	get teamid(): any { return this.playerRef.teamid; }
	get stats(): Stats | undefined { return this.playerRef.stats; }
	get index(): number { return this.playerRef.id ?? -1; }
	get inGame(): boolean { return this.playerRef.ingame ?? false; }
	get isReady(): boolean { return this.playerRef.ready ?? false; }

    setShortid(shortid: string): string {
        this.playerRef.shortid = shortid;
        return shortid;
    }

	setDisplayname(displayname: string): string {
		this.playerRef.displayname = displayname;
		return displayname;
	}

    setCountryCode(countryCode: string): string {
        this.playerRef.countrycode = countryCode;
        return countryCode;
    }

	setPortraitId(portraitId: number): number {
		this.playerRef.portraitid = portraitId;
		return portraitId;
	}

	setTeamId(teamid: any): any {
		this.playerRef.teamid = teamid;
		return teamid;
	}

	setInGame(inGame: boolean): boolean {
		this.playerRef.ingame = inGame;
		return inGame;
	}

	setReady(ready: boolean): boolean {
		this.playerRef.ready = ready;
		return ready;
	}

	setRank(rank: number): number {
		this.playerRef.rank = rank;
		return rank;
	}

	setRating(rating: number): number {
		this.playerRef.rating = rating;
		return rating;
	}

	raw(): Player {
		return this.playerRef;
	}
}

export class TeamReader {
	private readonly teamRef: any;

	constructor(team: any) {
		this.teamRef = team;
	}

	get<K extends keyof Team>(key: K): Team[K];
	get(key: string): any;
	get(key: string): any {
		return this.teamRef?.[key];
	}

	set<K extends keyof Team>(key: K, value: Team[K]): Team[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.teamRef[key] = value;
		return value;
	}

	get slug(): string { return this.teamRef.team_slug; }
	get team_slug(): string { return this.teamRef.team_slug; }
	get name(): string { return this.teamRef.name ?? ""; }
	get color(): string { return this.teamRef.color ?? ""; }
	get order(): number { return this.teamRef.order ?? 0; }
	get score(): number { return this.teamRef.score ?? 0; }
	get rank(): number { return this.teamRef.rank ?? 0; }
	get players(): any[] { return this.teamRef.players ?? []; }

    setSlug(slug: string): string {
        this.teamRef.team_slug = slug;
        return slug;
    }
	setName(name: string): string {
		this.teamRef.name = name;
		return name;
	}

	setColor(color: string): string {
		this.teamRef.color = color;
		return color;
	}

	setOrder(order: number): number {
		this.teamRef.order = order;
		return order;
	}

	setRank(rank: number): number {
		this.teamRef.rank = rank;
		return rank;
	}

	setScore(score: number): number {
		this.teamRef.score = score;
		return score;
	}

	addPlayer(playerId: any): number {
		if (!Array.isArray(this.teamRef.players)) this.teamRef.players = [];
		this.teamRef.players.push(playerId);
		return this.teamRef.players.length;
	}

	raw(): Team {
		return this.teamRef;
	}
}

export class RoomReader {
	private readonly roomRef: any;

	constructor(room: any) {
		this.roomRef = room ?? {};
	}

	get<K extends keyof Room>(key: K): Room[K];
	get(key: string): any;
	get(key: string): any {
		return this.roomRef?.[key];
	}

	set<K extends keyof Room>(key: K, value: Room[K]): Room[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.roomRef[key] = value;
		return value;
	}

	get slug(): string { return this.roomRef.room_slug ?? ""; }
	get status(): GameStatus { return (this.roomRef.status ?? 0) as GameStatus; }
	get sequence(): number { return this.roomRef._sequence ?? 0; }
	get startTime(): number { return this.roomRef.starttime ?? 0; }
	get endTime(): number { return this.roomRef.endtime ?? 0; }
	get updatedAt(): number { return this.roomRef.updated ?? 0; }
	get timerSet(): number | undefined { return this.roomRef.timeset; }
	get timerSeconds(): number { return this.roomRef.timesec ?? 0; }
	get deadline(): number { return this.roomRef.timeend ?? 0; }
	get isReplay(): boolean { return this.roomRef.isreplay ?? false; }
	get events(): ACOSEvents { return this.roomRef.events ?? []; }
	get nextPlayer(): any { return this.roomRef.next_player; }
	get nextTeam(): any { return this.roomRef.next_team; }
	get nextAction(): any { return this.roomRef.next_action; }

	setSlug(slug: string): string {
		this.roomRef.room_slug = slug;
		return slug;
	}

	setStatus(status: GameStatus): GameStatus {
		this.roomRef.status = status;
		return status;
	}

	setSequence(sequence: number): number {
		this.roomRef._sequence = sequence;
		return sequence;
	}

	incrementSequence(amount = 1): number {
		this.roomRef._sequence = (this.roomRef._sequence ?? 0) + amount;
		return this.roomRef._sequence;
	}

	setStartTime(startTime: number): number {
		this.roomRef.starttime = startTime;
		return startTime;
	}

	setEndTime(endTime: number): number {
		this.roomRef.endtime = endTime;
		return endTime;
	}

	setUpdatedAt(updatedAt: number): number {
		this.roomRef.updated = updatedAt;
		return updatedAt;
	}

	setTimerSet(timerSet: number): number {
		this.roomRef.timeset = timerSet;
		return timerSet;
	}

	clearTimerSet(): void {
		delete this.roomRef.timeset;
	}

	setTimerSeconds(timerSeconds: number): number {
		this.roomRef.timesec = timerSeconds;
		return timerSeconds;
	}

	setDeadline(deadline: number): number {
		this.roomRef.timeend = deadline;
		return deadline;
	}

	setIsReplay(isReplay: boolean): boolean {
		this.roomRef.isreplay = isReplay;
		return isReplay;
	}

	setNextPlayer(nextPlayer: any): any {
		this.roomRef.next_player = nextPlayer;
		return nextPlayer;
	}

	setNextTeam(nextTeam: any): any {
		this.roomRef.next_team = nextTeam;
		return nextTeam;
	}

	setNextAction(nextAction: any): any {
		this.roomRef.next_action = nextAction;
		return nextAction;
	}

	setEvents(events: ACOSEvents): ACOSEvents {
		this.roomRef.events = events;
		return events;
	}

	clearEvents(): void {
		this.roomRef.events = [];
	}

	playerIndex(shortid: string): number | undefined {
		return this.roomRef?._players?.[shortid];
	}

	teamIndex(teamSlug: string): number | undefined {
		return this.roomRef?._teams?.[teamSlug];
	}

	setPlayerIndex(shortid: string, index: number): number {
		if (!this.roomRef._players) this.roomRef._players = {};
		this.roomRef._players[shortid] = index;
		return index;
	}

	setTeamIndex(teamSlug: string, index: number): number {
		if (!this.roomRef._teams) this.roomRef._teams = {};
		this.roomRef._teams[teamSlug] = index;
		return index;
	}

	raw(): Room {
		return this.roomRef;
	}
}

export class GameStateReader {
	private readonly gameStateRef: any;

	constructor(gamestate: any) {
		this.gameStateRef = gamestate;
	}

	state(): State;
	state<T = any>(key: string): T;
	state<T = any>(key: string, value: T): T;
	state<T = any>(key?: string, value?: T): State | T {
		if (key === undefined) return this.gameStateRef.state;
		if (value === undefined) return this.gameStateRef?.state?.[key] as T;
		if (!this.gameStateRef.state) this.gameStateRef.state = {};
		this.gameStateRef.state[key] = value;
		return value;
	}

	room(): RoomReader;
	room<K extends keyof Room>(key: K): Room[K];
	room<K extends keyof Room>(key: K, value: Room[K]): Room[K];
	room<K extends keyof Room>(key?: K, value?: Room[K]): RoomReader | Room[K] {
		if (key === undefined) return new RoomReader(this.gameStateRef.room);
		if (value === undefined) return this.gameStateRef?.room?.[key];
		if (!this.gameStateRef.room) this.gameStateRef.room = {};
		this.gameStateRef.room[key] = value;
		return value;
	}

	player(index: number): PlayerReader | null {
		const player = this.gameStateRef?.players?.[index];
		return player ? new PlayerReader(player) : null;
	}

	playerByShortid(shortid: string): PlayerReader | null {
		const index = this.playerRoomIndex(shortid);
		if (index === undefined) return null;
		return this.player(index);
	}

	playerByIndex(index: number): PlayerReader | null {
		return this.player(index);
	}

	players(): PlayerReader[] {
		return (this.gameStateRef?.players ?? []).map((player: any) => new PlayerReader(player));
	}

	playerCount(): number {
		return this.gameStateRef?.players?.length ?? 0;
	}

	playerIndex(shortid: string): number {
		return this.gameStateRef?.room?._players?.[shortid] ?? this.gameStateRef?.players?.findIndex((player: any) => player.shortid === shortid) ?? -1;
	}

	hasPlayer(shortid: string): boolean {
		return this.playerRoomIndex(shortid) !== undefined;
	}

	playerRoomIndex(shortid: string): number | undefined {
		return this.gameStateRef?.room?._players?.[shortid];
	}

	setPlayerRoomIndex(shortid: string, index: number): number {
		return this.room().setPlayerIndex(shortid, index);
	}

	team(teamSlug: string): TeamReader | null {
		const index = this.teamRoomIndex(teamSlug);
		if (index !== undefined) {
			const team = this.gameStateRef?.teams?.[index];
			return team ? new TeamReader(team) : null;
		}

		const team = this.gameStateRef?.teams?.find((entry: any) => entry.team_slug === teamSlug);
		return team ? new TeamReader(team) : null;
	}

	teamAt(index: number): TeamReader | null {
		const team = this.gameStateRef?.teams?.[index];
		return team ? new TeamReader(team) : null;
	}

	teams(): TeamReader[] {
		return (this.gameStateRef?.teams ?? []).map((team: any) => new TeamReader(team));
	}

	teamCount(): number {
		return this.gameStateRef?.teams?.length ?? 0;
	}

	hasTeams(): boolean {
		return this.teamCount() > 0;
	}

	teamRoomIndex(teamSlug: string): number | undefined {
		return this.gameStateRef?.room?._teams?.[teamSlug];
	}

	setTeamRoomIndex(teamSlug: string, index: number): number {
		return this.room().setTeamIndex(teamSlug, index);
	}

	events(): ACOSEvent[] {
		return this.gameStateRef?.room?.events ?? [];
	}

	addEvent(event: ACOSEvent): number {
		const room = this.room();
		const events = room.events;
		events.push(event);
		room.setEvents(events);
		return events.length;
	}

	clearEvents(): void {
		this.room().clearEvents();
	}

	setStatus(status: GameStatus): GameStatus {
		return this.room().setStatus(status);
	}

	setSequence(sequence: number): number {
		return this.room().setSequence(sequence);
	}

	incrementSequence(amount = 1): number {
		return this.room().incrementSequence(amount);
	}

	setStartTime(startTime: number): number {
		return this.room().setStartTime(startTime);
	}

	setEndTime(endTime: number): number {
		return this.room().setEndTime(endTime);
	}

	setUpdatedAt(updatedAt: number): number {
		return this.room().setUpdatedAt(updatedAt);
	}

	setTimerSeconds(timerSeconds: number): number {
		return this.room().setTimerSeconds(timerSeconds);
	}

	setDeadline(deadline: number): number {
		return this.room().setDeadline(deadline);
	}

	clearTimerSet(): void {
		this.room().clearTimerSet();
	}

	setNextPlayer(nextPlayer: any): any {
		return this.room().setNextPlayer(nextPlayer);
	}

	setNextTeam(nextTeam: any): any {
		return this.room().setNextTeam(nextTeam);
	}

	setNextAction(nextAction: any): any {
		return this.room().setNextAction(nextAction);
	}

	setRoomEvents(events: ACOSEvents): ACOSEvents {
		return this.room().setEvents(events);
	}

	ensureState(): State {
		if (!this.gameStateRef.state) this.gameStateRef.state = {};
		return this.gameStateRef.state;
	}

	ensurePlayers(): any[] {
		if (!Array.isArray(this.gameStateRef.players)) this.gameStateRef.players = [];
		return this.gameStateRef.players;
	}

	ensureTeams(): any[] {
		if (!Array.isArray(this.gameStateRef.teams)) this.gameStateRef.teams = [];
		return this.gameStateRef.teams;
	}

	addPlayer(player: any): PlayerReader {
		this.ensurePlayers().push(player);
		return new PlayerReader(player);
	}

	addTeam(team: any): TeamReader {
		this.ensureTeams().push(team);
		return new TeamReader(team);
	}

	raw(): GameState {
		return this.gameStateRef;
	}

    ensureServerOnly(previous:GameState): void {
        // Remove any client-only properties from the gamestate to prevent them from being sent to clients.
        // This is necessary because the gamestate is shared between the server and clients, and we don't want to accidentally leak server-only data to clients.

        let pgame = gs(previous);

        let proom = pgame.room();
        let pplayers = pgame.players();
        let pteams = pgame.teams();

        let room = this.room();
        room.setSlug(proom.slug);  
        // room.setStartTime(proom.startTime);

        for (let i = 0; i < pplayers.length; i++) {
            let pplayer = pplayers[i];
            let player = this.player(i);
            if (!player) continue;
            player.setShortid(pplayer.shortid);
            player.setDisplayname(pplayer.displayname);
            player.setPortraitId(pplayer.portraitId);
            player.setCountryCode(pplayer.countryCode);
            player.setRating(pplayer.rating);
        }

        for(let i=0; i<pteams.length; i++) {
            let pteam = pteams[i];
            let team = this.teamAt(i);
            if (!team) continue;
            team.setSlug(pteam.slug);
            team.setName(pteam.name);
            team.setColor(pteam.color);
        }

    }

}

export function gs(gamestate: any): GameStateReader {
	return new GameStateReader(gamestate);
}

export default gs;
