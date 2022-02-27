/* eslint-disable require-jsdoc */
(function () {
  "use strict";

  // the main board
  // eslint-disable-next-line new-cap
  const board = Chessboard("board1", "start");
  let currentTree = undefined;

  // load the openings structure

  const Move = class Move {
    san; // the san coordinate of the move
    comment;
    predecessor;
    openings;
    successors;

    constructor(san) {
      this.san = san;
      this.openings = [];
      this.successors = [];
    }

    toString() {
      return this.san + " (" + this.successors.length + "successors )";
    }

    linktext() {
      let text = this.san + "[" + this.openings.join(",") + "]";
      if (this.comment) {
        text += this.comment;
      }
      return text;
    }
  };

  const OpeningTree = class OpeningTree {
    currentMove;
    startMove;
    chess;

    constructor(content) {
      this.startMove = new Move("");
      this.currentMove = this.startMove;
      this.chess = new Chess();

      this.inittree(this.load(content));

      debug("root", this.startMove);

      this.startMove.successors.forEach(function (move) {
        debug("start move", move);
      });

      this.displaymoves();
    }

    load(content) {
      const games = pgnParser.parse(content);

      // debug("games loaded", JSON.stringify(games));
      log(`Loaded ${games.length} games.`);

      return games;
    }

    inittree(games) {
      let gamename;
      const start = this.startMove;
      games.forEach(function (game) {
        // get the name of the game, the Event header
        for (let i = 0; i < game["headers"].length; i++) {
          const header = game["headers"][i];
          if (header["name"] === "Event") {
            gamename = header["value"];
            break;
          }
        }

        let curMove = start;
        game.moves.forEach(function (move) {
          let found = false;
          for (let j = 0; j < curMove.successors.length; j++) {
            const next = curMove.successors[j];
            if (next.san === move["move"]) {
              // found !
              curMove = next;
              found = true;
              break;
            }
          }
          // not found create a new node
          if (!found) {
            const next = new Move(move["move"]);
            curMove.successors.push(next);
            next.predecessor = curMove;
            // debug("New move from", JSON.stringify(move), curMove, next);
            curMove = next;
          }

          curMove.openings.push(gamename);
          const comments = move["comments"];
          if (comments && comments.length > 0) {
            curMove.comment = comments[0]["text"];
          }
        });
      });
    }

    displaymoves() {
      $("#moves").empty();

      this.currentMove.successors.forEach(function (move) {
        $("<p>" + move.linktext() + "</p>").appendTo($("#moves")).on("click", function() {currentTree.makemove(move.san);});
      });
    }

    makemove(san) {
      for (let i = 0; i < this.currentMove.successors.length; i++) {
        const candidate = this.currentMove.successors[i];
        if (candidate.san === san) {
          this.currentMove = candidate;
          this.chess.move(san);
          board.position(this.chess.fen());
          this.displaymoves();
          return;
        }
      }
    }
  };


  // ========================================
  // Helper functions
  const __log = function (level, strings) {
    console.log("[" + level + "] " + strings.join(" / "));
  };

  const log = function (...args) {
    __log("INFO", args);
  };

  const debug = function (...args) {
    __log("DEBUG", args);
  };

  const readOneFile = function (e, readerfunction) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    log("Reading file " + file.name);
    const reader = new FileReader();
    reader.onload = function (e) {
      const contents = e.target.result;
      readerfunction(contents);
    };
    reader.readAsText(file);
  };

  const parsePGNfile = function (content) {
    currentTree = new OpeningTree(content);
  };

  // ========================================

  // DOM interactions
  $(document).on("input", "#file-input", function (e) {
    readOneFile(e, parsePGNfile);
  });
})();
