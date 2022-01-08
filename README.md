
## About

This package must be run from your game project.   

The builds directory structure is required in your project:

![image](https://user-images.githubusercontent.com/1610876/148656053-72246d14-9b51-4ebf-acb9-ab560b3fa64c.png)

Your code on both client and server must be bundled into a single js file.

### **client.bundle.js** 

will be loaded inside an `<iframe>` at the end of the `<body>` tag.  
- There is a `<div id="root">` tag that should be targetted by your front end framework.

### **server.bundle.js**

will be loaded on the server-side of simulator.  



[View our documentation](https://docs.acos.games)

--- 

## Install 

```bash
npm install acosgames --save
```


## Running the simulator

Note: You must run this from inside of your game project in same folder as the package.json file.

```bash
node --enable-source-maps ./node_modules/acosgames/simulator/server.js
```


## Find out more 

[Chat with us on Discord](https://discord.gg/ydHkCcNgHD)


