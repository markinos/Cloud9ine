var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var mysql = require('mysql');
var session = require('express-session');

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

//serve static css, image, and js files in the public folder
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/js/pages', express.static(__dirname + '/js/pages'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/fonts', express.static(__dirname + '/public/fonts'));

app.use('/plugins/iCheck/flat/', express.static(__dirname + '/plugins/iCheck/flat/'));
app.use('/plugins/morris', express.static(__dirname + '/plugins/morris'));
app.use('/plugins/jvectormap', express.static(__dirname + '/plugins/jvectormap'));
app.use('/plugins/datepicker', express.static(__dirname + '/plugins/datepicker'));
app.use('/plugins/daterangepicker', express.static(__dirname + '/plugins/daterangepicker'));
app.use('/plugins/bootstrap-wysihtml5', express.static(__dirname + '/plugins/bootstrap-wysihtml5'));
app.use('/plugins/sparkline', express.static(__dirname + '/plugins/sparkline'));
app.use('/plugins/knob', express.static(__dirname + '/plugins/knob'));
app.use('/plugins/slimScroll', express.static(__dirname + '/plugins/slimScroll'));
app.use('/plugins/fastclick', express.static(__dirname + '/plugins/fastclick'));
app.use('/plugins/chartjs', express.static(__dirname + '/plugins/chartjs'));
app.use('/plugins/datatables', express.static(__dirname + '/plugins/datatables'));


// serve bootstrap css/javascript and jquery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); 
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); 
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); 

//middleware for passing data bewteen route
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//use session middleware for persistent login
app.use(session({
    secret: 'keyboard cat', 
    cookie: {maxAge: 86400000}, //24hrs
    resave: false,
    saveUninitialized: false
}));

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

    console.log(email);
    console.log(password);

    pool.getConnection(function(err, connection) {
        connection.query("SELECT * FROM faculty WHERE faculty.email = " + "'" + email + "'" + "AND faculty.password = " + "'" + password + "'", function(err, rows) {
            if (err) {
                console.log(err);
                res.render('/login', { err: err.message } );
            } else {
                console.log(rows);
            }

            //user found
            if (rows.length) {
                console.log('user found');
                req.session.userId = rows[0].id;
                req.session.email = rows[0].email;
                req.session.firstName = rows[0].firstName;
                req.session.lastName = rows[0].lastName;
                res.redirect('/dashboard');
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
                console.log("User was successfully registered");
                res.redirect('/'); // once registered redirect to login page
            }

            // verify user doesnt already have an account
            // verify it is a valid email address
            // verify @ and .com/.edu/.net/.org included aka it is a complete email
            connection.release();
        });

    });
});

//dashboard - first page faculty sees after login
app.get('/dashboard', function(req, res) {
    if (req.session.userId) {
        res.render('dashboard.ejs');
    } else {
        res.redirect('/');
    }
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

				//release connection to db
				connection.release();
				
				//pass graduates object to graduate view
				res.render('graduate.ejs', graduates);
			}
		});
	});	
});

//report
app.get('/report', function (req, res) {
    //connect to database
    pool.getConnection(function(error, connection) {
        
        //query database
        connection.query('SELECT COUNT(*) AS total FROM graduate', function(err, rows) {

            //error querying
            if (err) {
                console.log(err);
                res.send(err);
            } else {
    
                var totalGrads = rows[0].total;

                var graduates = {
                    'totalGrads': totalGrads
                };

                console.log(graduates);

                //release connection to db
                connection.release();
                
                //render page and pass in graudate info
                res.render('report.ejs', graduates);
            }
        });
    }); 
    
});

