var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer=require('nodemailer');

var User=require('../models/user');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var college = req.body.college;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var question=1;

	// Validation
	req.checkBody('college', 'College is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {
		//checking for email already taken
			User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if (mail) {
					res.render('register', {
						mail: mail
					});
				}
				else {
					var newUser = new User({
						username: username,
						email: email,
						college:college,
						password: password,
						question:question
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
					});
					var transporter = nodemailer.createTransport({
 					service: 'gmail',
 					secure: false,
  					port: 25,
 					auth: {
            		user: 'esha251298@gmail.com',
            		pass:'esha123abc'
   					},
   					tls:{
   						rejectUnauthorized:false
   					}
				});

					const mailOptions = {
 					 from: '"Innerve Contact"<esha251298@gmail.com>', // we will put innerve's address here
  					 to: email, // list of receivers can be put if reqd
  					 subject: 'Innerve registeration', 
  					 html: '<h3>Hi</h3><p>Thanks for registering for innerve.</p>'// other content can be put eg-events etc.
				};
				transporter.sendMail(mailOptions, function (err, info) {
   				if(err)
     				console.log(err)
   				else
     				console.log(info);
				});
         	req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/users/login');
				}
			});
	}
});

passport.use('local-login',new LocalStrategy({
	usernameField:'email',
	passwordField:'password',
	passReqToCallback:true
},

	function (req,email, password, done) {
		process.nextTick(function(){
			User.findOne({'email': email},function(err,user){
				if(err)
					return done(err);
				if (!user) 
				return done(null, false, { message: 'Unknown User' });
				User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) 
					return done(null, user);
				 else 
					return done(null, false, { message: 'Invalid password' });
			})
			}
			)})}
		));
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local-login', { successRedirect: '/question', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/question');
	});
router.get('/forgot-password2-just-to-make-it-complex',function(req,res){
  res.send('forgot-password2');
});
router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;