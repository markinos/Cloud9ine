//node modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var mysql = require('mysql');
var session = require('express-session');
var q = require('q');

//setup heroku database
var pool = mysql.createPool({
  	host     : 'thaijaso.vergil.u.washington.edu',
    port     : '8865',
  	user     : 'root',
  	password : 'ou8inxs2ic',
  	database : 'GradTrack'
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

//serve static css, image, and js files from admin template 
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

//login page
app.get('/login', function(req, res) {
	res.render('login.ejs');

});

app.post('/login', function(req, res) {
	var email = req.body.email;
    var password = req.body.password;

    pool.getConnection(function(err, connection) {
        connection.query("SELECT * FROM Faculty WHERE Faculty.email = " + "'" + email + "'" + "AND Faculty.password = " + "'" + password + "'", function(err, rows) {
            if (err) {
                console.log(err);
                res.render('/login', { err: err.message } );
            }

            //user found
            if (rows.length) {
                //set session data
                req.session.userId = rows[0].id;
                req.session.email = rows[0].email;
                req.session.firstName = rows[0].firstName;
                req.session.lastName = rows[0].lastName;
                res.redirect('/dashboard');
            } else {
                console.log('user not found');
                res.send('error user not found');
            }
            connection.release();
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
        connection.query("INSERT INTO Faculty (email, password) VALUES ('" + email + "'" + "," + "'" + password + "'" + ")", function(err, rows) {
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

        var faculty = {
            'userId': req.session.userId,
            'email': req.session.email,
            'firstName': req.session.firstName,
            'lastName': req.session.lastName
        };

        res.render('dashboard.ejs', faculty);
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
		connection.query('SELECT * FROM Graduate', function(err, rows) {

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

app.get('/report', function(req, res) {
    if (req.session.userId) {
         00d381b8079f650afcfd70e009d5ef2026de4ae3

        //get user info
        var user = {
            'id': req.session.userId,
            'email': req.session.email,
            'firstName': req.session.firstName,
            'lastName': req.session.lastName
        };

        pool.getConnection(function(error, connection) {
            if (error) {
                res.send(error);
            } else {
                //query for total grads and faculty
                q.all([getTotalGrads(connection), getTotalFaculty(connection)]).then(function(results) {
                    var totalGrads = results[0][0][0].total;
                    var totalFaculty = results[1][0][0].total;

                    //
                    q.all([getTotalSentSurveys(connection)]).then(function(results) {
                        var totalSentSurveys = results[0][0][0].total;
                        console.log(totalSentSurveys);

                        //set up data from queries to be passed into view
                        var data = {
                            'totalGrads': totalGrads,
                            'totalFaculty': totalFaculty,
                            'totalSentSurveys': totalSentSurveys,
                            'user': user
                        }

                        //render page and pass in data
                        res.render('report.ejs', data);
                    }).catch(function(error) {
                        res.send(error);
                    });
                }).catch(function(error) {
                    res.send(error);
                });
            }
            connection.release();
        });
    } else {
        res.redirect('/login');
    }
});

/**
 * Get the total number of graduates in the database
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalGrads(connection) {
    var defered = q.defer();
    connection.query('SELECT COUNT(*) AS total FROM Graduate', defered.makeNodeResolver());
    return defered.promise;
}

/**
 * Get the total number of faculty in the database
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalFaculty(connection) {
    var defered = q.defer();
    connection.query('SELECT COUNT(*) AS total FROM Faculty', defered.makeNodeResolver());
    return defered.promise;
}

/**
 * Get the total number of surveys sent.
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalSentSurveys(connection) {
    var defered = q.defer();
    connection.query('SELECT COUNT(*) AS total FROM Survey', defered.makeNodeResolver());
    return defered.promise;
}

/**
 * Get the ratio of number of surveys completed over sent.
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getSurveysCompletedPercent(connection) {

}

/**
 * Get the total number of graudates in Computer Science
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalGradsInCSS(connection) {
    var defered = q.defer();
    connection.query('')
}

/**
 * Get the total number of graduates in Computer Engineering.
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalGradsInCE(connection) {

}

/**
 * Get the total number of graduates in Information Techonology
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalGradsInIT(connectinon) {

}

/**
 * Get the total number of graduates in Electrical Engineering
 *
 * @param connection is the mysql connection object for querying
 * @return a promise, to be executed once the query is finished executing
 */
function getTotalGradsInEE(connection) {

}





