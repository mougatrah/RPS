
$(document).ready(function () {

    var config = {
        apiKey: "AIzaSyDm8cfSHDjdhjYkxO77oQqOM9RNxvZ1eVg",
        authDomain: "rpsgame-47199.firebaseapp.com",
        databaseURL: "https://rpsgame-47199.firebaseio.com",
        projectId: "rpsgame-47199",
        storageBucket: "rpsgame-47199.appspot.com",
        messagingSenderId: "979956531596"
    };

    firebase.initializeApp(config);
    database = firebase.database();
    userRef = database.ref("/users");

    var game = {
        user: {
            wins: 0,
            losses: 0,
            ties: 0
        },
        AI: {
            wins: 0,
            losses: 0,
            ties: 0
        },
        elements: {
            rock: "./rock.jpg",
            paper: "./paper.jpg",
            scissors: "./scissors.jpg",
            default: "./default.jpg"
        },
        elementsArray: [
            "rock",
            "paper",
            "scissors"
        ],
        con: null,
        connectionsRef: database.ref("/connections"),
        connectedRef: database.ref(".info/connected"),
        timeout: null,
        messages: [],
        playerId: "",
        opponentId: "",
        sessionJoined: false,
        playerDiv: $("#playerDiv"),
        opponentDiv: $("#opponentDiv"),
        winnerText: $("#winner"),
        messageText: $("#message"),
        isSolo: $("#isSolo")[0],
        playerHasChosen: false,
        opponentHasChosen: false,
        gameOver: false,
        playerChoice: "",
        opponentChoice: "",
    
        displayMessages(text) {

            if (game.messages.length > 3) {
                game.messages.shift();
            }
            game.messages.push(text);

            game.messageText.html("");

            for (let m in game.messages) {
                game.messageText.append($("<li>").text(game.messages[m]));
            }

        },

        reset() {

            game.displayMessages("Resetting...");

            game.playerChoice = "";
            game.playerHasChosen = false;
            game.opponentHasChosen = false;

            if (game.con) {
                game.connectionsRef.child(game.playerId).update({
                    choice: game.playerChoice,
                    hasChosen: game.playerHasChosen,
                    inSession: game.sessionJoined
                })
            }
            game.gameOver = false;

            game.winnerText.text("");

            game.playerDiv.attr("src", game.elements.default);

            game.opponentDiv.attr("src", game.elements.default)
        },


        update(value) {

            if (game.isSolo.checked && !game.con) {
                game.displayMessages("You chose: " + value);
                game.playerChoice = value;
                game.playerHasChosen = true;
                game.playerDiv.attr("src", game.elements[value]);
                game.opponentHasChosen = true;
                game.calc();

            } else {
                if (!game.gameOver && game.sessionJoined && !game.playerHasChosen) {

                    game.playerChoice = value;
                    game.playerHasChosen = true;
                    game.playerDiv.attr("src", game.elements[value]);

                    if (game.con) {
                        game.connectionsRef.child(this.playerId).update({
                            choice: game.playerChoice,
                            hasChosen: game.playerHasChosen
                        });
                    } else {
                        game.opponentChoice = game.elements[0];
                    }
                    if (!game.opponentHasChosen) {
                        game.displayMessages("Waiting for opponent's choice...");
                    } else {
                        game.calc();
                    }
                }
            }

        },

        updateScore() {
            if(game.con){
                $("#score").html("<small> Wins: " + game.user.wins + "<br> Losses: " + game.user.losses + "<br> Ties: " + game.user.ties + "</div>");

            }else{
                $("#score").html("<small> AI Wins: " + game.AI.wins + "<br> AI Losses: " + game.AI.losses + "<br> AI Ties: " + game.AI.ties + "</div>");
            }
        },

        calc() {
            if (game.playerHasChosen && game.opponentHasChosen) {

                game.displayMessages("Calculating...");
                var outcome = "DEFAULT";

                if (game.con) {
                    game.connectionsRef.child(game.opponentId).once("value", function (snap) {
                        game.opponentChoice = snap.val().choice;
                    })

                } else {
                    game.opponentChoice = game.elementsArray[Math.floor(Math.random() * 3)];
                }
                game.displayMessages("Opponent chose: " + game.opponentChoice);

                game.opponentDiv.attr("src", game.elements[game.opponentChoice])

                var score;
                if(game.con){
                    score = game.user;
                }else{
                    score = game.AI;
                }
                if (game.playerChoice == game.opponentChoice) {
                    outcome = "Tie";
                    score.ties++;
                } else {

                    switch (game.playerChoice) {
                        case "rock":
                            switch (game.opponentChoice) {
                                case "paper":
                                    outcome = "Lost";
                                    score.losses++;
                                    break;
                                case "scissors":
                                    outcome = "Won";
                                    score.wins++;
                                    break;
                            }
                            break;
                        case "paper":
                            switch (game.opponentChoice) {
                                case "scissors":
                                    outcome = "Lost";
                                    score.losses++;
                                    break;
                                case "rock":
                                    outcome = "Won";
                                    score.wins++;
                                    break;
                            }
                            break;
                        case "scissors":
                            switch (game.opponentChoice) {
                                case "rock":
                                    outcome = "Lost";;
                                    score.losses++;
                                    break;
                                case "paper":
                                    outcome = "Won";
                                    score.wins++;
                                    break;
                            }
                            break;
                        default:
                            outcome = "BLEP";
                            break;
                    }

                }

                game.displayMessages("Results: " + outcome);
                game.updateScore();
                $("#winner").text(outcome);
                game.gameOver = true;
                if (game.timeout) {
                    clearTimeout(game.timeout);
                    game.timeout = setTimeout(game.reset, 3000);
                } else {
                    game.timeout = setTimeout(game.reset, 3000);
                }
            }
        },

        connect() {

            if (game.con) {
                userRef.child(game.user.uid).update({
                    wins: game.user.wins,
                    losses: game.user.losses,
                    ties: game.user.ties
                })
                game.sessionJoined = false;
                game.con.remove();
                game.con = null;
                game.connectionsRef.off("value");
                game.connectedRef.off("value");
                $("#watchers").text("n/a");

                game.displayMessages("Disconnecting...");
                if (game.timeout) {
                    clearTimeout(game.timeout);
                    game.reset();
                } else {
                    game.reset();
                }
                game.displayMessages("You are now playing the AI. Please make a choice.")
                game.updateScore();
            } else {
                if (game.timeout) {
                    clearTimeout(game.timeout);
                    game.reset();
                } else {
                    game.reset();
                }
                game.setup();
            }
        },

        setup() {
            game.displayMessages("Connecting...")
            // When the client's connection state changes...
            console.log(game.user)
            userRef.child(game.user.uid).once("value", function(snap){
                let { wins,losses, ties } = snap.val();
                    game.user.wins = wins;
                    game.user.losses = losses;
                    game.user.ties = ties;
                game.updateScore();
            })

            game.connectedRef.on("value", function (snap) {

                // If they are connected..
                if (snap.val()) {

                    // Add user to the connections list.
                    game.con = game.connectionsRef.push({
                        user: game.user.uid,
                        inSession: false,
                        hasChosen: false,
                        choice: ""
                    });

                    // Remove user from the connection list when they disconnect.
                    game.con.onDisconnect().remove();

                    game.displayMessages("You connected. Waiting for an opponent...");
                    game.updateScore();
                    game.playerId = game.con.key;

                }
            });

            game.connectionsRef.on("value", function (snap) {
                if (game.sessionJoined == false) {
                    var result;
                    game.displayMessages("Searching for opponent...");

                    snap.forEach(function (childsnap) {
                        if (childsnap.val().inSession == false && childsnap.val().user != game.user.uid && game.playerId != childsnap.key) {
                            result = childsnap.key;
                            return true;
                        }
                    });

                    if (result != undefined) {
                        game.opponentId = result;
                        game.sessionJoined = true;

                    if(game.con){
                        game.connectionsRef.child(game.playerId).update({
                            inSession: game.sessionJoined
                        });

                        game.connectionsRef.child(result).on("value", function (snap) {
                            if (snap.val() && !game.isSolo.checked) {

                                game.opponentHasChosen = snap.val().hasChosen;
                                if (game.opponentHasChosen) {
                                    game.displayMessages("Opponent has chosen.");
                                    if (!game.playerHasChosen) {
                                        game.displayMessages("Please make a choice.")
                                    } else {
                                        game.calc();
                                    }
                                }
                            } else {

                                game.opponentId = "";
                                game.sessionJoined = false;
                               if(game.con){
                                game.connectionsRef.child(game.playerId).update({
                                    inSession: game.sessionJoined
                                })

                               }
                                game.displayMessages("Opponent has disconnected");
                                game.reset();
                                game.displayMessages("Waiting for new opponent...")

                            }
                        });

                    }
                            game.displayMessages("Opponent found. Please make a choice.")
                    } else {
                        game.displayMessages("No opponent found.");
                    }

                }
                // Display the viewer count in the html.
                // The number of online users is the number of children in the connections list.
                $("#watchers").text(snap.numChildren());
            });

        }
    }


    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // User successfully signed in.
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                console.log(authResult);
                userRef.once("value", function(snap){
                    var result;
                    snap.forEach(function(childsnap) {
                        if(childsnap.val().email === authResult.user.email){
                            result = childsnap.val();
                            result.uid = childsnap.key;
                            return true;
                        }
                    });
                    console.log(result);
                    if(result === undefined){
                        result = {
                            displayName: authResult.user.displayName ? authResult.user.displayName : authResult.user.email.split("@").unshift(),                         
                            wins: 0,
                            losses: 0,
                            ties: 0,
                            playing: true
                        };

                        result.uid = userRef.push(result);
                        game.user = result;

                    } else {
                        game.user = result;
                    }

                    $("#playerName").html(game.user.displayName ? game.user.displayName : authResult.user.email.split("@").shift());
                 
                })

                $("#loginArea").hide();
                game.updateScore();

                $("#gameArea").show();

                return false;
            },
            uiShown: function () {
                // The widget is rendered.
                // Hide the loader.
                $("#gameArea").hide();
            }

        },
        signInFlow: "popup",
        signInSuccessUrl: "/",
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID
            // firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ],
        // tosUrl and privacyPolicyUrl accept either url string or a callback
        // function.
        // Terms of service url/callback.
        tosUrl: '<your-tos-url>',
        // Privacy policy url/callback.
        privacyPolicyUrl: function () {
            window.location.assign('<your-privacy-policy-url>');
        }
    };

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);

  
  

    // $("#loginArea").hide();



    // $("#login").click(function(e){

    //     $("#loginArea").toggle();
    //     $("#gameArea").toggle();
    // })

    $("#isSolo").click(function (e) {
        game.connect();
    })

    $(".element").click(function (e) {
        e.preventDefault();

        game.update($(this).attr("data-value"));
    });

    game.displayMessages("You are playing the AI. Please make a choice.")
});