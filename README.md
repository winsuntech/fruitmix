### How to make this FruitMix

***

##### precondition:

* Debian 8.3 64bit
* Ubuntu 14.04 64bit

##### Ingrediants:

* Node.js
* Git
* MongoDB

***

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
        
##### Deploy Git

* Install<p>
`(sudo) apt-get install git`<p>

* Clone this recipes to your own system<p>
`git clone git@github.com:winsuntech/fruitmix.git`<p>

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
