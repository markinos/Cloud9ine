var app = require('express')();
var path = require('path');
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var mysql = require('mysql');

//setup heroku database
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

//serve static files in the public folder
app.use('/public', require('express').static(path.join(__dirname + '/public')));

// redirect CSS bootstrap
app.use('/css', require('express').static(__dirname + '/node_modules/bootstrap/dist/css')); 


//middleware for passing data bewteen routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

server.listen(app.get('port'), function() {
	console.log('listening on port:', app.get('port'));
});



//login page
app.get('/', function (req, res) {
  	res.render('login.ejs');
});

app.post('/login', function(req, res) {
	 var email = req.body.email;
    var password = req.body.password;

    pool.getConnection(function(err, connection) {
        connection.query("SELECT * FROM faculty WHERE faculty.email = " + "'" + email + "'" + "AND faculty.password = " + "'" + password + "'", function(err, rows) {
            if (err) {
                console.log(err);
            } else {
                console.log(rows);
            }

            //user found
            if (rows.length) {
                console.log('user found');
                // req.session.userId = rows[0].id;
                // console.log(req.session.userId);
               
                res.redirect('/homepage');
            } else {
                console.log('user not found');
                res.send('error user not found');
            }

        });
    });

});

//register page
app.get('/register', function(req, res) {
	res.render('register.ejs');
});


//POST to register
app.post('/register', function(req, res) {
	// console.dir(req.body);
	console.log("email: " + req.body.email);
	console.log("password: " + req.body.password);

	// getting inputted username and pass
	var email = req.body.email;
	var password = req.body.password;

	// connect and insert into database
	 pool.getConnection(function(err, connection) {
        connection.query("INSERT INTO faculty (email, password) VALUES ('" + email + "'" + "," + "'" + password + "'" + ")", function(err, rows) {
            if (err) {
                console.log(err);
            } else {
                console.log(rows);
                console.log("User was successfully registered")
                res.redirect('/'); // once registered redirect to login page
            }

            // verify user doesnt already have an account
            // verify it is a valid email address
            // verify @ and .com/.edu/.net/.org included aka it is a complete email
            connection.release();
        });

    });
});

//homepage
app.get('/homepage', function(req, res) {
	res.render('homepage.ejs');

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

