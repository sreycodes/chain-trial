var express = require('express');
var router = express.Router();
var passport = require('passport')
var User = require('../config/mongoose_setup');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Registration' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login', message : req.flash('loginMessage')  });
});

router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up', message : req.flash('signupMessage') });
});

router.post('/get_coord', function(req, res, next) {

    User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.lat = req.body.lat;
            user.local.lng = req.body.lng;
            user.save((err) => {
                if(err) 
                    throw err;
            });
        });
});

router.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile', {title: "Your co-ordinates"})
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
router.get('/logout', function(req, res) {

        User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.loggedIn = false;
            user.save((err) => {
                if(err) 
                    throw err;
                req.logout();
                res.redirect('/');
            });
        });
    });

router.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true
    }));

router.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the login  page if there is an error
        failureFlash : true // allow flash messages
    }));


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;
