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
// const uuidArr = [
// 	'55658e02-a808-458d-8634-3e06e8133c08',
// 	'a9908696-317f-43d4-bbaf-b4dd802121d5',
// 	'85e0f699-1566-40a6-8d98-36a0353cd86f',
// 	'5c4e8196-0d3f-4730-a949-4c9618d3505e',
// 	'f03492f8-81d3-4223-94c9-c8768dd9f214',
// 	'58606e3c-bbbc-4eae-b65a-fabbc7caf816',
// 	'5fce974c-e0f6-4903-8a31-cf6c983b6855',
// 	'2cc82128-a785-421a-a362-8b137d666aa0',
// 	'96c90a58-6456-4e70-89b9-248032c4ebaa'
// ];
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
	let tmpFoder = 'tmptest';
	let fpath = path.join(cwd, tmpFoder);

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

		const beforeTODO = (done, callback) => {
			rimraf(tmpFoder, err => {
				if (err) return done(err);
				mkdirp(tmpFoder, err => {
					if (err) return done(err);
					callback();
				})
			})
		};

		it('should return null if the second argument is null', function(done){
			beforeTODO(done, () => {
				readXstat(fpath, null, function(err, attr){
					if (err) { return done(err); }
					expect(attr).to.be.null;
					done();
				});
			});
		});

		it('should return default object if xattr non-exist', function(done){
			beforeTODO(done, () => {
				readXstat(fpath, function(err, attr){
					if (err) { return done(err); }
					expect(isUUID(attr.uuid)).to.be.true;
					expect(attr.isDirectory()).to.be.ture;
					expect(attr.abspath).to.equal(fpath);
					expect(attr.owner).to.be.a('array');
					done();
				});
			});
		});

		it('should return preset object', function(done){
			beforeTODO(done, () => {
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
		});

		it('should return error if owner not provided', function(done){
			beforeTODO(done, () => {
				readXstat(fpath, {}, function(err, attr){
					expect(err).to.be.an('error');
					done();
				});
			});
		});

		it('should return null if xattr is not valid json', function(done){
			beforeTODO(done, () =>{
				xattr.set(fpath, FRUITMIX, 'handsome boy', err => {
					if (err) return done(err);
					readXstat(fpath, (err, attr) => {
						if(err) return done(err);
						expect(attr).to.be.null;
						done();
					});
				});
			});
		});

		it('should return error if the second argument is not an object or undefind', function(done){
			beforeTODO(done, () => {
				readXstat(fpath, 'handsome boy', (err, attr) => {
					expect(err).to.be.an('error');
					done();
				});
			})
		});

		it('should return preset owner', function(done){
			rimraf(tmpFoder, err => {
				if (err) return done(err);
				mkdirp(tmpFoder, err => {
					if (err) return done(err);
					xattr.set(fpath, FRUITMIX, JSON.stringify({
						age: 20
					}), err => {
						if (err) return done(err);
						let opt = {
							owner : [uuidArr[0]],
							writelist : [uuidArr[1]],
							readlist : [uuidArr[2]]
						};
						readXstat(fpath, opt, (err, attr) => {
							if (err) return done(err);
							expect(attr.owner).to.be.equal(uuidArr[0]);
							expect(attr.writelist).to.be.equal(uuidArr[1]);
							expect(attr.readlist).to.be.equal(uuidArr[2]);
							done();
						});
					})
				})
			})
		});

		
	});

});
