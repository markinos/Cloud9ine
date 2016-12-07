GradTrack
Mark Peters, Shema Rezanejad, Jason Thai
*****************************************************
*****************************************************
*****************************************************




Changes from Phase II Submission
*****************************************************
See included Project Phase III document, which has been
completely revised in several areas to reflect changes
in implementation.




Implementation
*****************************************************
If you dont want to install npm to run the app locally,
feel free to visit grad-track.herokuapp.com

Install Instructions (for local use):
1) Install node.js 
	https://nodejs.org/en/download/
2) npm install npm@latest -g
3) npm install
3) npm start

type localhost:8888 into your browser
note that regardless of access via webpage or locally,
all data connects to the same database




Testing
*****************************************************
1)type into prompt "npm test"
2)if fails, and error reads "mocha is not recognized"
  type into prompt "npm install mocha"
All methods should be tested and results displayed to console.




README
*****************************************************
(for more details, please see Project Phase III doc)
Division of labor:
Mark Peters: Documentation, design plans, readme and project phase iii document, generate reports draft, database generation
Shema Rezanejad: Register/login a faculty, add or update academic information, add or update employment information, front end, display
Jason Thai: Node JS - SQL interactions, generate reports backend and frontend, server design, webhosting, all testing cases, connection/query assistance

Use case specifics:
Use case 1: Add or Update Employment Information was implemented as designed, with slight changes to information display and modifications.
Use case 2: Generate Employment Report was implemented with many changes--rather than allow customizable parameters, which would have taken an extra week or
	    so to design, we selected the 15 most useful reports we could think of and set all of them to generate automatically upon report generation.
Use case 3: Respond to Employment Survey was not fully implemented--although surveys exist in the database and can have their statistics viewed, a secure way
	    to email graduates and have them reply to a survey and incorporating that survey into the webapp needed another week at least to develop. As of now,
	    faculty can send out surveys to graduates and can view some survey statistics, but the graduates will not recieve the surveys.
Use case 4: Add or Update Academic Information was implemented as designed, with minor changes to the viewing and adding procedures.
Use case 5: Register or Login a Faculty was mostly implemented as designed, with the exceptions of school verification procedures. Since we are unable to access
	    a real school's security and database information, we didn't really have a way to implement school-specific security to prevent non-faculty from viewing.

Overall:
The project was completed almost as envisioned, with some features that didn't make it and some others that changed. The view and display are much more beautiful than
planned due to some excellent work using templates and SQL - Node JS interactions framework and use of herokuapp. Additional content includes the ability to (server-side)
generate massive amounts of graduates, faculty, jobs, skills, etc. for reports generation and testing how the app would work in a real school with many employees
accessing it simultaneously. As of right now, a completely working version is probably less than a week or so from completion. Had we been able to start Phase III when we
started Phase II, all features would have been implemented. Overall, we are all proud of GradTrack and surprised at how much we were able to get down in so little time.