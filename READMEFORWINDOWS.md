### How To Deploy This FruitMix & Eat It

***

##### precondition:

* Windows 7 64bit

##### Ingrediants:

* Git
* Node.js
* MongoDB

***

##### Deploy Git

* Download<p>
Offical Website: [Click](https://git-for-windows.github.io/)<p>
Download Path: [Download Git-2.8.1-64-bit.exe](https://github.com/git-for-windows/git/releases/download/v2.8.1.windows.1/Git-2.8.1-64-bit.exe)<p>
* Install<p>
`Use default setting, consecutive press "next" button until you see the "finish" button.`<p>

##### Deploy Node.js

* Download<p>
Offical Website: [Click](https://nodejs.org/en/)<p>
Download Path: [Download v5.10.1](https://nodejs.org/dist/v5.10.1/node-v5.10.1-x64.msi)<p>
* Install<p>
`Use default setting, consecutive press "next" button until you see the "finish" button.`<p>

##### Deploy MongoDB



##### Let's cook

+ Enter the project<p>
`cd fruitmix`<p>

+ Install essential libs<p>
 - Method 1: Don't use package.json<p>
 `npm install --save bcrypt body-parser debug nodemon  express jwt-simple mongoose morgan node-uuid passport passport-http passport-jwt serve-favicon validator`<p>
 `npm install --save-dev mocha chai sinon supertest`<p>
 - Method 2: use package.json<p>
 `npm install`<p>

+ Run server<p>
`npm run start`<p>
`npm run test-server`<p>
`npm run unit`<p>
`npm run agent`<p>
`npm run production`<p>

##### Enjoy!
