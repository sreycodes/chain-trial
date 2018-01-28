var express = require('express');
var router = express.Router();
var passport = require('passport')
var User = require('../config/mongoose_setup');
var Chain = require('../config/mongoose_setup2');
var geodist = require('geodist');
var intersects = require('line-segments-intersect');
var color_array = ['blue', 'green', 'red', 'yellow', 'white', 'orange', 'purple', 'pink', 'cyan', 'brown'] //Have to put in database

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
  var index = 0;
  User.findOne({'local.username' : 'admin'}, function(err, user) {
    index = user.local.points;
    user.local.points++;
    user.local.points %= 10;
    user.save(function(err) {
      if(err) throw err;
      chain.local.color = color_array[index];
      chain.local.user_array = [];
      var modified_user = {'local': req.user.local};
      chain.local.user_array.push(modified_user);
      chain.save(function(err, chain) {
        if(err) throw(err);
        // console.log("Chain created");
        // console.log(chain);
        User.findOne({'local.username' : req.user.local.username}, function(err, user) {
                      //console.log("User updated");
                      user.local.chain = chain.local.color;
                      user.local.points += 50;
                      user.save(function(err) {
                        if(err) throw err;
                        else res.redirect('/gameplay');
                      });
                });
          });
      });
  });
});

router.post('/extend_chain', function(req, res, next) {

  User.findOne({'local.username' : req.body.username}, function(err, user) {
                //console.log("User updated");
                user.local.invites.push(req.user.local.chain);
                user.save(function(err) {
                  if(err) throw err;
                  else {
                    User.findOne({'_id': req.user._id}, function(err, user) {
                      user.local.points += 50;
                      user.local.inviteSent = true
                      user.save(function(err) {
                        if(err) throw err;
                        else res.redirect('/gameplay');
                      })
                    });
                  }  
              });
       });
});

router.post('/join_chain', function(req, res, next) {
  Chain.findOne({'local.color': req.body.chain_color}, function(err, chain) {
    var modified_user = {'local': req.user.local};
    chain.local.user_array.push(modified_user);
    chain.save(function(err, chain) {
      User.findOne({'_id': req.user._id}, function(err, user) {
            //console.log("Updating user's chain");
            user.local.chain = chain.local.color,
            user.local.invites = [];
            user.local.points += 50;
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
  User.find({}, 'local.lat local.lng local.username local.invites local.chain local.loggedIn local.inviteSent local.points')
  .exec(function(err, list_users) {
    // console.log("KYA AAP CHUTIYE HAIN");
    var new_list_users = [];
    list_users.forEach(function(user, index) {
      var dist = geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng], {format: false, unit: 'km'});
      if((!user.local.chain || user.local.chain == "deleted") && dist <= 10 && !user._id.equals(req.user._id) && user.local.loggedIn) {
        new_list_users.push(user.local);
      }
    });
    // var coord_array = [];
    Chain.find({}, 'local.color local.user_array')
    .exec(function(err, list_chains) {
      // console.log(list_chains);
      list_chains.forEach(function(chain, index) {
        //console.log(list_chains[index]);
        list_chains[index].local.user_array = list_chains[index].local.user_array.map(function(user) {
          return user.local;
        });
        list_chains[index] = list_chains[index].local;
        //console.log(list_chains[index]);
      }); 
      // console.log(coord_array);
      //console.log(list_chains);
      // console.log(new_list_users);
      res.render('gameplay', {me: req.user.local, chains_list: list_chains, nearby_users: new_list_users});
    });
  });

});

// if(intersects([p1, p2], [p3, p4])) {
//                                 var my_sz = user_array2.length, opponent_sz = usser_array3.length;
//                                 console.log("Intersected");
//                                 if(my_sz >= opponent_sz / 2) {
//                                   Chain.findOneAndRemove({'local.color' : list_chains[i].local.color}, function(err, chain2) {
//                                     console.log("Deleting opponent's chain" + chain2);
//                                     User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
//                                       .exec(function(err, list_users) {
//                                         if(err) throw err;
//                                         list_users.forEach(function(user, index) {
//                                           list_users[index].local.chain = "deleted";
//                                           list_users[index].local.inviteSent = false;
//                                           list_users[index].local.invites = [];
//                                           list_users[index].save(function(err, user) {
//                                             if(err) throw err;
//                                             console.log(user.local.chain + "means deleted");
//                                             res.end();
//                                             return;
//                                           });
//                                         });
//                                       });
//                                   });
//                                 } else if(my_sz <= opponent_sz / 2) {
//                                   Chain.findOneAndRemove({'local.color' : chain.local.color}, function(err, chain2) {
//                                     console.log("Deleting my chain" + chain2);
//                                     User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
//                                       .exec(function(err, list_users) {
//                                         if(err) throw err;
//                                         list_users.forEach(function(user, index) {
//                                           list_users[index].local.chain = "deleted";
//                                           list_users[index].local.inviteSent = false;
//                                           list_users[index].local.invites = [];
//                                           list_users[index].save(function(err, user) {
//                                             if(err) throw err;
//                                             console.log(user.local.chain + "means deleted");
//                                             res.end();
//                                             return;
//                                           });
//                                         });
//                                       });
//                                   });
//                                 }
//                               }



router.post('/get_coord', isLoggedIn, function(req, res, next) {

    User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.lat = req.body.lat;
            user.local.lng = req.body.lng;
            console.log(req.user);
            console.log("MEIN YAHA HUN");
            user.save((err, user) => {
                if(err) throw err;
                if(req.user.local.chain === null || req.user.local.chain == "deleted") {
                  //.log(req.user);
                  console.log("I AM RETURNING HERE");
                  res.end();
                  return;
                }
                console.log("HERE NOW BC");
                console.log(req.user.local.chain);
                Chain.findOne({'local.color' : req.user.local.chain}, function(err, chain) {
                  console.log("WTF");
                  console.log(chain);
                  var user_array = chain.local.user_array;
                  user_array.forEach(function(user_in_chain, index) {
                    console.log(user_array[index]);
                    if(user_in_chain.local.username == req.user.local.username) {
                      console.log("User found: " + user_array[index].local.username);
                      console.log(req.body.lat + "  " + req.body.lng);
                      user_array[index].local.lat = req.body.lat;
                      user_array[index].local.lng = req.body.lng;
                    }
                  });
                  chain.local.user_array = user_array;
                  console.log("New chain: " + JSON.stringify(chain));

                  // chain5 = new Chain();
                  // chain5.local = chain.local;
                  // //chain5._id = {"$oid": "5a6bd6e9afc1d02c512f9ee0"};
                  // chain5.save(function(err, chain3) {
                  //   if(err) throw err;
                  //   console.log("Saving a chutiya chain");
                  // });

                  Chain.update({'local.color' : req.user.local.chain},{'local' : chain.local}, function(err, affected) {
                    if(err) throw err;
                    console.log(JSON.stringify(affected));
                    // console.log(chain2 == chain);
                    //Check if chain is valid and self intersection and other intersections
                    console.log("Chain co-ordinates updated: " + JSON.stringify(chain));
                    var user_array2 = chain.local.user_array;
                    var edge = [];
                    for(var i = 0; i < user_array2.length - 1; i++) {
                      edge.push({'f' : user_array2[i], 's' : user_array2[i + 1]});
                      //var dist = geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng], {format: false, unit: 'km'});
                    }
                    console.log("Edge: " + JSON.stringify(edge));
                    var ok = 1, M = 100000;
                    for(var i = 0; i < edge.length; i++) {
                      var dist = geodist([edge[i].f.local.lat, edge[i].f.local.lng], [edge[i].s.local.lat, edge[i].s.local.lng], {format: false, unit: 'km'});
                      if(dist > 10) {

                        console.log("Edge greater than 10");
                        ok = 0;
                      }
                      for(var j = i + 2; j < edge.length; j++) {
                        p1 = [edge[i].f.local.lat * M, edge[i].f.local.lng * M];
                        p2 = [edge[i].s.local.lat * M, edge[i].s.local.lng * M];
                        p3 = [edge[j].f.local.lat * M, edge[j].f.local.lng * M];
                        p4 = [edge[j].s.local.lat * M, edge[j].s.local.lng * M];
                        if(intersects([p1, p2], [p3, p4])) {
                          console.log("Self intersection");
                          ok = 0;
                        }
                      }
                    }
                    console.log("OK: " + ok);
                    if(ok === 0) {
                      console.log("Redundant1");
                      Chain.findOneAndRemove({'local.color' : chain.local.color}, function(err, chain2) {
                        console.log(chain2);
                        User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
                        .exec(function(err, list_users) {
                          if(err) throw err;
                          list_users.forEach(function(user, index) {
                            list_users[index].local.chain = "deleted";
                            list_users[index].local.inviteSent = false;
                            list_users[index].local.invites = [];
                            list_users[index].save(function(err, user) {
                              if(err) throw err;
                              else console.log(user.local.chain + "means deleted");
                            });
                          });
                        });
                      });
                    } else {
                      //Checking for other intersections
                      Chain.find({}, 'local.color local.user_array')
                      .exec(function(err, list_chains) {

                        for(var i = 0; i < list_chains.length; i++) {
                          if(list_chains[i].local.color === chain.local.color)  continue;
                          var user_array3 = list_chains[i].local.user_array;
                          console.log("User array of other chain:" + JSON.stringify(user_array3));
                          for(var j = 0; j < user_array3.length - 1; j++) {
                            p1 = [user_array3[j].local.lat * M, user_array3[j].local.lng * M]; //User array 3 first co-ordinate
                            p2 = [user_array3[j + 1].local.lat * M, user_array3[j + 1].local.lng * M]; // User array 3 second co-ordinate
                            console.log("My chain user array: " + JSON.stringify(user_array2));
                            for(var k = 0; k < user_array2.length - 1; k++) {
                              p3 = [user_array2[k].local.lat * M, user_array2[k].local.lng * M]; //User array 2 first co-ordinate
                              p4 = [user_array2[k + 1].local.lat * M, user_array2[k + 1].local.lng * M]; //User array 2 second co-ordinate
                              console.log(p1 + "   " + p2 + " " + p3 + "  " + p4);
                              if(intersects([p1, p2], [p3, p4])) {
                                var my_sz = user_array2.length, opponent_sz = user_array3.length;
                                console.log("Intersected");
                                if(my_sz >= opponent_sz / 2) {
                                  User.find({'local.chain' : chain.local.color}, 'local.points local.username')
                                  .exec(function(err, list_users) {
                                    list_users.forEach(function(user, index) {
                                      if(list_users[index].local.username == user_array2[k].local.username || list_users[index].local.username == user_array2[k].local.username) {
                                        list_users[index].local.points += (500  * opponent_sz);
                                      } else {
                                        list_users[index].local.points += (100  * opponent_sz);
                                      }
                                      list_users[index].save(function(err, user) {
                                        if(err) throw err;
                                      });
                                    });
                                  }); 
                                  Chain.findOneAndRemove({'local.color' : list_chains[i].local.color}, function(err, chain2) {
                                    console.log("Deleting opponent's chain" + chain2);
                                    User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
                                      .exec(function(err, list_users) {
                                        if(err) throw err;
                                        list_users.forEach(function(user, index) {
                                          list_users[index].local.chain = "deleted";
                                          list_users[index].local.inviteSent = false;
                                          list_users[index].local.invites = [];
                                          list_users[index].save(function(err, user) {
                                            if(err) throw err;
                                            console.log(user.local.chain + " means deleted");
                                            res.end();
                                            return;
                                          });
                                        });
                                      });
                                  });
                                } else if(my_sz / 2 <= opponent_sz) {
                                  User.find({'local.chain' : list_chains[i].local.color}, 'local.points local.username')
                                  .exec(function(err, list_users) {
                                    list_users.forEach(function(user, index) {
                                      if(list_users[index].local.username == user_array3[k].local.username || list_users[index].local.username == user_array3[k].local.username) {
                                        list_users[index].local.points += (500  * opponent_sz);
                                      } else {
                                        list_users[index].local.points += (100  * opponent_sz);
                                      }
                                      list_users[index].save(function(err) {
                                        if(err) throw err;
                                      });
                                    });
                                  });
                                  Chain.findOneAndRemove({'local.color' : chain.local.color}, function(err, chain2) {
                                    console.log("Deleting my chain" + chain2);
                                    User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
                                      .exec(function(err, list_users) {
                                        if(err) throw err;
                                        list_users.forEach(function(user, index) {
                                          list_users[index].local.chain = "deleted";
                                          list_users[index].local.inviteSent = false;
                                          list_users[index].local.invites = [];
                                          list_users[index].save(function(err, user) {
                                            if(err) throw err;
                                            console.log(user.local.chain + " means deleted");
                                            res.end();
                                            return;
                                          });
                                        });
                                      });
                                  });
                                } else {
                                  continue;
                                }
                              }
                            }
                          }
                        }
                      });
                    }
                    console.log("Chain after saving: ");
                    res.end();
                    //return;
                  });
                });
            });
    }); //User.findOne
}); //router.post

router.get('/profile', isLoggedIn, function(req, res) {
        User.find({}, 'local.points local.username')
        .exec(function(err, list_users) {
          list_users = list_users.map((user) => user.local);
          list_users.sort(function(user1, user2) {
            //console.log(user1);
            if(user1.points > user2.points) {
              return -1;
            } else if(user1.points < user2.points) {
              return 1;
            } else {
              return 0;
            }
          });
          var me_index = -100;
          for(var i = 0; i < list_users.length; i++) {
            if(list_users[i].username == req.user.local.username) me_index = i + 1;
          }
          //console.log(list_users);
          res.render('profile', {rankedUsers: list_users, me_index: me_index, me: req.user.local});
        });
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
