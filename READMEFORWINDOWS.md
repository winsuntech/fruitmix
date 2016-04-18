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

* Install<p>
Offical Website: [Click](https://git-for-windows.github.io/)<p>
Download Path: [Download Git-2.8.1-64-bit.exe](https://github.com/git-for-windows/git/releases/download/v2.8.1.windows.1/Git-2.8.1-64-bit.exe)<p>
`Use default setting, and press "next" button until you see the "finished" button.`<p>

##### Deploy Node.js

* Download nodejs v5.8.0 source code<p>
`curl https://nodejs.org/dist/v5.8.0/node-v5.8.0.tar.gz -o node-v5.8.0.tar.gz`<p>

* Untar<p>
`tar -zxvf node-v5.8.0.tar.gz -C ./`<p>

* Enter the folder<p>
`cd node-v5.8.0/`<p>

* make & install Node.js to your system<p>

        ./configure
        make
        (sudo) make install
        

##### Deploy MongoDB

* Import the public key used by the package management system<p>
`sudo apt-key adv --keyserver 'keyserver.ubuntu.com' --recv '7F0CEB10'`<p>

* Create a /etc/apt/sources.list.d/mongodb-enterprise.list file for MongoDB<p>
`echo 'deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main' | sudo tee '/etc/apt/sources.list.d/mongodb-org-3.2.list'`<p>

* Reload local package database<p>
`sudo apt-get update`<p>

* Install the MongoDB packages<p>
`sudo apt-get install -y mongodb-org`<p>

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
