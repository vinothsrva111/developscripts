const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'root',
	database : 'chad'
});
const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
	if (req.session.loggedin) {
		res.sendFile(path.join(__dirname + '/view/home.html'));
	} else {
		res.sendFile(path.join(__dirname + '/view/index.html'));
	}
});

app.get('/home', (req, res) => {
	if (req.session.loggedin) {
		res.sendFile(path.join(__dirname + '/view/home.html'));
	} else {
		res.sendFile(path.join(__dirname + '/view/index.html'));
	}
});

app.get('/logout', (req, res) => {
	req.session.loggedin = false;
  	req.session.destroy();
  	res.redirect('/');
});

app.post('/auth', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	if (username && password) {
		connection.query('SELECT * FROM ilance_users WHERE username = ?', [username], (error, results, fields) => {
			if (results.length > 0) {
				// The below code is node js equivalent for md5(md(password).salt); 
				//Since I don't know the actual password (password stored in db is hash password), 
				//Here I'm not checking password for Authentication
				const salt = results[0].salt;
				const hashMd5 = crypto.createHash('md5').update(password + salt).digest("hex");
				const hashSha1 = crypto.createHash('sha1').update(hashMd5).digest("hex");

				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/home');
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
		});
	} else {
		res.send('Please enter Username and Password!');
	}
});

app.get('/projects', (req, res) => {
	const QUERY = 'select p.project_title Title, p.description Description, u.username User, c.name Category ' + 
				  'from ilance_projects p ' + 
				  'inner join ilance_users u on p.user_id = u.user_id ' + 
				  'left join ilance_category c ON p.cid = c.id order by p.date_added desc, c.name asc, u.username asc, p.project_title asc';
	
	connection.query(QUERY, (error, results, fields) => {
		const tableData = {
			data: []
		};
		for (var i = 0; i < results.length; i++) {
			tableData.data.push([i+1, results[i].Title, results[i].Description, results[i].User, results[i].Category]) 
		}
		res.send(JSON.stringify(tableData));
	});
});

const server = app.listen(3000, () => {
  	const host = server.address().address;
  	const port = server.address().port;
  	console.log('App listening at http://%s:%s', host, port);
});
