
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

    var game = {
        elements: {
            rock: "./rock.jpg",
            paper: "./paper.jpg",
            scissors: "./scissors.jpg",
            default: "./default.jpg"
        },
        messages: [],
        playerId: "",
        opponentId: "",
        sessionJoined: false,
        playerDiv: $("#playerDiv"),
        opponentDiv: $("#opponentDiv"),
        winnerText: $("#winner"),
        messageText: $("#message"),
        playerHasChosen: false,
        opponentHasChosen: false,
        gameOver: false,
        playerChoice: "",
        opponentChoice: "",
        wins: 0,
        losses: 0,
        ties: 0,

        displayMessages(text) {
          
                if (game.messages.length > 2) {
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

            connectionsRef.child(game.playerId).update({
                choice: game.playerChoice,
                hasChosen: game.playerHasChosen,
                inSession: game.sessionJoined
            })

            game.gameOver = false;

            game.winnerText.text("");
            
            game.playerDiv.attr("src", game.elements.default);
    
            game.opponentDiv.attr("src", game.elements.default)

        },


        update(value) {


            if (!game.gameOver && game.sessionJoined && !game.playerHasChosen) {

                game.playerChoice = value;
                game.playerHasChosen = true;
             
                game.playerDiv.attr("src" , game.elements[value]);

                game.displayMessages("You chose: " + value);

                connectionsRef.child(this.playerId).update({
                    choice: game.playerChoice,
                    hasChosen: game.playerHasChosen
                });
                if (!game.opponentHasChosen) {
                    game.displayMessages("Waiting for opponent's choice...");
                } else {
                    game.calc();
                }



            }

        },
        updateScore(){
            $("#score").text("Wins: " + game.wins + " Losses: " + game.losses + " Ties: " + game.ties);
        },

        calc() {
            if (game.playerHasChosen && game.opponentHasChosen) {

                game.displayMessages("Calculating...");
                var outcome = "DEFAULT";
                connectionsRef.child(game.opponentId).once("value", function (snap) {
                    game.opponentChoice = snap.val().choice;
                })

               
                game.opponentDiv.attr("src", game.elements[game.opponentChoice])

                if (game.playerChoice == game.opponentChoice) {
                    outcome = "Tie";
                    game.ties++;
                } else {

                    switch (game.playerChoice) {
                        case "rock":
                            switch (game.opponentChoice) {
                                case "paper":
                                    outcome = "Lost";
                                    game.losses++;
                                    break;
                                case "scissors":
                                    outcome = "Won";
                                    game.wins++;
                                    break;
                            }
                            break;
                        case "paper":
                            switch (game.opponentChoice) {
                                case "scissors":
                                    outcome = "Lost";
                                    game.losses++;
                                    break;
                                case "rock":
                                    outcome = "Won";
                                    game.wins++;
                                    break;
                            }
                            break;
                        case "scissors":
                            switch (game.opponentChoice) {
                                case "rock":
                                    outcome = "Lost";;
                                    game.losses++;
                                    break;
                                case "paper":
                                    outcome = "Won";
                                    game.wins++;
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
                setTimeout(game.reset, 5000);

            }
        }
    }


    // connectionsRef references a specific location in our database.
    // All of our connections will be stored in this directory.
    // '.info/connected' is a special location provided by Firebase that is updated   
    // the client's connection state changes.
    // '.info/connected' is a boolean value, true if the client is connected and false if they are not.
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    // When the client's connection state changes...
    connectedRef.on("value", function (snap) {

        // If they are connected..
        if (snap.val()) {

            // Add user to the connections list.
            var con = connectionsRef.push({
                inSession: false,
                hasChosen: false,
                choice: ""
            });

            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();

            game.displayMessages("You connected. Player Id: " + con.key);
            game.updateScore();
            game.playerId = con.key;

        }
    });

    connectionsRef.on("value", function (snap) {
        if (game.sessionJoined == false) {
            var result;
            game.displayMessages("Searching for opponent...");

            snap.forEach(function (childsnap) {
                if (childsnap.val().inSession == false && game.playerId != childsnap.key) {
                    result = childsnap.key;
                    return true;
                }
            });

            if (result != undefined) {
                game.displayMessages("Session joined. Opponent: " + result);
                game.opponentId = result;
                game.sessionJoined = true;

                connectionsRef.child(game.playerId).update({
                    inSession: game.sessionJoined
                });

                connectionsRef.child(result).on("value", function (snap) {
                    if (snap.val()) {

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
                        connectionsRef.child(game.playerId).update({
                            inSession: game.sessionJoined
                        })

                        game.displayMessages("Opponent has disconnected");
                        game.reset();
                    }
                });

            } else {
                game.displayMessages("No opponent found.");
            }

        }
        // Display the viewer count in the htm  l.
        // The number of online users is the number of children in the connections list.
        //   $("#watchers").text(snap.numChildren());
    });






    $(".element").click(function (e) {
        e.preventDefault();

        game.update($(this).attr("data-value"));
    });

});