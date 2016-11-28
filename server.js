//node modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const server = require('http').Server(app);
const mysql = require('mysql');
const session = require('express-session');
const async = require('async');

//setup heroku database
const pool = mysql.createPool({
  	host     : 'us-cdbr-iron-east-04.cleardb.net',
  	user     : 'b5a41b60cec771',
  	password : '29c6cc15',
  	database : 'heroku_50a8c0371a0e6f5'
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
app.use('/public', express.static(__dirname + '/public'));

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

	//for (var g = 0; g <997; g++) randomlyGenerateGraduate();

    pool.getConnection(function(err, connection) {
        connection.query("SELECT * FROM faculty WHERE faculty.email = " + "'" + email + "'" + "AND faculty.password = " + "'" + password + "'", function(err, rows) {
            if (err) {
                console.log(err);
                res.render('/login', { err: err.message } );
            }

            //user found
            if (rows.length) {
                //set session data
                req.session.user = {
                    'id': rows[0].id,
                    'email': rows[0].email,
                    'firstName': rows[0].firstName,
                    'lastName': rows[0].lastName
                }

                res.redirect('/dashboard');
            } else {
                console.log('user not found');
                res.send('error user not found');
            }
            connection.release();
        });
    });
});

//POST to register
app.post('/register', function(req, res) {
	// getting inputted username and pass
	var email = req.body.email;
	var password = req.body.password;
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;

    //console.log(email);
    //console.log(password);

	// connect and insert into database
	pool.getConnection(function(err, connection) {
        connection.query("INSERT INTO faculty (email, password, firstName, lastName) VALUES ('" + email + "'" + "," + "'" + password + "'" +  "," + "'" + firstName +
        					"'" + "," + "'" + lastName + "'" + ")", function(err, rows) {
            
            console.log('here');

            if (err) {
                console.log(err);
                res.send(err);
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
    if (req.session.user) {

        var faculty = req.session.user;

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
		connection.query('SELECT * FROM graduate', function(err, rows) {

			//error querying
			if (err) {
				console.log(err);
				res.send(err);
			}  
			else {
	
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


app.post('/addGrad', function(req, res) {

	console.dir(req.body);

	var id = req.body.studentId;
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var GPA = req.body.gpa;
	var program = req.body.program;
	var gradYear = req.body.gradYear;

	var gradTerm = req.body.gradTerm;
	var ethnicity = req.body.ethnicity;
	var age = req.body.age;
	var degree = req.body.degree;
	var generation = req.body.generation;
	var contact = req.body.radio;

	if(contact == "on") {
		contact = 1;
	} else {
		contact = 0;
	}

	/** This will insert a new graduate into the system. **/

	pool.getConnection(function(error, connection) {
		//query database
        connection.query("INSERT INTO graduate (studentId, firstName, lastName, email, gpa, program, gradTerm, gradYear, ethnicity, age, degree,"+
        	"generation, canContact)" + 
        	"VALUES ('" + id + "'" + "," + "'" + firstName + "'" + "," +"'"+ lastName + "'" + "," + "'" + email + "'" +
        	"," + "'" + GPA + "'" + "," + "'" + program + "'" + "," + "'" + gradTerm  + "'" + "," + "'" +  gradYear + "'" +
        	"," + "'" + ethnicity + "'" + "," + "'" + age + "'" + "," + "'" + degree + "'" + "," + "'" + generation + "'" + "," +
        	 "'" + contact + "'" + ")", function(err, rows) {

			//error querying
			if (err) {
				console.log(err);
				res.send(err);
			}
			else {
	
				console.log("Graduate was added!");

				req.session.user = {
					'canContact': contact
				}

				//release connection to db
				connection.release();
				res.redirect('/graduates');
				//pass graduates object to graduate view
				// res.render('graduate.ejs', graduates);
			}
		});
	});	

});


app.get('/delete', function(req, res) {
	res.render("graduate.ejs");

});

app.post('/delete', function(req, res) {

	console.dir("delete this id: " + req.body.gradId);

	var gradId = req.body.gradId;

	pool.getConnection(function(error, connection) {
		connection.query("DELETE FROM graduate WHERE studentId =" + "'" + gradId + "'" + ";", function(err, rows) {

			if(err) {
				console.log(err);
			} else {
				console.log( gradId + " was deleted");
				connection.release();

				res.redirect('/graduates');

			}

		});

	});

});

app.post('/editGrad', function(req, res) {

	console.dir("edit: " + req.body);

});

app.get('/report', function(req, res) { 
    if (req.session.user) {

        pool.getConnection(function(err, connection) {
           
           //perform asyncronous queries one by one 
           async.waterfall([    
                
                getTotalGrads(connection),
                getTotalFaculty,
                getTotalSurveys,
                getSurveysCompletedPercent,
                getTotalGradsWithBSCSS,
                getTotalGradsWithBSCES,
                getTotalGradsWithBSIT,
                getTotalGradsWithMSCSS,
                getTotalGradsWithBSEE,
                getTotalGradsWithBACSS
           
            ], function(err, connection, results) {
                if (err) {
                    console.log(err);
                    res.send(err);
                    return;
                } 

                //success
                results['user'] = req.session.user;
                connection.release();
                //res.render('report.ejs', results); 
                res.render('report.ejs', results);
            });
        });
    } else {
        res.redirect('/login');
    }   
});

/**
 * Get the total number of graduates in the database
 *
 * To be called first in the async.waterfall function!
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGrads(connection) {

    return function(callback) {

        connection.query("SELECT COUNT(*) AS total FROM graduate", function(err, rows) {
            //error with query
            if (err) {
                console.log(err);
                callback(err);
                return;
            }

            //successful query
            var results = {
                'totalGrads': rows[0].total
            }

            //calls test 2
            callback(null, connection, results);
        });
    }   
}

/**
 * Get the total number of graduates in the database
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalFaculty(connection, results, callback) {
    connection.query("SELECT COUNT(*) AS total FROM faculty", function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        console.log(rows[0].total);
        results['totalFaculty'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of surveys in the database
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalSurveys(connection, results, callback) {
    connection.query("SELECT COUNT(*) AS total FROM survey", function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalSurveys'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of completed surveys in the database
 * as a percentage
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getSurveysCompletedPercent(connection, results, callback) {
    var query = "SELECT ROUND((SELECT COUNT(*) FROM survey WHERE status = 'sent') / " + 
                    "COUNT(*) * 100) AS surveysCompletedPercent " +
                "FROM survey";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['surveysCompletedPercent'] = rows[0].surveysCompletedPercent;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduates with a Bachelors of
 * Science in Computer Science and Systems
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithBSCSS(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'CSS' AND degree = 'BS'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBSCSS'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of grads with a Bachelors of Science
 * in Computer Engineering and Systems
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithBSCES(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'CES' AND degree = 'BS'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBSCES'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of grads with a Bachelors of Science
 * in Information Technology
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithBSIT(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'IT' AND degree = 'BS'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBSIT'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of grads with a Masters
 * in Computer Science and Systems
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithMSCSS(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'CSS' AND degree = 'MS'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalMSCSS'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of grads with a Bachelors of Science
 * in Electrical Engineering
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithBSEE(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'EE' AND degree = 'BS'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBSEE'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of grads with a Bachelors of Science
 * in Electrical Engineering
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getTotalGradsWithBACSS(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE program = 'CSS' AND degree = 'BA'";

    connection.query(query, function(err, rows) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBACSS'] = rows[0].total;
        callback(null, connection, results);
    })
}

var maxYear = 2016;
var appMinYear = 1997;
var gradMinYear = 2001;

var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

var programs = ['CSS', 'CES', 'EE', 'IT'];
var degrees = ['BA', 'BS', 'MS'];
var terms = ['AUT', 'WIN', 'SPR', 'SUM'];

var firstNames = [  'Menaka', 'Jason', 'Shema', 'Travis', 'Mark', 'Chris', 'Vito', 'Lebron', 'Stephen', 'Alice', 'Russel',
                    'James', 'Mohib', 'Alexander', 'Steve', 'Elon', 'Rick', 'Tewodros', 'John', 'Mary', 'Loc', 'Connor',
                    'Ibrahim', 'Elisha', 'Elizabeth', 'Brandon', 'Nursultan', 'Jabo', 'Brian', 'Andrew', 'Michael', 'Susan',
                    'Monica', 'Ankur', 'Ingrid', 'Alan', 'Charles', 'Jieun', 'Humza', 'Demyan', 'Ryan', 'Vladislav', 'Taeler',
                    'Thomas', 'Tiffany', 'Benjamin', 'Patrick', 'Prabhjot', 'Sarah', 'Edgard', 'Nico', 'Nina', 'Jowy', 'Yau',
                    'Adam', 'Amy', 'Alec', 'Louis', 'Rocky', 'Marco', 'Donald', 'Rob', 'Asop', 'George', 'Susan', 'Ivanka',
                    'Hillary', 'Michelle', 'Samantha', 'Ingrid', 'Bridgette', 'Brittany', 'Alison', 'Rehina', 'Joraniah',
                    'Drew', 'Pak', 'Desiree', 'Vasika', 'Sayla', 'Cayla', 'Mercedes', 'Donia', 'Jennifer', 'Kesha', 'Luka',
                    'Gabriel', 'Bonginkosi', 'Aliaksandr', 'Ninaliezel', 'Aundraya', 'Noamio', 'Danille', 'Dana', 'Brandy',
                    'Ruth', 'Jose', 'Erlinda', 'Josh', 'Luke', 'Lyn', 'Pat', 'Haley', 'Lavaunte', 'Christina', 'Shaun',
                    'Ki', 'Brenda', 'Mengxiao'
];

var lastNames = [   'Abraham', 'Bada', 'Bui', 'Cox', 'Diabate', 'Gentry', 'Gibbons', 'Ho', 'Irgaliyev', 'Johnigan', 'Klonitsko',
                    'Kohi', 'Lambion', 'Lee', 'Lloyd', 'Mangrio', 'Pavlovskiy', 'Fowler', 'Peters', 'Schumer', 'Potter', 'Chau',
                    'Psarev', 'Quesada', 'Rezanejad', 'van Riper', 'Russell', 'Sanchez', 'Singh', 'Snyder', 'Solorzano', 'Tandyo',
                    'Thai', 'Tran', 'Tsang', 'Waldron', 'Walsh', 'Yang', 'Vishoot', 'Westbrook', 'Curry', 'James', 'Aeriola',
                    'Harden', 'Pierce', 'Jobs', 'Musk', 'Ross', 'Polo', 'Stone', 'Lao', 'Liu', 'King', 'Fergeson', 'Arnold',
                    'Hoffer', 'Cheng', 'Brown', 'Bobryk', 'Cardinal', 'Horakova', 'Chavez', 'Clark', 'Comer', 'Dahl', 'Evans',
                    'Fdhila', 'Fischer', 'Fitzpatrick', 'Gajic', 'Hentyarsa', 'Holman', 'Legaspi', 'Lo', 'McCord', 'McDonald',
                    'McMahon', 'Obama', 'Meyer', 'Miller', 'Clinton', 'Trump', 'Biden', 'Montgomery', 'Nuguse', 'Oliva', 'Roberts',
                    'Rowe', 'Sbory', 'Schilling', 'Taylor', 'Tippett', 'Wilson', 'Wong', 'Yun', 'Zhu'
];

var genders = ['Female', 'Male', 'Other'];
var ethnicities = ['Asian', 'African/Black', 'Caucasian/White', 'Native/Indigenous', 'Hispanic/Latino/a', 'Mixed', 'Pacific Islander', 'Other'];
var ages = ['<18', '18-23', '24-29', '30-39', '40-49', '50-59', '60+'];
var generations = ['1st', '2nd', 'Parent(s) Alumni'];

function randomlyGenerateGraduate() {
    pool.getConnection(function (err, connection) {
        var appDate = randomInt(appMinYear, maxYear - 2);
        var gradYear = randomInt(appDate + 2, maxYear);
        var status = 'current';
        var updatedMonth = randomInt(0, 12);
        var updatedAt = randomInt(gradYear, maxYear) + '-' + pad(updatedMonth + 1, 2) + '-' + pad(randomInt(1, monthDays[updatedMonth] + 1),2);
        var canContact = Math.random() < 0.9 ? 1 : 0;
        var contactStatus = 'updated';
        var canTrack = 1;
        var surveyFreq = 1;
        var firstName = firstNames[randomInt(0, firstNames.length)];
        var lastName = lastNames[randomInt(0, lastNames.length)];
        var UWemail = firstName.charAt(0) + lastName + '@uw.edu';
        var email = lastName + gradYear + '@gmail.com';
        var gpa = ((Math.random() * 2 + 2)+'').substr(0,4);
        var appMonth = randomInt(0,12);
        var appDate = appDate + '-' + pad(appMonth + 1, 2) + '-' + pad(randomInt(1, monthDays[appMonth] + 1),2);
        var program = programs[randomInt(0, programs.length)];
        var degree = degrees[randomInt(0, degrees.length)];
        var gradTerm = Math.random() < 0.7 ? 'SPR' : terms[randomInt(0, terms.length)];
        var gender = genders[Math.random() < 0.99 ? randomInt(0, 2) : 2];
        var ethnicity = ethnicities[randomInt(0, ethnicities.length)];
        var age = Math.random() < 0.6 ? '18-23' : ages[randomInt(0, ages.length)];
        var generation = generations[randomInt(0, generations.length)];
        var studentId = randomInt(1000000, 10000000);
        var stats = {
            'updatedAt': updatedAt, 'canContact': canContact, 'contactStatus': contactStatus, 'canTrack': canTrack, 'surveyFreq': surveyFreq,
            'firstName': firstName, 'lastName': lastName, 'UWemail': UWemail, 'email': email, 'gpa': gpa, 'appDate': appDate, 'program': program, 'degree': degree,
            'gradTerm': gradTerm, 'gradYear': gradYear, 'gender': gender, 'ethnicity': ethnicity, 'age': age, 'generation': generation, 'studentId': studentId
        };
        var query = "INSERT INTO Graduate (status";
        var values = ") VALUES ('" + status;
        for (var stat in stats) {
            console.log(stat + ": " + stats[stat]);
            query += ', ' + stat;
            values += "', '" + stats[stat];
        }
//        status, updatedAt, canContact, contactStatus, canTrack, surveyFreq, firstName, lastName," +
//                    "UWemail, email, gpa, appDate, program, degree, gradTerm, gradYear, gender, ethnicity, age, generation, studentId)" +
//                    "VALUES ('"
        try {
            connection.query(query + values + "')", function (err, rows) {
                //"INSERT INTO Graduate (status, updatedAt, canContact, contactStatus, canTrack, surveyFreq, firstName, lastName, UWemail, email, gpa, appDate, program, degree, gradTerm, gradYear, gender, ethnicity, age, generation, studentId)" +
                //           "VALUES ('" + status + "', '" + updatesAt + "', '" + canContact + "', '" + contactStatus + "', '" + canTrack + "', '" + "')", function (err, rows) {

                console.log('here');

                if (err) {
                    console.log(err);
                    //res.send(err);
                } else {
                    console.log("Graduate was successfully registered");
                    //res.redirect('/'); // once registered redirect to login page
                }

                // verify user doesnt already have an account
                // verify it is a valid email address
                // verify @ and .com/.edu/.net/.org included aka it is a complete email
                connection.release();
            });
        } catch (err) {
            console.log("\nError:\n");
            for (var stat in stats) console.log(stat + ": " + stats[stat]);
        }

    });

}

/**
 * Quick random integer generator from l to h-1
 *
 * @param {int} l         -   the low range (inclusive)
 * @param {int} h         -   the high range (exclusive)
 * @return {int}          -   random number in [l, h-1]
 */
function randomInt(l, h) {
    return Math.floor(Math.random() * (h-l)) + l;
};

function pad(n, s) {
    return (Array(s).join('0') + n).slice(-s);
} 

//For testing
module.exports = app;

