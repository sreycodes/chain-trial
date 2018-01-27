var express = require('express');
var router = express.Router();
var passport = require('passport')
var User = require('../config/mongoose_setup');
var Chain = require('../config/mongoose_setup2');
var geodist = require('geodist');
var color_array = ['blue', 'green', 'red', 'yellow', 'white', 'black']

/* GET home page. */
router.get('/', isNotLoggedIn, function(req, res, next) {
  res.render('index', { title: 'Registration' });
});


router.get('/login', isNotLoggedIn, function(req, res, next) {
  res.render('login', { title: 'Login', message : req.flash('loginMessage')  });
});

router.get('/signup', isNotLoggedIn, function(req, res, next) {
  res.render('signup', { title: 'Sign Up', message : req.flash('signupMessage') });
});

// router.get('/update', function(req, res, next) {
//   User.update({'local.username': 'chutiya'}, {'local.username' : 'LOL'}, 
//               function(err, user) {
//                 if(err) throw err;
//                 console.log(user);
//               });
//   res.redirect('/login');
// });

router.post('/create_chain', function(req, res, next) {
  chain = new Chain();
  chain.local.color = color_array.pop();
  color_array.
  chain.local.coord_array = [];
  chain.local.coord_array.push({lat: req.user.local.lat,lng: req.user.local.lng});
  chain.save(function(err, chain) {
    if(err) throw(err);
    console.log("Chain created");
    // console.log(chain);
    User.findOne({'local.username' : req.user.local.username}, function(err, user) {
                  console.log("User updated");
                  user.local.chain = chain.local.color;
                  user.local.inviteSent = true;
                  user.save(function(err) {
                    if(err) throw err;
                    else {
                      User.findOne({'local.username' : req.body.username},
                                  function(err, user) {
                                    if(err) throw err;
                                    if(user.local.invites) {
                                      user.local.invites.push(chain.local.color); //Assuming different colors for all chains
                                    } else {
                                      user.local.invites = [chain.local.color];
                                    }
                                    console.log("Invite sent")
                                    user.save(function(err) {
                                                if(err) throw err;
                                                else res.redirect('/gameplay');
                                              });
                                });
                            }
                      });
                });
        });
});

router.post('/join_chain', function(req, res, next) {
  Chain.findOne({'local.color': req.body.chain_color}, function(err, chain) {
    chain.local.coord_array.push({lat : req.user.local.lat,lng : req.user.local.lng});
    chain.save(function(err, chain) {
      User.findOne({'_id': req.user._id}, function(err, user) {
            console.log("Updating user's chain");
            user.local.chain = chain._id,
            user.local.invites = [];
            user.save(function(err) {
              if(err) throw err;
              else res.redirect('/gameplay');
            });
          });
    });
  });
});

// router.get('/fill_in', function(req, res, next) {
//   // Chain.remove({}, function(err) {
//   //  console.log("all clear");
//   // });
//   chain = new Chain();
//   chain.local.color = 'blue';
//   chain.local.coord_array = [{lat: 72,lng: -20},{lat: 12,lng: -57},{lat: 18,lng: -87}];
//   chain.save(function(err) {
//     if(err) throw(err);
//     console.log("New chain");
//     console.log(chain);
//   });
// });

router.get('/gameplay', isLoggedIn, function(req, res, next) {
  // console.log(req.user);
  User.find({}, 'local.lat local.lng local.username local.invites local.chain local.loggedIn')
  .exec(function(err, list_users) {
    // console.log("KYA AAP CHUTIYE HAIN");
    var new_list_users = [];
    list_users.forEach(function(user, index) {
      var dist = geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng], {format: false, unit: 'km'});
      if(!user.local.chain && dist <= 10000 && !user._id.equals(req.user._id) && user.local.loggedIn) {
        new_list_users.push(user.local);
      }
    });
    Chain.find({}, 'local.color local.coord_array')
    .exec(function(err, list_chains) {
      // console.log(list_chains);
      list_chains.forEach(function(chain, index) {
        list_chains[index] = list_chains[index].local;
      }); 
      // console.log(list_chains);
      // console.log(new_list_users);
      res.render('gameplay', {me: req.user.local, chains_list: list_chains, nearby_users: new_list_users});
    });
  });
});

router.post('/get_coord', isLoggedIn, function(req, res, next) {

    User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.lat = req.body.lat;
            user.local.lng = req.body.lng;
            user.save((err, user) => {
                if(err) 
                  throw err;
                else
                  res.end();
                //   // console.log("i am here");
                //   //next();
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
                else
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

function isNotLoggedIn(req, res, next) {

    // if user is authenticated in the session, log them out
    if (req.isAuthenticated())
        res.redirect('/logout');

    // if they aren't redirect them to the home page
    return next();
}

module.exports = router;
