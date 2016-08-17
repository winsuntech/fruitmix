import fs from 'fs';
import chai from 'chai';
import path from 'path';
import UUID from 'node-uuid';
import xattr from 'fs-xattr';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import validator from 'validator';
import {
	readTimeStamp,
	readXstat,
	updateXattrOwner,
	updateXattrPermission,
	updateXattrHash,
	testing
} from '../../src/lib/xstat.js';

const debug = true;
const expect = chai.expect;
const FRUITMIX = 'user.fruitmix';
const uuidArr = [
	UUID.v4(),
	UUID.v4(),
	UUID.v4(),
	UUID.v4(),
	UUID.v4(),
	UUID.v4(),
	UUID.v4()
];
const sha256_1 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
const isUUID = (uuid) => (typeof uuid === 'string') ? validator.isUUID(uuid) : false;

describe('xstat.js', function(){

	let cwd = process.cwd();
	let tmpFoder = 'tmpFoder';
	let tmpFile = 'tmpFile.js';
	let fpath = path.join(cwd, tmpFoder);
	let ffpath = path.join(fpath, tmpFile);

	describe('readTimeStamp', function(){
		let timeStamp;
		before(function(done){
			let uuid = UUID.v4();
			rimraf(tmpFoder, function(err){
				if (err) { return done(err); }
				mkdirp(tmpFoder ,function(err){
					if (err) { return done(err); }
					fs.stat(fpath, function(err, stats){
						if (err) { return done(err); }
						timeStamp = stats.mtime.getTime();
						done();
					});
				});
			});
		});
		it('should read timeStamp', function(done){
			readTimeStamp(fpath, function(err, mtime){
				if (err) { return done(); }
				expect(mtime).to.equal(timeStamp);
				done();
			});
		});
	});

	describe('readXstat', function(){

		beforeEach(done => {
			rimraf(tmpFoder, err => {
				if (err) return done(err);
				mkdirp(tmpFoder, err => {
					if (err) return done(err);
					done();
				});
			});
		});

		after(function(){
			rimraf(tmpFoder, err => {
				if(err) throw new Error('delete testFoder failed');
			});
		});

		it('should return null if the second argument is null', function(done){
			readXstat(fpath, null, function(err, attr){
				if (err) { return done(err); }
				expect(attr).to.be.null;
				done();
			});
		});

		it('should return default object if xattr non-exist', function(done){
			readXstat(fpath, function(err, attr){
				if (err) { return done(err); }
				expect(isUUID(attr.uuid)).to.be.true;
				expect(attr.isDirectory()).to.be.ture;
				expect(attr.abspath).to.equal(fpath);
				expect(attr.owner).to.be.a('array');
				done();
			});
		});

		it('should return preset object', function(done){
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				name: 'panda',
				age : 23
			}), function(err){
				if (err) { return done(err); }
				readXstat(fpath, function(err, attr){
					if (err) { return done(err); }
					expect(attr.name).to.equal('panda');
					expect(attr.age).to.equal(23);
					expect(attr.isDirectory()).to.be.ture;
					expect(attr.abspath).to.equal(fpath);
					done();
				});
			});
		});

		it('should return error if owner not provided', function(done){
			readXstat(fpath, {}, function(err, attr){
				expect(err).to.be.an('error');
				done();
			});
		});

		it('should return error if the second argument is not an object or undefind', function(done){
			readXstat(fpath, 'handsome boy', (err, attr) => {
				expect(err).to.be.an('error');
				done();
			});
		});

		it('should return a new uuid if preset uuid is a string', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: 'panda',
				owner: [uuidArr[0]]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(isUUID(attr.uuid)).to.be.true;
					expect(attr.owner).to.deep.equal([uuidArr[0]]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return a new uuid if preset uuid is an object', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: { name: 'panda' },
				owner: [uuidArr[0]]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(isUUID(attr.uuid)).to.be.true;
					expect(attr.owner).to.deep.equal([uuidArr[0]]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return a new uuid if preset uuid is an array', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: [],
				owner: [uuidArr[0]]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(isUUID(attr.uuid)).to.be.true;
					expect(attr.owner).to.deep.equal([uuidArr[0]]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return preset uuid(uuid,owner)', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[1],
				owner: [uuidArr[0]]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.uuid).to.deep.equal(uuidArr[1]);
					expect(attr.owner).to.deep.equal([uuidArr[0]]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return empty array if perset owner is an object', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: { name: 'panda' }
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return empty array if perset owner is an undefined', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: undefined
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return empty array if perset owner is an uuid', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: uuidArr[0]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return empty array if perset owner is an empty array', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: []
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return empty array if perset owner is an object array', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: [{ name: 'panda' }]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return preset array', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: [uuidArr[1], uuidArr[2]]
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([uuidArr[1], uuidArr[2]]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return preset array without is not uuid', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: [uuidArr[1], uuidArr[2],'panda']
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.owner).to.be.deep.equal([uuidArr[1], uuidArr[2]]);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return undefined if cwd is a folder(because folder without hash attribute)', done => {
			xattr.set(fpath, FRUITMIX, JSON.stringify({
				uuid: uuidArr[0],
				owner: [uuidArr[1]],
				hash: sha256_1
			}), err => {
				if(err) return done(err);
				readXstat(fpath, (err, attr) => {
					if(err) return done(err);
					expect(attr.uuid).to.be.deep.equal(uuidArr[0]);
					expect(attr.owner).to.be.deep.equal([uuidArr[1]]);
					expect(attr.writelist).to.be.an('undefined');
					expect(attr.readlist).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					expect(attr.hash).to.be.an('undefined');
					expect(attr.abspath).to.deep.equal(fpath);
					done();
				});
			});
		});

		it('should return undefined if htime non-exist', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						hash: sha256_1
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.be.an('undefined');
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return preset value', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						hash: sha256_1,
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.deep.equal(sha256_1);
							expect(attr.htime).to.deep.equal(stat.mtime.getTime());
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return undefined if hash value is a string', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						hash: 'panda',
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.be.an('undefined');
							expect(attr.htime).to.be.an('undefined');
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return undefined if hash value is an object', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						hash: { name: 'panda' },
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.be.an('undefined');
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return undefined if hash value is an array', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						hash: [],
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.be.an('undefined');
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return all preset value(uuid,owner,writelist,readlist,hash,htime,abspath)', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						writelist: [uuidArr[2]],
						readlist: [uuidArr[3]],
						hash: sha256_1,
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.deep.equal([uuidArr[2]]);
							expect(attr.readlist).to.deep.equal([uuidArr[3]]);
							expect(attr.hash).to.deep.equal(sha256_1);
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return undefined if readlist is undefined', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						writelist: [uuidArr[2]],
						hash: sha256_1,
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.deep.equal(sha256_1);
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});

		it('should return undefined if writelist is undefined', done => {
			fs.writeFile(ffpath, '', (err) => {
				if(err) return done(err);
				fs.stat(ffpath, (err,stat) => {
					xattr.set(ffpath, FRUITMIX, JSON.stringify({
						uuid: uuidArr[0],
						owner: [uuidArr[1]],
						readlist: [uuidArr[2]],
						hash: sha256_1,
						htime: stat.mtime.getTime()
					}), err => {
						if(err) done(err);
						readXstat(ffpath, (err, attr) => {
							expect(attr.uuid).to.deep.equal(uuidArr[0]);
							expect(attr.owner).to.deep.equal([uuidArr[1]]);
							expect(attr.writelist).to.be.an('undefined');
							expect(attr.readlist).to.be.an('undefined');
							expect(attr.hash).to.deep.equal(sha256_1);
							expect(attr.abspath).to.deep.equal(ffpath);
							done();
						});
					});
				});
			});
		});


		
	});

});
