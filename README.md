
## ACOS Simulator

<a href="https://acos.games/"><img src="https://cdn.acos.games/file/acospub/acos-logo-combined.png"></a>

[View Documentation](https://docs.acos.games)

https://user-images.githubusercontent.com/1610876/209870446-b16eb536-cd8f-4cd4-a99d-c30ab8a97659.mp4

This package must be run from your game project.   

The builds directory structure is required in your project:

![image](https://user-images.githubusercontent.com/1610876/148656053-72246d14-9b51-4ebf-acb9-ab560b3fa64c.png)

Your code for both client and server must each be bundled into a single js file.

### **client.bundle.js** 

will be loaded inside an `<iframe>` at the end of the `<body>` tag.  
- There is a `<div id="root">` tag that should be targetted by your front end framework.

### **server.bundle.js**

will be loaded on the server-side of simulator.  



[View TicTacToe code for example usage](https://github.com/acosgames/tictactoe)

[View Memorize Up code for example usage](https://github.com/acosgames/memorize-up)

--- 

## Install 

```bash
npm install acosgames --save-dev
```


## Running the simulator

Note: You must run this from inside of your game project in same folder as the package.json file.

```bash
npx acos
```


## Community

[Chat with us on Discord](https://discord.gg/ydHkCcNgHD)


