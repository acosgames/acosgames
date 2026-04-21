/**
 * Zero-copy gamestate wrapper.
 *
 * The passed gamestate object is never cloned. All readers hold direct
 * references to the real room, player, and team objects so reads and writes
 * mutate the live object used by worker.ts.
 */

import { GameStatus } from "./enums";

/** Zero-copy wrapper for a single player object in the gamestate. */
export class PlayerReader {
	private readonly playerRef: any;

	/** @param player - The raw player object from the gamestate. */
	constructor(player: any) {
		this.playerRef = player;
	}

	/** Returns the value of the given key from the player object. */
	get<K extends keyof Player>(key: K): Player[K];
	get(key: string): any;
	get(key: string): any {
		return this.playerRef?.[key];
	}

	/** Sets the value of the given key on the player object and returns the value. */
	set<K extends keyof Player>(key: K, value: Player[K]): Player[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.playerRef[key] = value;
		return value;
	}

	/** The player's short identifier. */
	get shortid(): string { return this.playerRef.shortid; }
	/** The player's display name. */
	get displayname(): string { return this.playerRef.displayname; }
	/** The player's portrait ID, defaults to 0. */
	get portraitId(): number { return this.playerRef.portraitid ?? 0; }
	/** The player's two-letter country code, defaults to empty string. */
	get countryCode(): string { return this.playerRef.countrycode ?? ""; }
	/** The player's matchmaking rating, defaults to 0. */
	get rating(): number { return this.playerRef.rating ?? 0; }
	/** The player's current rank in the game, defaults to 0. */
	get rank(): number { return this.playerRef.rank ?? 0; }
	/** The player's current score, defaults to 0. */
	get score(): number { return this.playerRef.score ?? 0; }
	/** The ID of the team this player belongs to, if any. */
	get teamid(): any { return this.playerRef.teamid; }
	/** The player's stats object, if present. */
	get stats(): Stats | undefined { return this.playerRef.stats; }
	/** The player's zero-based index in the players array, defaults to -1. */
	get index(): number { return this.playerRef.id ?? -1; }
	/** Whether the player is currently active in the game. */
	get inGame(): boolean { return this.playerRef.ingame ?? false; }
	/** Whether the player has indicated they are ready. */
	get isReady(): boolean { return this.playerRef.ready ?? false; }

	/** Sets the player's short identifier and returns it. */
    setShortid(shortid: string): string {
        this.playerRef.shortid = shortid;
        return shortid;
    }

	/** Sets the player's display name and returns it. */
	setDisplayname(displayname: string): string {
		this.playerRef.displayname = displayname;
		return displayname;
	}

	/** Sets the player's country code and returns it. */
    setCountryCode(countryCode: string): string {
        this.playerRef.countrycode = countryCode;
        return countryCode;
    }

	/** Sets the player's portrait ID and returns it. */
	setPortraitId(portraitId: number): number {
		this.playerRef.portraitid = portraitId;
		return portraitId;
	}

	/** Sets the player's team ID and returns it. */
	setTeamId(teamid: any): any {
		this.playerRef.teamid = teamid;
		return teamid;
	}

	/** Sets whether the player is active in the game and returns the value. */
	setInGame(inGame: boolean): boolean {
		this.playerRef.ingame = inGame;
		return inGame;
	}

	/** Sets the player's ready state and returns it. */
	setReady(ready: boolean): boolean {
		this.playerRef.ready = ready;
		return ready;
	}

	/** Sets the player's rank and returns it. */
	setRank(rank: number): number {
		this.playerRef.rank = rank;
		return rank;
	}

	/** Sets the player's matchmaking rating and returns it. */
	setRating(rating: number): number {
		this.playerRef.rating = rating;
		return rating;
	}

	/** Returns the underlying raw player object. */
	raw(): Player {
		return this.playerRef;
	}
}

/** Zero-copy wrapper for a single team object in the gamestate. */
export class TeamReader {
	private readonly teamRef: any;

	/** @param team - The raw team object from the gamestate. */
	constructor(team: any) {
		this.teamRef = team;
	}

	/** Returns the value of the given key from the team object. */
	get<K extends keyof Team>(key: K): Team[K];
	get(key: string): any;
	get(key: string): any {
		return this.teamRef?.[key];
	}

	/** Sets the value of the given key on the team object and returns the value. */
	set<K extends keyof Team>(key: K, value: Team[K]): Team[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.teamRef[key] = value;
		return value;
	}

	/** The team's slug identifier. */
	get slug(): string { return this.teamRef.team_slug; }
	/** The team's slug identifier (alias for `slug`). */
	get team_slug(): string { return this.teamRef.team_slug; }
	/** The team's display name, defaults to empty string. */
	get name(): string { return this.teamRef.name ?? ""; }
	/** The team's color value, defaults to empty string. */
	get color(): string { return this.teamRef.color ?? ""; }
	/** The team's display order, defaults to 0. */
	get order(): number { return this.teamRef.order ?? 0; }
	/** The team's current score, defaults to 0. */
	get score(): number { return this.teamRef.score ?? 0; }
	/** The team's current rank in the game, defaults to 0. */
	get rank(): number { return this.teamRef.rank ?? 0; }
	/** The list of player IDs belonging to this team, defaults to empty array. */
	get players(): any[] { return this.teamRef.players ?? []; }

	/** Sets the team's slug identifier and returns it. */
    setSlug(slug: string): string {
        this.teamRef.team_slug = slug;
        return slug;
    }

	/** Sets the team's display name and returns it. */
	setName(name: string): string {
		this.teamRef.name = name;
		return name;
	}

	/** Sets the team's color and returns it. */
	setColor(color: string): string {
		this.teamRef.color = color;
		return color;
	}

	/** Sets the team's display order and returns it. */
	setOrder(order: number): number {
		this.teamRef.order = order;
		return order;
	}

	/** Sets the team's rank and returns it. */
	setRank(rank: number): number {
		this.teamRef.rank = rank;
		return rank;
	}

	/** Sets the team's score and returns it. */
	setScore(score: number): number {
		this.teamRef.score = score;
		return score;
	}

	/**
	 * Appends a player ID to the team's player list.
	 * @returns The new length of the players array.
	 */
	addPlayer(playerId: any): number {
		if (!Array.isArray(this.teamRef.players)) this.teamRef.players = [];
		this.teamRef.players.push(playerId);
		return this.teamRef.players.length;
	}

	/** Returns the underlying raw team object. */
	raw(): Team {
		return this.teamRef;
	}
}

/** Zero-copy wrapper for the room object in the gamestate. */
export class RoomReader {
	private readonly roomRef: any;

	/** @param room - The raw room object from the gamestate. */
	constructor(room: any) {
		this.roomRef = room ?? {};
	}

	/** Returns the value of the given key from the room object. */
	get<K extends keyof Room>(key: K): Room[K];
	get(key: string): any;
	get(key: string): any {
		return this.roomRef?.[key];
	}

	/** Sets the value of the given key on the room object and returns the value. */
	set<K extends keyof Room>(key: K, value: Room[K]): Room[K];
	set(key: string, value: any): any;
	set(key: string, value: any): any {
		this.roomRef[key] = value;
		return value;
	}

	/** The room's slug identifier. */
	get slug(): string { return this.roomRef.room_slug ?? ""; }
	/** The room's current game status. */
	get status(): GameStatus { return (this.roomRef.status ?? 0) as GameStatus; }
	/** The room's action sequence number. */
	get sequence(): number { return this.roomRef._sequence ?? 0; }
	/** Unix timestamp (ms) of when the game started. */
	get startTime(): number { return this.roomRef.starttime ?? 0; }
	/** Unix timestamp (ms) of when the game ended. */
	get endTime(): number { return this.roomRef.endtime ?? 0; }
	/** Unix timestamp (ms) of the last update. */
	get updatedAt(): number { return this.roomRef.updated ?? 0; }
	/** The Unix timestamp (ms) when the timer was set, if active. */
	get timerSet(): number | undefined { return this.roomRef.timeset; }
	/** The duration of the current timer in seconds. */
	get timerSeconds(): number { return this.roomRef.timesec ?? 0; }
	/** Unix timestamp (ms) when the current timer expires. */
	get deadline(): number { return this.roomRef.timeend ?? 0; }
	/** Whether this room is running a replay. */
	get isReplay(): boolean { return this.roomRef.isreplay ?? false; }
	/** The list of events that occurred this action. */
	get events(): ACOSEvents { return this.roomRef.events ?? []; }
	/** The shortid or identifier of the next player expected to act. */
	get nextPlayer(): any { return this.roomRef.next_player; }
	/** The slug or identifier of the next team expected to act. */
	get nextTeam(): any { return this.roomRef.next_team; }
	/** The next expected action identifier. */
	get nextAction(): any { return this.roomRef.next_action; }
	/** A map of player shortids to their array indices. */
	get playerMap(): any { return this.roomRef._players ?? {}; }
	/** A map of team slugs to their array indices. */
	get teamMap(): any { return this.roomRef._teams ?? {}; }

	/** Sets the room's slug identifier and returns it. */
	setSlug(slug: string): string {
		this.roomRef.room_slug = slug;
		return slug;
	}

	/** Sets the room's game status and returns it. */
	setStatus(status: GameStatus): GameStatus {
		this.roomRef.status = status;
		return status;
	}

	/** Sets the room's action sequence number and returns it. */
	setSequence(sequence: number): number {
		this.roomRef._sequence = sequence;
		return sequence;
	}

	/**
	 * Increments the room's action sequence number by the given amount.
	 * @param amount - Amount to increment by, defaults to 1.
	 * @returns The new sequence number.
	 */
	incrementSequence(amount = 1): number {
		this.roomRef._sequence = (this.roomRef._sequence ?? 0) + amount;
		return this.roomRef._sequence;
	}

	/** Sets the game start timestamp (ms) and returns it. */
	setStartTime(startTime: number): number {
		this.roomRef.starttime = startTime;
		return startTime;
	}

	/** Sets the game end timestamp (ms) and returns it. */
	setEndTime(endTime: number): number {
		this.roomRef.endtime = endTime;
		return endTime;
	}

	/** Sets the last-updated timestamp (ms) and returns it. */
	setUpdatedAt(updatedAt: number): number {
		this.roomRef.updated = updatedAt;
		return updatedAt;
	}

	/** Records the Unix timestamp (ms) when the timer was set and returns it. */
	setTimerSet(timerSet: number): number {
		this.roomRef.timeset = timerSet;
		return timerSet;
	}

	/** Removes the `timeset` field, cancelling any active timer marker. */
	clearTimerSet(): void {
		delete this.roomRef.timeset;
	}

	/** Sets the timer duration in seconds and returns it. */
	setTimerSeconds(timerSeconds: number): number {
		this.roomRef.timesec = timerSeconds;
		return timerSeconds;
	}

	/** Sets the timer expiry timestamp (ms) and returns it. */
	setDeadline(deadline: number): number {
		this.roomRef.timeend = deadline;
		return deadline;
	}

	/** Sets whether the room is running a replay and returns the value. */
	setIsReplay(isReplay: boolean): boolean {
		this.roomRef.isreplay = isReplay;
		return isReplay;
	}

	/** Sets the next player identifier and returns it. */
	setNextPlayer(nextPlayer: any): any {
		this.roomRef.next_player = nextPlayer;
		return nextPlayer;
	}

	/** Sets the next team identifier and returns it. */
	setNextTeam(nextTeam: any): any {
		this.roomRef.next_team = nextTeam;
		return nextTeam;
	}

	/** Sets the next expected action identifier and returns it. */
	setNextAction(nextAction: any): any {
		this.roomRef.next_action = nextAction;
		return nextAction;
	}

	/** Replaces the room's event list and returns it. */
	setEvents(events: ACOSEvents): ACOSEvents {
		this.roomRef.events = events;
		return events;
	}

	/** Clears all events from the room. */
	clearEvents(): void {
		this.roomRef.events = [];
	}

	/**
	 * Returns all events in the room whose `type` field matches the given value.
	 * @param type - The event type string to filter by.
	 */
	eventsByType(type: string): ACOSEvent[] {
		return (this.roomRef.events ?? []).filter((e: ACOSEvent) => e.type === type);
	}

	/**
	 * Returns the array index of the player with the given shortid, or `undefined` if not found.
	 * @param shortid - The player's short identifier.
	 */
	playerIndex(shortid: string): number | undefined {
		return this.roomRef?._players?.[shortid];
	}

	/**
	 * Returns the array index of the team with the given slug, or `undefined` if not found.
	 * @param teamSlug - The team's slug identifier.
	 */
	teamIndex(teamSlug: string): number | undefined {
		return this.roomRef?._teams?.[teamSlug];
	}

	/**
	 * Registers a player shortid → array index mapping in the room.
	 * @returns The index that was set.
	 */
	setPlayerIndex(shortid: string, index: number): number {
		if (!this.roomRef._players) this.roomRef._players = {};
		this.roomRef._players[shortid] = index;
		return index;
	}

	/**
	 * Registers a team slug → array index mapping in the room.
	 * @returns The index that was set.
	 */
	setTeamIndex(teamSlug: string, index: number): number {
		if (!this.roomRef._teams) this.roomRef._teams = {};
		this.roomRef._teams[teamSlug] = index;
		return index;
	}

	/** Returns the underlying raw room object. */
	raw(): Room {
		return this.roomRef;
	}
}

/**
 * Top-level zero-copy wrapper for the full gamestate object.
 * Provides typed accessors for state, room, players, and teams,
 * as well as convenience methods that delegate to the sub-readers.
 */
export class GameStateReader {
	private readonly gameStateRef: any;

	/** @param gamestate - The raw gamestate object shared with worker.ts. */
	constructor(gamestate: any) {
		this.gameStateRef = gamestate;
	}

	/**
	 * With no arguments, returns the entire `state` object.
	 * With a key, returns the value at `state[key]`.
	 * With a key and value, sets `state[key] = value` and returns the value.
	 */
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

	/**
	 * With no arguments, returns a `RoomReader` for the room object.
	 * With a key, returns `room[key]`.
	 * With a key and value, sets `room[key] = value` and returns the value.
	 */
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

	/**
	 * Returns a `PlayerReader` for the player at the given array index,
	 * or `null` if the index is out of bounds.
	 */
	player(index: number): PlayerReader | null {
		const player = this.gameStateRef?.players?.[index];
		return player ? new PlayerReader(player) : null;
	}

	/**
	 * Returns a `PlayerReader` for the player with the given shortid,
	 * or `null` if not found.
	 */
	playerByShortid(shortid: string): PlayerReader | null {
		const index = this.playerRoomIndex(shortid);
		if (index === undefined) return null;
		return this.player(index);
	}

	/**
	 * Returns a `PlayerReader` for the player at the given array index,
	 * or `null` if the index is out of bounds. Alias for `player(index)`.
	 */
	playerByIndex(index: number): PlayerReader | null {
		return this.player(index);
	}

	/** Returns `PlayerReader` wrappers for all players in the gamestate. */
	players(): PlayerReader[] {
		return (this.gameStateRef?.players ?? []).map((player: any) => new PlayerReader(player));
	}

	/** Returns the total number of players in the gamestate. */
	playerCount(): number {
		return this.gameStateRef?.players?.length ?? 0;
	}

	/**
	 * Returns the array index of the player with the given shortid.
	 * First checks the room's `_players` map, then falls back to a linear scan.
	 * Returns -1 if not found.
	 */
	playerIndex(shortid: string): number {
		return this.gameStateRef?.room?._players?.[shortid] ?? this.gameStateRef?.players?.findIndex((player: any) => player.shortid === shortid) ?? -1;
	}

	/** Returns `true` if a player with the given shortid exists in the room map. */
	hasPlayer(shortid: string): boolean {
		return this.playerRoomIndex(shortid) !== undefined;
	}

	/**
	 * Returns the array index stored in the room's `_players` map for the given shortid,
	 * or `undefined` if not registered.
	 */
	playerRoomIndex(shortid: string): number | undefined {
		return this.gameStateRef?.room?._players?.[shortid];
	}

	/** Registers a player shortid → array index mapping in the room and returns the index. */
	setPlayerRoomIndex(shortid: string, index: number): number {
		return this.room().setPlayerIndex(shortid, index);
	}

	/**
	 * Returns a `TeamReader` for the team with the given slug,
	 * or `null` if not found. Checks the room index map first, then falls back to a linear scan.
	 */
	team(teamSlug: string): TeamReader | null {
		const index = this.teamRoomIndex(teamSlug);
		if (index !== undefined) {
			const team = this.gameStateRef?.teams?.[index];
			return team ? new TeamReader(team) : null;
		}

		const team = this.gameStateRef?.teams?.find((entry: any) => entry.team_slug === teamSlug);
		return team ? new TeamReader(team) : null;
	}

	/**
	 * Returns a `TeamReader` for the team at the given array index,
	 * or `null` if the index is out of bounds.
	 */
	teamAt(index: number): TeamReader | null {
		const team = this.gameStateRef?.teams?.[index];
		return team ? new TeamReader(team) : null;
	}

	/** Returns `TeamReader` wrappers for all teams in the gamestate. */
	teams(): TeamReader[] {
		return (this.gameStateRef?.teams ?? []).map((team: any) => new TeamReader(team));
	}

	/** Returns the total number of teams in the gamestate. */
	teamCount(): number {
		return this.gameStateRef?.teams?.length ?? 0;
	}

	/** Returns `true` if there is at least one team in the gamestate. */
	hasTeams(): boolean {
		return this.teamCount() > 0;
	}

	/**
	 * Returns the array index stored in the room's `_teams` map for the given slug,
	 * or `undefined` if not registered.
	 */
	teamRoomIndex(teamSlug: string): number | undefined {
		return this.gameStateRef?.room?._teams?.[teamSlug];
	}

	/** Registers a team slug → array index mapping in the room and returns the index. */
	setTeamRoomIndex(teamSlug: string, index: number): number {
		return this.room().setTeamIndex(teamSlug, index);
	}

	/** Returns all events currently stored in the room. */
	events(): ACOSEvent[] {
		return this.gameStateRef?.room?.events ?? [];
	}

	/**
	 * Appends an event to the room's event list.
	 * @returns The new length of the events array.
	 */
	addEvent(event: ACOSEvent): number {
		const room = this.room();
		const events = room.events;
		events.push(event);
		room.setEvents(events);
		return events.length;
	}

	/** Removes all events from the room. */
	clearEvents(): void {
		this.room().clearEvents();
	}

	/**
	 * Returns all events in the room whose `type` field matches the given value.
	 * @param type - The event type string to filter by.
	 */
	eventsByType(type: string): ACOSEvent[] {
		return this.room().eventsByType(type);
	}

	/** Sets the room's game status and returns it. */
	setStatus(status: GameStatus): GameStatus {
		return this.room().setStatus(status);
	}

	/** Sets the room's action sequence number and returns it. */
	setSequence(sequence: number): number {
		return this.room().setSequence(sequence);
	}

	/**
	 * Increments the room's action sequence number by the given amount.
	 * @param amount - Amount to increment by, defaults to 1.
	 * @returns The new sequence number.
	 */
	incrementSequence(amount = 1): number {
		return this.room().incrementSequence(amount);
	}

	/** Sets the game start timestamp (ms) and returns it. */
	setStartTime(startTime: number): number {
		return this.room().setStartTime(startTime);
	}

	/** Sets the game end timestamp (ms) and returns it. */
	setEndTime(endTime: number): number {
		return this.room().setEndTime(endTime);
	}

	/** Sets the last-updated timestamp (ms) and returns it. */
	setUpdatedAt(updatedAt: number): number {
		return this.room().setUpdatedAt(updatedAt);
	}

	/** Sets the timer duration in seconds and returns it. */
	setTimerSeconds(timerSeconds: number): number {
		return this.room().setTimerSeconds(timerSeconds);
	}

	/** Sets the timer expiry timestamp (ms) and returns it. */
	setDeadline(deadline: number): number {
		return this.room().setDeadline(deadline);
	}

	/** Removes the `timeset` field from the room, cancelling the active timer marker. */
	clearTimerSet(): void {
		this.room().clearTimerSet();
	}

	/** Sets the next player identifier on the room and returns it. */
	setNextPlayer(nextPlayer: any): any {
		return this.room().setNextPlayer(nextPlayer);
	}

	/** Sets the next team identifier on the room and returns it. */
	setNextTeam(nextTeam: any): any {
		return this.room().setNextTeam(nextTeam);
	}

	/** Sets the next expected action identifier on the room and returns it. */
	setNextAction(nextAction: any): any {
		return this.room().setNextAction(nextAction);
	}

	/** Replaces the room's full event list and returns it. */
	setRoomEvents(events: ACOSEvents): ACOSEvents {
		return this.room().setEvents(events);
	}

	/** Ensures `state` exists on the gamestate and returns it. */
	ensureState(): State {
		if (!this.gameStateRef.state) this.gameStateRef.state = {};
		return this.gameStateRef.state;
	}

	/** Ensures the `players` array exists on the gamestate and returns it. */
	ensurePlayers(): any[] {
		if (!Array.isArray(this.gameStateRef.players)) this.gameStateRef.players = [];
		return this.gameStateRef.players;
	}

	/** Ensures the `teams` array exists on the gamestate and returns it. */
	ensureTeams(): any[] {
		if (!Array.isArray(this.gameStateRef.teams)) this.gameStateRef.teams = [];
		return this.gameStateRef.teams;
	}

	/**
	 * Appends a raw player object to the players array.
	 * @returns A `PlayerReader` wrapping the added player.
	 */
	addPlayer(player: any): PlayerReader {
		this.ensurePlayers().push(player);
		return new PlayerReader(player);
	}

	/**
	 * Appends a raw team object to the teams array.
	 * @returns A `TeamReader` wrapping the added team.
	 */
	addTeam(team: any): TeamReader {
		this.ensureTeams().push(team);
		return new TeamReader(team);
	}

	/** Returns the underlying raw gamestate object. */
	raw(): GameState {
		return this.gameStateRef;
	}

	/**
	 * Overwrites server-authoritative fields (slug, player identities, team identities)
	 * on this gamestate from `previous`, preventing the game logic from accidentally
	 * altering data that only the server is allowed to set.
	 * @param previous - The previous trusted gamestate snapshot.
	 */
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

/**
 * Convenience factory that wraps a raw gamestate object in a `GameStateReader`.
 * @param gamestate - The raw gamestate object.
 * @returns A new `GameStateReader` instance.
 */
export function gs(gamestate: any): GameStateReader {
	return new GameStateReader(gamestate);
}

export default gs;
