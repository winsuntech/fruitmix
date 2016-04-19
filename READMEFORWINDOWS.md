### How To Deploy This FruitMix & Eat It

***

##### precondition:

* Windows 7 64bit

##### Ingrediants:

* Git
* Node.js
* MongoDB
* Python
* Microsoft Windows SDK for Windows 7 and .NET Framework 3.5

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

* Download<p>
Offical Website: [Click](https://www.mongodb.org/)<p>
Download Page: [Click](https://www.mongodb.org/downloads#production)<p>
Download Path: [Download mongodb-win32-x86_64-3.2.5-signed.msi](https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-3.2.5-signed.msi?_ga=1.28698047.200223928.1460971256)<p>
* Install<p>
`Use default setting, consecutive press "next" button until you see the "finish" button.`<p>

##### Deploy Python

* Download<p>
Offical Website: [Click](https://www.python.org/)<p>
Download Path: [Download Python 2.7.11](https://www.python.org/ftp/python/2.7.11/python-2.7.11.msi)<p>
* Install<p>
`Use default setting, consecutive press "next" button until you see the "finish" button.`<p>

##### Deploy Microsoft Windows SDK for Windows 7 and .NET Framework 3.5

* Download<p>
Offical Website: [Click](http://www.microsoft.com/en-us/download/details.aspx?id=8279)<p>
Download Path: [Download winsdk_web.exe](https://download.microsoft.com/download/A/6/A/A6AC035D-DA3F-4F0C-ADA4-37C8E5D34E3D/winsdk_web.exe)<p>
* Install<p>
`Use default setting, consecutive press "next" button until you see the "finish" button.`<p>

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
