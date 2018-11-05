
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
            rock: "bg-primary",
            paper: "bg-danger",
            scissors: "bg-success",
            default: "bg-secondary"
        },
        playerId: "",
        sessionId: "",
        playerDiv: $("#playerDiv"),
        opponentDiv: $("#opponentDiv"),
        winnerText: $("#winner"),
        playerHasChosen: false,
        opponentHasChosen: false,
        gameOver: false,
        player1: {
            choice: "rock",
            wins: 0,
            losses: 0,
            ties: 0
        },
        player2: {
            choice: ""
        },

        reset() {
            $("#playerName").text(game.player1.name)

            connectionsRef.child(game.playerId).update({
                choice: game.player1.choice,
                hasChosen: game.playerHasChosen
            })
            game.player1.choice = "";
            game.playerHasChosen = false;
            game.opponentHasChosen = false;
            game.gameOver = false;
            game.winnerText.text("");
            game.playerDiv.removeClass("bg-primary bg-danger bg-success");
            game.playerDiv.addClass(game.elements.default);
            game.opponentDiv.removeClass("bg-primary bg-danger bg-success");
            game.opponentDiv.addClass(game.elements.default)
        },

        update(value) {
            if (!game.gameOver) {
                if (!game.playerHasChosen) {
                    console.log("Player 1 chose " + value)
                    game.playerDiv.removeClass("bg-secondary");
                    game.playerDiv.addClass(game.elements[value]);
                    game.player1.choice = value;
                    game.playerHasChosen = true;
                } else if (game.playerHasChosen && !game.opponentHasChosen) {
                    console.log("Player 2 chose " + value);
                    game.opponentDiv.removeClass("bg-secondary");
                    game.opponentDiv.addClass(game.elements[value]);
                    game.player2.choice = value;
                    game.opponentHasChosen = true;
                    setTimeout(game.update, 1000);
                } else if (game.playerHasChosen && game.opponentHasChosen) {
                    var result = game.calc(game.player1.choice, game.player2.choice)
                    game.gameOver = true;
                    console.log(result);
                    game.winnerText.text(result);
                    setTimeout(game.reset, 5000);
                }

            }

        },



        calc(playerChoice, opponentChoice) {


            var outcome = "DEFAULT";

            if (playerChoice == opponentChoice) {
                outcome = "Tie";
                game.player1.ties++;
            }

            switch (playerChoice) {
                case "rock":
                    switch (opponentChoice) {
                        case "paper":
                            outcome = game.player2.name;
                            game.player1.losses++;
                            break;
                        case "scissors":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                case "paper":
                    switch (opponentChoice) {
                        case "scissors":
                            outcome = game.player1.name;
                            game.player1.losses++;
                            break;
                        case "rock":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                case "scissors":
                    switch (opponentChoice) {
                        case "rock":
                            outcome = game.player2.name;
                            game.player1.losses++;
                            break;
                        case "paper":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                default:
                    outcome = "BLEP";
                    break;
            }

            return outcome;
        }


    }


    // connectionsRef references a specific location in our database.
    // All of our connections will be stored in this directory.
    var connectionsRef = database.ref("/connections");

    // '.info/connected' is a special location provided by Firebase that is updated   
    // the client's connection state changes.
    // '.info/connected' is a boolean value, true if the client is connected and false if they are not.
    var connectedRef = database.ref(".info/connected");

    var sessionsRef = database.ref("/Sessions");
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

            game.playerId = con.key;
          
        }
    });
   
    connectionsRef.on("value", function (snap) {

        console.log("SESSIN ")
        for(let i in snap){
            console.log(i);
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