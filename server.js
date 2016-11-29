'use strict';

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
    host: 'us-cdbr-iron-east-04.cleardb.net',
    user: 'b5a41b60cec771',
    password: '29c6cc15',
    database: 'heroku_50a8c0371a0e6f5'
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
    cookie: { maxAge: 86400000 }, //24hrs
    resave: false,
    saveUninitialized: false
}));

server.listen(app.get('port'), function() {
    console.log('listening on port:', app.get('port'));
});

//login page
app.get('/', function(req, res) {
    res.render('login.ejs');
});

//login page
app.get('/login', function(req, res) {
    res.render('login.ejs');

});

var generateGraduatesForDatabase = false;
var generateFacultyForDatabase = false;
var newGrads = 25;
var newFaculty = 10;
var depreciation = 0.25;

app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    try {
        generateRandomDatabase(true, function(wait) {
            if (wait === 0 || wait === 1) generateGraduatesForDatabase = false;
            generateRandomDatabase(false, function(wait) {
                if (wait === 2) generateFacultyForDatabase = false;
                pool.getConnection(function(err, connection) {
                    try {
                        connection.query("SELECT * FROM faculty WHERE faculty.email = " + "'" + email + "'" + "AND faculty.password = " + "'" + password + "'", function(err, rows) {
                            if (err) {
                                console.log(err);
                                res.render('/login', { err: err.message });
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
                    } catch (err) {
                        res.redirect('/');
                    }
                });
            });
        });
    } catch (err) {
        res.redirect('/');
    }
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
        connection.query("INSERT INTO faculty (email, password, firstName, lastName) VALUES ('" + email + "'" + "," + "'" + password + "'" + "," + "'" + firstName +
            "'" + "," + "'" + lastName + "'" + ")",
            function(err, rows) {

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
            try {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    var data = {
                        'graduates': rows,
                        'user': req.session.user
                    };


                    console.log(data.user);

                    //release connection to db
                    connection.release();

                    //pass graduates object to graduate view
                    res.render('graduate.ejs', data);
                }

            } catch (err) {

                res.redirect('/');

            }
        });
    });
});


app.post('/addGrad', function(req, res) {

    console.dir(req.body);

    var id = req.body.studentId;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var UWemail = req.body.UWemail;
    var email = req.body.email;
    var GPA = req.body.gpa;
    var gender = req.body.gender;
    var program = req.body.program;
    var gradYear = req.body.gradYear;

    var gradTerm = req.body.gradTerm;
    var ethnicity = req.body.ethnicity;
    var age = req.body.age;
    var degree = req.body.degree;
    var generation = req.body.generation;
    var contact = req.body.radio;

    if (contact == "on") {
        contact = 1;
    } else {
        contact = 0;
    }

      UWemail = UWemail + "@uw.edu";

    console.log(UWemail);

    /** This will insert a new graduate into the system. **/

    pool.getConnection(function(error, connection) {
        //query database
        connection.query("INSERT INTO graduate (studentId, firstName, lastName, gender, UWemail, email, gpa, program, gradTerm, gradYear,"+
            " ethnicity, age, degree, generation, canContact)" +
            "VALUES ('" + id + "'" + "," + "'" + firstName + "'" + "," + "'" + lastName + "'" + "," + "'" + gender + "'" + "," + "'" + UWemail + "'" +
            "," + "'" + email + "'" + "," + "'" + GPA + "'" + "," + "'" + program + "'" + "," + "'" + gradTerm + "'" + "," + "'" + gradYear + "'" +
            "," + "'" + ethnicity + "'" + "," + "'" + age + "'" + "," + "'" + degree + "'" + "," + "'" + generation + "'" + "," +
            "'" + contact + "'" + ")",
            function(err, rows) {

                //error querying
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {

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

            if (err) {
                console.log(err);
            } else {
                console.log(gradId + " was deleted");
                connection.release();

                res.redirect('/graduates');

            }

        });

    });

});
/**
    Will update anything edited by faculty inside sql.
**/
app.post('/editGrad', function(req, res) {
    var id = req.body.studentId;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var UWemail = req.body.email;
    var gpa = req.body.gpa;
    var program = req.body.program;
    var gradYear = req.body.gradYear;

    var gradTerm = req.body.gradTerm;
    var ethnicity = req.body.ethnicity;
    var age = req.body.age;
    var degree = req.body.degree;
    var generation = req.body.generation;
    var contact = req.body.radio;

    if (contact == "on") {
        contact = 1;
    } else {
        contact = 0;
    }

    UWemail = UWemail + "@uw.edu";

    console.log(UWemail);

    console.log("edit {" + id + " " + firstName + " " + lastName + " " + UWemail + " " + gpa + " " + program + " " + gradYear + " " +
        gradTerm + " " + ethnicity + " " + age + " " + degree + " " + generation + " " + contact);


    pool.getConnection(function(error, connection) {
        connection.query("UPDATE graduate SET firstName =" + "'" + firstName + "'" + ", lastName=" + "'" + lastName + "'" +
            ", UWemail=" + "'" + UWemail + "'" + ", gpa=" + "'" + gpa + "'" + ", program=" + "'" + program + "'" + ", gradYear=" +
            "'" + gradYear + "'" + ", gradTerm= " + "'" + gradTerm + "'" + ", ethnicity=" + "'" + ethnicity + "'" + ", age=" + "'" + age + "'" +
            ", degree=" + "'" + degree + "'" + ", generation= " + "'" + generation + "'" + ", canContact= " + "'" + contact + "'" +
            "WHERE studentId =" + "'" + id + "'" + ";",
            function(err, rows) {

                if (err) {
                    console.log(err);
                } else {
                    console.log(id + " was edited");
                    connection.release();

                    res.redirect('/graduates');

                }

            });

    });

});

app.get('/report', function(req, res) {
    if (req.session.user) {
        pool.getConnection(function(err, connection) {
           //perform asyncronous queries one by one 
            async.waterfall([
                //getTotalGrads must return a callback function
                //so that async will know how to call the next function
                getTotalGrads(connection),
                getNumberOfGradsWithJobs,
                getJobPlacementRate,
                getNumberOfGradsWithInternships,
                getGradsThatInternedAndFoundAJob,
                getTotalFaculty,
                getTotalSurveys,
                getSurveysCompletedPercent,
                getGradsInPrograms,
                getSkillsUsedInWorkPlace,
                getUndergradDegreesIn01,
                getUndergradDegreesIn02,
                getUndergradDegreesIn03,
                getUndergradDegreesIn04,
                getUndergradDegreesIn05,
                getUndergradDegreesIn06,
                getUndergradDegreesIn07,
                getUndergradDegreesIn08,
                getUndergradDegreesIn09,
                getUndergradDegreesIn10,
                getUndergradDegreesIn11,
                getUndergradDegreesIn12,
                getUndergradDegreesIn13,
                getUndergradDegreesIn14,
                getUndergradDegreesIn15,
                getUndergradDegreesIn16,
                getGradDegreesIn01,
                getGradDegreesIn02,
                getGradDegreesIn03,
                getGradDegreesIn04,
                getGradDegreesIn05,
                getGradDegreesIn06,
                getGradDegreesIn07,
                getGradDegreesIn08,
                getGradDegreesIn09,
                getGradDegreesIn10,
                getGradDegreesIn11,
                getGradDegreesIn12,
                getGradDegreesIn13,
                getGradDegreesIn14,
                getGradDegreesIn15,
                getGradDegreesIn16,

            ], function(err, connection, results) {
                if (err) {
                    console.log(err);
                    res.send(err);
                    return;
                }

                //success
                results['user'] = req.session.user;
                connection.release();
                //res.send(results); 
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

    //must return callback function in order for async to work properly
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

            //calls getTotalFaculty
            callback(null, connection, results);
        });
    } 
}

/**
 * Get the job placement rate for all graduates at the institute of technoogy
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null error, connection, and results of query
 */
function getJobPlacementRate(connection, results, callback) {
    let query = "SELECT ROUND(COUNT(DISTINCT graduate.id, firstName, lastName) / " +
                    "(SELECT COUNT(*) FROM graduate) * 100) AS jobPlacementRate " +
                "FROM graduate " + 
                "JOIN graduate_has_job ON graduate_has_job.graduateId = graduate.id " +
                "JOIN job ON job.id = graduate_has_job.employmentId " +
                "WHERE jobProgram IN ('CSS', 'EE', 'CES', 'tech other') " +
                "AND startDate >= gradYear";

    connection.query(query, (err, rows) => {
        if (err) {
            callback(err);
            return;
        }

        //console.log(rows[0].jobPlacementRate);
        results['jobPlacementRate'] = rows[0].jobPlacementRate;
        callback(null, connection, results);
    });

}

function getNumberOfGradsWithJobs(connection, results, callback) {
    let query = "SELECT COUNT(DISTINCT graduate.id) as gradsWithJobs FROM graduate " +
                "JOIN graduate_has_job ON graduate_has_job.graduateId = graduate.id " +
                "JOIN job ON job.id = graduate_has_job.employmentId " +
                "WHERE jobProgram IN ('CSS', 'EE', 'CES', 'tech other') " +
                "AND startDate >= gradYear; "

    connection.query(query, (err, rows) => {
        if (err) {
            callback(err);
            return;
        }

        //console.log(rows[0].gradsWithJobs);
        results['gradsWithJobs'] = rows[0].gradsWithJobs;
        callback(null, connection, results);
    });
}

function getNumberOfGradsWithInternships(connection, results, callback) {
    let query = "SELECT COUNT(DISTINCT graduate.id) AS gradsWithInternships FROM graduate " +
                "JOIN graduate_has_job ON graduate_has_job.graduateId = graduate.id " +
                "JOIN job ON job.id = graduate_has_job.employmentId " +
                "WHERE employmentType = 'Intern'";

    connection.query(query, (err, rows) => {
        if (err) {
            callback(err);
            return;
        }

        //console.log(rows[0].gradsWithInternships);
        results['gradsWithInternships'] = rows[0].gradsWithInternships;
        callback(null, connection, results);
    });
}

function getGradsThatInternedAndFoundAJob(connection, results, callback) {
    let query = "SELECT COUNT(DISTINCT graduate.id) AS gradsThatInternedAndFoundAJob FROM graduate " +
                "JOIN graduate_has_job ON graduate_has_job.graduateId = graduate.id " +
                "JOIN job ON job.id = graduate_has_job.employmentId " +
                "WHERE jobProgram IN ('CSS', 'EE', 'CES', 'tech other') " +
                "AND graduate.id IN (SELECT graduate.id FROM graduate " +
                    "JOIN graduate_has_job ON graduate_has_job.graduateId = graduate.id " +
                    "JOIN job ON job.id = graduate_has_job.employmentId " +
                    "WHERE employmentType = 'Intern') " +
                "AND startDate >= gradYear " +
                "AND employmentType != 'Intern'";

    connection.query(query, (err, rows) => {
        if (err) {
            callback(err);
            return;
        }

        console.log(rows[0].gradsThatInternedAndFoundAJob);

        connection.query(query, (err, rows) => {
            if (err) {
                callback(err);
                return;
            }

            results['gradsThatInternedAndFoundAJob'] = rows[0].gradsThatInternedAndFoundAJob;
            callback(null, connection, results);
        });
    });
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

        //console.log(rows[0].total);
        results['totalFaculty'] = rows[0].total;
        //calls getTotalSurveys
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
        //calls ggetSurveysCompletedPercent
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

function getGradsInPrograms(connection, results, callback) {
    let query = "SELECT COUNT(*) AS total, program, degree FROM graduate " +
                "WHERE (program = 'CSS' AND degree = 'BA') " +
                "OR (program = 'CSS' AND degree = 'BS') " +
                "OR (program = 'CSS' AND degree = 'MS') " +
                "OR (program = 'CES' AND degree = 'BS') " +
                "OR (program = 'IT' AND degree = 'BS') " +
                "OR (program = 'EE' AND degree = 'BS') " +
                "GROUP BY program, degree";

    connection.query(query, (err, rows) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        results['totalBACSS'] = rows[0].total;
        results['totalBSCSS'] = rows[1].total;
        results['totalMSCSS'] = rows[2].total;
        results['totalBSCES'] = rows[3].total;
        results['totalBSEE'] = rows[4].total;
        results['totalBSIT'] = rows[5].total;
        callback(null, connection, results);
    });
}

function getSkillsUsedInWorkPlace(connection, results, callback) {
    let query = "SELECT COUNT(*) AS total, skill FROM skill " +
                "JOIN skill_has_job ON skill_has_job.skillId = skill.id " +
                "GROUP BY skill";

    connection.query(query, (err, rows) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        let skills = {};

        for (let i = 0; i < rows.length; i++) {
            //console.log(rows[i]);
            skills[rows[i].skill] = rows[i].total;
        }

        results["skills"] = skills;
        console.log(results)
        callback(null, connection, results);
    });
}


/**
 * Get the total number of undergraduate degrees granted in 2001
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn01(connection, results, callback) {
    var query = "SELECT COUNT(*) as total FROM graduate " +
        "WHERE (degree = 'BS' OR degree = 'BA') " +
        "AND gradYear = 2001";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);

        }

        results['undergradDegreesGranted01'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2002
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn02(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
        "WHERE degree = 'BA' OR degree = 'BS' " +
        "AND gradYear = 2002";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted02'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2003
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn03(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
        "WHERE degree = 'BA' OR degree = 'BS' " +
        "AND gradYear = 2003";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted03'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2004
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn04(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2004";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted04'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2005
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn05(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2005";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted05'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2006
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn06(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2006";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted06'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2007
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn07(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2007";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted07'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2008
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn08(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2008";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted08'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2009
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn09(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2009";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted09'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2010
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn10(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2010";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted10'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2011
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn11(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2011";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted11'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2012
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn12(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2012";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted12'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2013
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn13(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2013";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted13'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2014
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn14(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2014";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted14'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2015
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn15(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2015";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted15'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of undergraduate degrees granted in 2016
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getUndergradDegreesIn16(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2016";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['undergradDegreesGranted16'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2001
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn01(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2001";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
            
        }

        results['gradDegreesGranted01'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2002
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn02(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2002";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted02'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2003
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn03(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2003";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted03'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2004
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn04(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2004";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted04'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2005
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn05(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2005";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted05'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2006
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn06(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2006";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted06'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2007
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn07(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'BA' OR degree = 'BS' " +
                "AND gradYear = 2007";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted07'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2008
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn08(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2008";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted08'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2009
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn09(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2009";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted09'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2010
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn10(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2010";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted10'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2011
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn11(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2011";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted11'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2012
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn12(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2012";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted12'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2013
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn13(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2013";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted13'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2014
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn14(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2014";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted14'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2015
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn15(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2015";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted15'] = rows[0].total;
        callback(null, connection, results);
    });
}

/**
 * Get the total number of graduate degrees granted in 2016
 *
 * @param connection is the mysql connection object for querying
 * @return callback function to be executed. On error: execute
 *         callback with error passed in. On success: execute 
 *         callback with null, connection, and results of query
 */
function getGradDegreesIn16(connection, results, callback) {
    var query = "SELECT COUNT(*) AS total FROM graduate " +
                "WHERE degree = 'MS' AND gradYear = 2016";

    connection.query(query, (err, rows) => {
        if (err) {
            //console.log(err);
            callback(err);
        }

        results['gradDegreesGranted16'] = rows[0].total;
        callback(null, connection, results);
    });
}



var debug = false;


function generateRandomDatabase(genGrads, callback) {

    function getFaculty(desiredFaculty) {
        try {
            function getCurrentFaculty(goalFaculty, callback) {
                function executeQuery(callback) {
                    pool.getConnection(function(err, connection, results) {
                        try {
                            connection.query("SELECT COUNT(*) AS total FROM faculty", function(err, rows) {
                                if (err) {
                                    callback(-1);
                                    return;
                                }

                                var results = { 'totalFaculty': rows[0].total };
                                if (debug) console.log("      C_FACTS: " + results.totalFaculty);
                                return callback(results.totalFaculty);
                            });
                        } catch (e) {
                            return callback(-1);
                        }
                    });
                }
                executeQuery(function(faculty) {
                    if (debug) console.log("    E_FACTS: " + faculty);
                    if (debug) console.log("    E_GOALS: " + goalFaculty);
                    if (!debug) process.stdout.write('.');
                    if (faculty === -1) callback(goalFaculty - depreciation, -1);
                    else callback(goalFaculty === 0 ? faculty + newFaculty : goalFaculty, faculty);
                });
            }


            getCurrentFaculty(desiredFaculty, function(goal, faculty) {
                if (goal != 0 && goal < desiredFaculty) getFaculty(goal);
                else {
                    if (debug) console.log("  G_FACTS: " + faculty);
                    if (debug) console.log("  G_GOALS: " + goal);
                    if (!debug) process.stdout.write(' ');
                    for (var g = 0; g < (goal - faculty); g++)
                        try { randomlyGenerateFaculty(); } catch (err) {
                            if (debug) console.log("generateDatabase faculty loop error: " + err);
                        };
                    if (goal > faculty) getFaculty(goal);
                    else {
                        process.stdout.write("\nFaculty Generation Complete!\n\n");
                        callback(2);
                    }
                }
            });
        } catch (e) {
            getFaculty(desiredFaculty);
        }
    }

    function getGrads(desiredGrads) {
        try {
            function getCurrentGrads(goalGrads, callback) {
                function executeQuery(callback) {
                    pool.getConnection(function(err, connection, results) {
                        try {
                            connection.query("SELECT COUNT(*) AS total FROM graduate", function(err, rows) {
                                if (err) {
                                    callback(-1);
                                    return;
                                }

                                var results = { 'totalGrads': rows[0].total };
                                if (debug) console.log("      C_GRADS: " + results.totalGrads);
                                return callback(results.totalGrads);
                            });
                        } catch (e) {
                            return callback(-1);
                        }
                    });
                }
                executeQuery(function(grads) {
                    if (debug) console.log("    E_GRADS: " + grads);
                    if (debug) console.log("    E_GOALS: " + goalGrads);
                    if (!debug) process.stdout.write('.');
                    if (grads === -1) callback(goalGrads - depreciation, -1);
                    else callback(goalGrads === 0 ? grads + newGrads : goalGrads, grads);
                });
            }


            getCurrentGrads(desiredGrads, function(goal, grads) {
                if (goal != 0 && goal < desiredGrads) getGrads(goal);
                else {
                    if (debug) console.log("  G_GRADS: " + grads);
                    if (debug) console.log("  G_GOALS: " + goal);
                    if (!debug) process.stdout.write(' ');
                    for (var g = 0; g < (goal - grads); g++)
                        try { randomlyGenerateGraduate(); } catch (err) {
                            if (debug) console.log("generateDatabase graduate loop error: " + err);
                        };
                    if (goal > grads) getGrads(goal);
                    else {
                        process.stdout.write("\nGraduate Generation Complete!\n\n");
                        if (generateFacultyForDatabase) {
                            callback(0);
                            //for (var w = 0; w < 1000000000; w++);
                            //process.stdout.write("Generating Faculty..");
                            //function makeFaculty(callback) { var i = getFaculty(0); callback(i); };
                            //makeFaculty(function (test) { test = test + ''; return 0; });
                        } else callback(1);
                    }
                }
            });
        } catch (e) {
            getGrads(desiredGrads);
        }
    }


    if (genGrads && generateGraduatesForDatabase) {
        process.stdout.write("\nGenerating Graduates..");
        getGrads(0);
    } else if (!genGrads && generateFacultyForDatabase) {
        process.stdout.write("\nGenerating Faculty..");
        getFaculty(0);
    } else callback(-1);

}

var maxYear = 2020;
var appMinYear = 1999;
var gradMinYear = 2001;

var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };

var programs = ['CSS', 'CES', 'IT', 'EE'];
var degrees = ['BA', 'BS', 'MS'];
var terms = ['AUT', 'WIN', 'SPR', 'SUM'];

var firstNames = ['Menaka', 'Jason', 'Shema', 'Travis', 'Mark', 'Chris', 'Vito', 'Lebron', 'Stephen', 'Alice', 'Russel',
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

var lastNames = ['Abraham', 'Bada', 'Bui', 'Cox', 'Diabate', 'Gentry', 'Gibbons', 'Ho', 'Irgaliyev', 'Johnigan', 'Klonitsko',
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

var employmentTypes = ['Intern', 'Part Time', 'Full Time', 'Residency'];
var employerTechNames = ['Google', 'Apple', 'Microsoft', 'IBM', 'Facebook', 'UWT', 'Amazon', 'Boeing', 'Dropbox'];
var employerNonTechNames = ['Safeway', 'McDonalds', 'Hooters'];
var jobPrograms = ['CSS', 'CES', 'EE', 'IT', 'tech other', 'non tech'];
var jobTechTitles = ['Software Engineer', 'Programmer', 'Senior Programmer', 'Debugger', 'Circuit Design', 'Graphic Designer', 'Web Developer'];
var jobNonTechTitles = ['Clerk', 'Food Chef', 'Greeter', 'Dishwasher', 'Server', 'Custodian'];
var skillsTech = ['Java', 'Python', 'C', 'Graphics', 'Debugging', 'Project Management', 'IT', 'C++', 'Javascript', 'SQL', 'HTML', 'Web Dev', 'Ruby', 'Internet', 'Group Leader','AI'];
var skillsNonTech = ['Flipping Burgers', 'Register', 'Janitorial', 'Getting coffee for the boss', 'Kitchen'];
var salaryMinTech = 50000;
var salaryMaxTech = 150000;
var executiveBonus = 200000;
var salaryMinNonTech = 10000;
var salaryMaxNonTech = 40000;
var goodJobGPA = 3.5;
var badJobGPA = 2.5;

function randomlyGenerateGraduate() {
    pool.getConnection(function(err, connection) {
        var appDate = randomInt(appMinYear, maxYear - 2);
        var gradYear = Math.max(gradMinYear, randomInt(appDate + 1, Math.min(appDate + 6, maxYear)));
        if (Math.random() < 0.1) gradYear = randomInt(gradYear, maxYear);
        var gradTerm = Math.random() < 0.7 ? 'SPR' : terms[randomInt(0, terms.length)];
        var status = 'current';
        var updatedMonth = randomInt(0, 12);
        var updatedAt = randomInt(gradYear, maxYear) + '-' + pad(updatedMonth + 1, 2) + '-' + pad(randomInt(1, monthDays[updatedMonth] + 1), 2);
        var canContact = Math.random() < 0.9 ? 1 : 0;
        var contactStatus = 'updated';
        var canTrack = 1;
        var surveyFreq = 1;
        var firstName = firstNames[randomInt(0, firstNames.length)];
        var lastName = lastNames[randomInt(0, lastNames.length)];
        var UWemail = firstName.charAt(0) + lastName + '@uw.edu';
        var email = lastName + gradYear + '@gmail.com';
        var gpa = ((Math.random() * 2 + 2) + '').substr(0, 4);
        var appMonth = randomInt(0, 12);
        var appDate = appDate + '-' + pad(appMonth + 1, 2) + '-' + pad(randomInt(1, monthDays[appMonth] + 1), 2);
        var program = programs[randomInt(0, programs.length)];
        var degree = 'BS';
        switch (program) {
            case 'EE':
                if (gradYear < 2017 || (gradYear === 2017 && gradTerm != 'AUT')) {
                    program = 'CSS';
                    degree = 'BS'
                }
                break;
            case 'CSS':
                degree = degrees[randomInt(0, degrees.length)];
                break;
            default:
                break;
        }
        var degree = degrees[randomInt(0, degrees.length)];
        var gender = genders[Math.random() < 0.99 ? randomInt(0, 2) : 2];
        var ethnicity = ethnicities[randomInt(0, ethnicities.length)];
        var age = Math.random() < 0.6 ? '18-23' : ages[randomInt(0, ages.length)];
        var generation = generations[randomInt(0, generations.length)];
        var studentId = randomInt(1000000, 10000000);
        var stats = {
            'updatedAt': updatedAt,
            'canContact': canContact,
            'contactStatus': contactStatus,
            'canTrack': canTrack,
            'surveyFreq': surveyFreq,
            'firstName': firstName,
            'lastName': lastName,
            'UWemail': UWemail,
            'email': email,
            'gpa': gpa,
            'appDate': appDate,
            'program': program,
            'degree': degree,
            'gradTerm': gradTerm,
            'gradYear': gradYear,
            'gender': gender,
            'ethnicity': ethnicity,
            'age': age,
            'generation': generation,
            'studentId': studentId
        };
        var query = "INSERT INTO Graduate (status";
        var values = ") VALUES ('" + status;
        for (var stat in stats) {
            query += ', ' + stat;
            values += "', '" + stats[stat];
        }
        var date = [gradYear + (Math.random() < 0.5 ? -1 : 0), 0];
        try {
            connection.query(query + values + "')", function(err, rows) {

                if (debug) {
                    if (err) console.log(err);
                    else console.log("Graduate was successfully added");
                }

                switch (gradTerm) {
                    case 'AUT':
                        date[1] = 11;
                        break;
                    case 'WIN':
                        date[1] = 2;
                        break;
                    case 'SPR':
                        date[1] = 5;
                        break;
                    case 'SUM':
                        date[1] = 7;
                        break;
                    default:
                        break;
                }

                var i = 1;
                if (debug) console.log("TERM pre-loop: " + term);

                function loop(term, rank) {
                    if (term[0] <= maxYear && term[0] >= gradYear - 1 && Math.random() < 0.95) {
                        if (debug) console.log("job " + i++);
                        randomlyGenerateJob(gradYear, term[0], term[1], rank, err, connection, function(err, data) {
                            if (debug) console.log("JOB CALLBACK: " + data);
                            jobCode = data;
                            if (jobCode != null && jobCode > 0) connectGradToJob(term, studentId, jobCode, err, connection, function(err, data2) {
                                if (debug) console.log("HAS_JOB CALLBACK: " + data);
                                term = data2;
                                if (term.length > 2) rank = term[2];
                                if (rank < 0) rank = 0.00;
                                if (debug) console.log("Term: " + term + "  ////  JobCode: " + jobCode);
                                loop(term, rank);
                            });
                        });
                    }
                }
                if (maxYear - date[0] >= 0 && Math.random() > 0.05) loop(date, gpa);
                //ADD updatedAt date modification to a few months after last hire/fire date
                connection.release();
            });
        } catch (err) {
            if (debug) {
                console.log("\nError: UNABLE TO ADD GRADUATE  " + err);
                for (var stat in stats) console.log(stat + ": " + stats[stat]);
            }
        }

    });

}

function connectGradToJob(term, studentId, jobCode, err, connection, callback) {
    var oldTerm = [term[0], term[1]];
    var sid = 0;
    var jid = 0;
    var upmob, year, end, gpa;
    var tech = false;

    function addTechSkills(t, i, j, a) {
        connection.query("SELECT * FROM skill WHERE skill = '" + skillsTech[i] + "'", function (err, rows) {
            if (!err) {
                if (rows.length === 0) {
                    insertTechSkill(t, i, j, a);
                    //console.log("adding skill" + skillsTech[i]);
                } else {
                    var q = "INSERT INTO skill_has_job (jobId, skillId) VALUES ('" + j + "', '" + rows[0].id + "')";
                    connection.query(q, function (err, rows) {
                        if (!err && t < 2) {
                            a.push(i);
                            var r = i;
                            while (a.includes(r)) r = Math.floor(Math.random() * skillsTech.length);// console.log("r" + r);}
                            //console.log(i + " " + t);
                            addTechSkills(--t, r, j, a);
                        }// else console.log(err);
                    });
                }
            }
        });
    }


    function addNonTechSkills(t,i,j, a) {
        connection.query("SELECT * FROM skill WHERE skill = '" + skillsNonTech[i] + "'", function (err, rows) {
            if (!err) {
                if (rows.length === 0) {
                    insertNonTechSkill(t, i, j, a);
                    //console.log("adding skill" + skillsNonTech[i]);
                } else {
                    var q = "INSERT INTO skill_has_job (jobId, skillId) VALUES ('" + j + "', '" + rows[0].id + "')";
                    connection.query(q, function (err, rows) {
                        if (!err && t < 2) {
                            a.push(i);
                            var r = i;
                            while (a.includes(r)) r = Math.floor(Math.random() * skillsNonTech.length); //console.log("r" + r); }
                            //console.log(i + " " + t);
                            addNonTechSkills(--t, r, j, a);
                        } //else console.log(err);
                    });
                }
            }
        });
    }


    function insertTechSkill(t, i, j, a) {
            connection.query("INSERT INTO skill (skill) VALUES ('" + skillsTech[i] + "')", function (err, rows) {
                if (!err) addTechSkills(t, i, j, a);
            });
        }

    function insertNonTechSkill(t, i, j, a) {
            connection.query("INSERT INTO skill (skill) VALUES ('" + skillsNonTech[i] + "')", function (err, rows) {
                if (!err) addNonTechSkills(t, i, j, a);
            });
        }


    try {
        var query = "SELECT * FROM graduate WHERE studentId = '" + studentId + "'";
        connection.query(query, function(err, rows) {

            if (err) {
                if (debug) console.log(err);
            } else if (rows.length) sid = rows[0].id;

            query = "SELECT * FROM job WHERE jobCode = '" + jobCode + "'";
            connection.query(query, function(err, rows) {
                if (err) {
                    if (debug) console.log(err);
                } else if (rows.length) {
                    jid = rows[0].id;
                    end = rows[0].endDate + '';
                    tech = rows[0].employerType === "tech";

                    year = parseInt(end.substr(11, 15));
                    try {
                        gpa = parseDouble(rows[0].gpa);
                        if (rows[0].employerName === 'self founded company' && gpa < 7) upmob = Math.random() < 0.5 ? -(gpa - 2) : 2;
                        else if (rows[0].employerDesc === 'self owned company') upmob = Math.random() < 0.2 ? -Math.min(4, (Math.abs(gpa - 4))) : 4;
                        else if (rows[0].employmentType === 'Chief Officer' || rows[0].employmentType === 'Board Member') upmob = 4;
                        else upmob = (rows[0].employmentType === 'Full Time' && year - parseInt(rows[0].startDate.substr(11, 15)) >= 2) ? 0.5 : 0;
                    } catch (e) {
                        upmob = 0;
                    }
                    //0123456789012345
                    //Wed Aug 05 2020 00:00:00 GMT-0700 (Pacific Daylight Time)
                }

                if (sid != null && !isNaN(sid) && sid > 0 && jid != null && !isNaN(jid) && jid > 0) {
                    query = "INSERT INTO graduate_has_job (employmentId, graduateId) VALUES ('" + jid + "', '" + sid + "')";
                    connection.query(query, function(err, rows) {
                        if (err) {
                            if (debug) console.log("\nError with job creation\n" + err);
                        } else {
                            if (debug) console.log("Connection between graduate and job established");
                            if (end != null && !isNaN(year) && year >= gradMinYear) {
                                term[0] = year;
                                term[1] = months[end.substr(4, 3)];
                            } else term = [maxYear + 1, 0];
                            if (upmob > 0) term.push(gpa + upmob);

                            if (tech) addTechSkills(Math.floor(Math.random() * skillsTech.length), Math.floor(Math.random() * skillsTech.length), jid, []);
                            else addNonTechSkills(Math.floor(Math.random() * skillsNonTech.length), Math.floor(Math.random() * skillsNonTech.length), jid, []);
                            
                        }
                        callback(null, term);
                    });
                } else if (debug) console.log("\nError with job creation: SID: " + sid + "  JID: " + jid);


            });
        });



    } catch (err) {
        if (debug) {
            console.log("\nError: UNABLE TO CONNECT GRAD TO JOB  " + err);
            console.log("term: " + term + "   oldTerm: " + oldTerm + "   scode: " + studentId + "   sid: " + sid + "   jcode: " + jobCode + "   jid: " + jid + "   upmob: " + upmob);
            try { console.log("year: " + year + "   month: " + end.substr(4, 3) + "   month #: " + months[end.substr(4, 3)]); } catch (e) {}
        }
        callback(null, oldTerm);
    }

}

function randomlyGenerateJob(grad, year, month, gpa, err, connection, callback) {
    year = parseInt(year + '');
    month = parseInt(month + '');
    var oldMonth = month;
    gpa = parseInt(gpa + '');
    var jobCode = 0;
    var employerName, employerType, employerDesc, jobProgram, jobTitle, salary, endDate, goodJob;
    var employmentType = "Full Time";

    switch (year - grad) {
        case -1:
            employmentType = "Intern";
            break;
        case 0:
            employmentType = employmentTypes[randomInt(0, employmentTypes.length)];
            break;
        case 1:
            employmentType = Math.random() < 0.1 ? (Math.random() < 0.8 ? "Intern" : "Residency") : (Math.random() < 0.3 ? "Part Time" : "Full Time");
            break;
        default:
            employmentType = Math.random() * gpa < 0.5 ? "Part Time" : "Full Time";
            break;
    }

    if (employmentType === "Intern" || employmentType === "Residency") {
        goodJob = 1;
        month += randomInt(0, 6);
    } else {
        goodJob = (gpa >= goodJobGPA ? Math.random() + 0.98 : (gpa > badJobGPA ? Math.random() + 0.9 : Math.random() + 0.5));
        if (Math.random() > 0.3) {
            month += gpa < badJobGPA ? randomInt(0, 12) : (gpa < goodJobGPA ? randomInt(0, 6) : randomInt(0, 3));
            if (Math.random() < 0.1) month += randomInt(1, 72);
        }
    }

    if (gpa > 4) goodJob = 2;

    year += Math.floor(month / 12);
    month = month % 12;
    if (year === maxYear + 1) {
        year = maxYear;
        month = randomInt(oldMonth, 12);
    } else if (year > maxYear + 1) {
        jobCode = 0;
        callback(null, jobCode);
        return;
    }
    var startDate = year + '-' + pad(month + 1, 2) + '-' + pad(randomInt(1, monthDays[month] + 1), 2);



    if (goodJob >= 1) {
        if (Math.random() < 0.95) {
            employerName = employerTechNames[randomInt(0, employerTechNames.length)];
            employerType = 'tech';
        } else {
            employerName = employerNonTechNames[randomInt(0, employerNonTechNames.length)];
            employerType = 'service';
        }
        employerDesc = 'a good job';
        jobProgram = jobPrograms[randomInt(0, jobPrograms.length - 1)];
        jobTitle = jobTechTitles[randomInt(0, jobTechTitles.length)];
        salary = randomInt(salaryMinTech, salaryMaxTech);
        if (employmentType === "Intern" || employmentType === "Residency") {
            month += randomInt(1, 9);
        } else {
            if (gpa > 4 || Math.random() > 0.9) {
                salary += executiveBonus;
                pay = gpa;
                while (Math.random() < 0.5 * Math.max(1, --pay)) salary += executiveBonus * randomInt(1, 10);
                jobTitle = (gpa < randomInt(4, 16) && Math.random() < 0.5) ? "Chief Officer" : "Board Member";
                if (Math.random() < 0.5) {
                    employerDesc = "self owned company";
                    if (Math.random() < 0.2) employerName = "self founded company";
                }
            }
            if (gpa > goodJobGPA || Math.random() > 0.7) month += randomInt(1, 120);
            else month += randomInt(1, 30);
            if (Math.random() < 0.1) month += randomInt(120, 720);
        }
    } else {
        employerName = employerNonTechNames[randomInt(0, employerNonTechNames.length)];
        employerType = 'service';
        employerDesc = 'a not so good job';
        jobProgram = 'non tech';
        jobTitle = jobNonTechTitles[randomInt(0, jobNonTechTitles.length)];
        salary = randomInt(salaryMinNonTech, salaryMaxNonTech);
        if (Math.random() > 0.97) {
            salary += executiveBonus / 4;
            jobTitle = 'Manager';
        }
        if (gpa > badJobGPA || Math.random() > 0.9) month += randomInt(1, 60);
        else month += randomInt(1, 10);
        if (Math.random() < 0.01) month += randomInt(120, 720);
    }

    year += Math.floor(month / 12);
    month = month % 12;
    if (year > maxYear) endDate = 'NULL';
    else endDate = year + '-' + pad(month + 1, 2) + '-' + pad(randomInt(1, monthDays[month] + 1), 2);
    switch (employmentType) {
        case 'Intern':
            salary /= 1.5;
            break;
        case 'Part Time':
            salary /= 2;
            break;
        case 'Residency':
            salary /= 2.5;
            break;
        default:
            break;
    }
    if (employerName === 'Amazon') salary /= 2;

    salary = Math.floor(salary / 1000) * 1000;

    jobCode = randomInt(1000000, 10000000);
    var stats = {
        'employmentType': employmentType,
        'employerName': employerName,
        'employerType': employerType,
        'employerDesc': employerDesc,
        'jobProgram': jobProgram,
        'jobTitle': jobTitle,
        'salary': salary,
        'startDate': startDate,
        'endDate': endDate
    };
    var query = "INSERT INTO Job (jobCode";
    var values = ") VALUES ('" + jobCode;
    for (var stat in stats) {
        query += ', ' + stat;
        values += "', '" + stats[stat];
    }

    try {
        connection.query(query + values + "')", function(err, rows) {
            if (debug) {
                if (err) console.log("Job was not added" + err);
                else console.log("Job was successfully added");
            }
            if (err) jobCode = 0;
            callback(null, jobCode);
        });
    } catch (err) {
        if (debug) {
            console.log("\nError: UNABLE TO ADD JOB  " + err);
            for (var stat in stats) console.log(stat + ": " + stats[stat]);
        }
        jobCode = 0;
        callback(err, jobCode);
    }

}

function randomlyGenerateFaculty() {
    pool.getConnection(function(err, connection) {
        var firstName = firstNames[randomInt(0, firstNames.length)];
        var lastName = lastNames[randomInt(0, lastNames.length)];
        var email = firstName.charAt(0) + lastName + '@uw.edu';
        var password = 'password' + randomInt(0, 100);
        var status = Math.random() < 0.9 ? 'Staff' : 'Admin';
        var permissionAccess = Math.random() < 0.9 ? 1 : 0;
        var permissionUpdate = Math.random() < 0.9 ? 1 : 0;
        var permissionReport = Math.random() < 0.9 ? 1 : 0;
        var stats = {
            'firstName': firstName,
            'lastName': lastName,
            'password': password,
            'status': status,
            'permissionAccess': permissionAccess,
            'permissionUpdate': permissionUpdate,
            'permissionReport': permissionReport
        };
        var query = "INSERT INTO Faculty (email";
        var values = ") VALUES ('" + email;
        for (var stat in stats) {
            query += ', ' + stat;
            values += "', '" + stats[stat];
        }

        try {
            connection.query(query + values + "')", function(err, rows) {
                if (debug) {
                    if (err) console.log(err);
                    else console.log("Faculty was successfully added");
                }

                connection.release();
            });
        } catch (err) {
            if (debug) {
                console.log("\nError: UNABLE TO ADD FACULTY  " + err);
                for (var stat in stats) console.log(stat + ": " + stats[stat]);
            }
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
    return Math.floor(Math.random() * (h - l)) + l;
};

function pad(n, s) {
    return (Array(s).join('0') + n).slice(-s);
}

//For testing
module.exports = app;
