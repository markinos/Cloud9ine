SELECT g.gpa, g.gradYear, g.gradTerm, j.*, g.*, h.*
FROM heroku_50a8c0371a0e6f5.graduate_has_job h
	JOIN heroku_50a8c0371a0e6f5.job j
		ON h.employmentId = j.id
   	JOIN heroku_50a8c0371a0e6f5.graduate g
		ON h.graduateId = g.id
ORDER BY g.id ASC, j.id ASC;