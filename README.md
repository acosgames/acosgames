
## About

This package must be run from your game project.   

The builds directory structure is required in your project:

![image](https://user-images.githubusercontent.com/1610876/148656053-72246d14-9b51-4ebf-acb9-ab560b3fa64c.png)

**client.bundle.js** will be loaded inside an `<iframe>`.

**server.bundle.js** will be loaded on the server-side of simulator.  

Your code on both client and server must be bundled into a single js file.

[View our documentation](https://docs.acos.games)

--- 

## Install 

```bash
npm install acosgames --save
```

--- 

## Running the simulator from game project

```bash
node --enable-source-maps ./node_modules/acosgames/simulator/server.js
```


## Find out more 

[Chat with us on Discord](https://discord.gg/ydHkCcNgHD)


