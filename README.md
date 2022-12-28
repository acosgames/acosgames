
## ACOS Simulator

<a href="https://acos.games/"><img src="https://cdn.acos.games/file/acospub/acos-logo-combined.png"></a>

[View Documentation](https://docs.acos.games)

https://user-images.githubusercontent.com/1610876/209871930-1e88e11c-c54a-41bf-a5a5-ce5c6f9e3903.mp4

This package must be run from your game project.   

The builds directory structure is required in your project:

![image](https://user-images.githubusercontent.com/1610876/209872419-44028f68-e644-45f1-ac4c-faf6c096680a.png)

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


