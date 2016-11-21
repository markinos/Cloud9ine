var app = require('express')();
var path = require('path');
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var mysql = require('mysql');

//connect to heroku database
var pool = mysql.createPool({
  	host     : 'us-cdbr-iron-east-04.cleardb.net',
  	user     : 'b888ca48365de9',
  	password : '04f53f1a',
  	database : 'heroku_8af57d2bbf38f19'
});

//setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8888);

//login page
app.get('/', function (req, res) {
  	res.render('login.ejs');
});

//register page
app.get('/register', function(req, res) {
	res.render('register.ejs');
});

//survey page
app.get('/survey', function(req, res) {
	res.render('survey.ejs');
});

//graduates page
app.get('/graduates', function(req, res) {
	//connect to database
	pool.getConnection(function(error, connection) {
		//query database
		connection.query('SELECT * FROM graduate', function(err, rows) {

			//error querying
			if (err) {
				console.log(err);
				res.send(err);
			} else {
	
				var graduates = {
					'graduates': rows
				};

				console.log(graduates);

				//release connection to db
				connection.release();
				
				//pass graduates object to graduate view
				res.render('graduate.ejs', graduates);
			}
		});
	});	
});

//report
app.get('/report', function(req, res) {
	res.render('report.ejs');
});

//serve static files in the public folder
app.use('/public', require('express').static(path.join(__dirname + '/public')));

//middleware for passing data bewteen routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

server.listen(app.get('port'), function() {
	console.log('listening on port:', app.get('port'));
});
