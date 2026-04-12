# @acosgames/framework

Framework package for building ACOS multiplayer game clients and server logic.

It is designed to be used together with @acosgames/simulator for local development and deployment to the acos.games platform.

## What This Package Provides

- ACOSClient: browser-side helper API for sending/receiving game messages.
- ACOSServer: server-side game API for action handling, gamestate updates, timers, events, and game end conditions.
- GameStateReader and helpers: structured read/write access to game state.
- GameStatus enum: room status constants for client and server logic.

## Install

From your game project:

```bash
npm install @acosgames/framework @acosgames/simulator
```

## Module Support (ESM + CJS)

This package ships both ESM and CommonJS builds through package exports.

- ESM consumers use import
- CJS consumers use require

No subpath import is needed. Use only the package name.

```js
import { ACOSClient, ACOSServer, GameStatus } from "@acosgames/framework";
```

## Expected Game Project Layout

Your game project should output two bundles:

```text
builds/
	client.bundle.js
	server.bundle.js
```

- client.bundle.js is loaded in the simulator iframe
- server.bundle.js is executed in the simulator game worker

## Client-Side Quick Start

```js
import { ACOSClient, GameStatus } from "@acosgames/framework";

ACOSClient.listen((game, newStatus) => {
	if (newStatus && game.room.status === GameStatus.gamestart) {
		// update local UI state
	}
});

// tell simulator client is ready
ACOSClient.ready();

// send user action to server
ACOSClient.send("pick", 4);
```

## Server-Side Quick Start

```js
import { ACOSServer } from "@acosgames/framework";

ACOSServer.init();

ACOSServer.on("gamestart", () => {
	const gs = ACOSServer.gamestate();
	gs.state("cells", ["", "", "", "", "", "", "", "", ""]);
	gs.setNextPlayer(0);
	gs.setNextAction("pick");
	gs.room().setTimerSet(15);
});

ACOSServer.on("pick", (action) => {
	const gs = ACOSServer.gamestate();
	const player = gs.player(action.user.id);
	if (!player) return false;

	// your game logic
	return true;
});

ACOSServer.save();
```

## Local Development With Simulator

In your game project, a common setup is:

```json
{
	"scripts": {
		"start": "concurrently \"npm run client\" \"npm run server\" \"npx acos dev --type=vite\"",
		"client": "vite serve",
		"server": "npx rollup -c -w",
		"build": "npm run client:build && npm run server:build",
		"client:build": "vite build",
		"server:build": "npx rollup -c --environment NODE_ENV:production"
	}
}
```

Then run:

```bash
npm start
```

## Deploying To acos.games

After building both bundles:

```bash
npx acos deploy
```

Many projects use:

```json
{
	"scripts": {
		"deploy": "npm run build && npx acos deploy"
	}
}
```

## Build This Package (Contributors)

```bash
npm run build
```

This generates:

- dist/esm for ESM consumers
- dist/cjs for CommonJS consumers

## Links

- ACOS docs: https://sdk.acos.games
- Platform: https://acos.games
