'use strict';

//during the test the env variable is set to test
process.env.NODE_ENV = 'test';
//db
const mysql = require('mysql');

//require dev-dependecies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();

chai.use(chaiHttp);

describe('GradTrack', () => {

	//Test the GET / route
	describe('GET /', () => {
		it('it should GET the home/login page', (done) => {
			chai.request(server)
				.get('/')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the POST /login route
	describe('POST /login', () => {
		it('it should POST a new graduate to the database', () => {
			let graduate = {
				email: 'test@uw.edu',
				password: 'password',
			};
			
			chai.request(server)
				.post('/login')
				.send(graduate)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the POST /register route
	describe('POST /register', () => {
		it('it should POST a new graduate to the database', () => {
			let graduate = {
				firstName: 'firstTest',
				lastName: 'lastTest',
				email: 'test@uw.edu',
				password: 'password',
				comfirmPassword: 'password'
			};
			
			chai.request(server)
				.post('/register')
				.send(graduate)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the GET /dashboard route
	describe('GET /dashboard', () => {
		it('it should GET the dashboard view', () => {		
			chai.request(server)
				.get('/dashboard')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the GET /survey route
	describe('GET /survey', () => {
		it('it should GET the survey view', () => {		
			chai.request(server)
				.get('/survey')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});


	//Test the GET /graduate route
	describe('GET /graduates', () => {
		it('it should GET the graduate view', () => {		
			chai.request(server)
				.get('/graduates')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the POST /dashboard route
	describe('POST /graduates', () => {
		it('it should add the graduate to the database', () => {		
			chai.request(server)
				.post('/graduates')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the GET /delete route
	describe('GET /delete', () => {
		it('it should GET the graduate view', () => {		
			chai.request(server)
				.get('/delete')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the GET /delete route
	describe('POST /delete', () => {
		it('it should POST and delete a graduate from the database', () => {		
			chai.request(server)
				.post('/delete')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	//Test the GET /dashboard route
	describe('GET /report', () => {
		it('it should GET the report view', () => {		
			chai.request(server)
				.get('/report')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});


	

});