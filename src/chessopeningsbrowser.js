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
      let text = this.san + " [" + this.openings.join(",") + "]";
      if (this.comment) {
        text += " " + this.comment;
      }
      return text;
    }
  };

  const OpeningTree = class OpeningTree {
    currentMove;
    startMove;
    chess;

    constructor(content) {
      this.content = content;
      this.startMove = new Move("");
      this.currentMove = this.startMove;
      this.chess = new Chess();

      this.inittree(this.load());

      this.updateuri();

      debug("root", this.startMove);

      this.startMove.successors.forEach(function (move) {
        debug("start move", move);
      });

      this.displaymoves();
    }

    load() {
      let games = [];
      try {
        games = pgnParser.parse(this.content);
      } catch {
        alert("Invalid PGN file");
      }

      // debug("games loaded", JSON.stringify(games));
      log(`Loaded ${games.length} games.`);

      return games;
    }

    updateuri() {
      let url = window.location.origin + window.location.pathname;

      url += "?content=" + LZString.compressToEncodedURIComponent(this.content);

      window.history.pushState(undefined, "", url);
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
      const pastmoves = [];
      let past = this.currentMove;
      let breadcrumb = "";

      while (past.predecessor) {
        pastmoves.unshift(past.san);
        past = past.predecessor;
      }

      let turn = 0;
      let white = true;
      for (let i = 0; i < pastmoves.length; i++) {
        if (white) {
          // white turn
          turn++;
          breadcrumb += `${turn}. ${pastmoves[i]}`;
        } else {
          breadcrumb += ` ${pastmoves[i]} `;
        }
        white = !white;
      }

      $("#breadcrumb").empty();
      $(`<p>${breadcrumb}</p>`).appendTo($("#breadcrumb"));

      $("#moves").empty();

      this.currentMove.successors.forEach(function (move) {
        $(
          `<p><button class=\"btn btn-primary p-3\">${move.linktext()}</button></p>`
        )
          .appendTo($("#moves"))
          .on("click", function () {
            currentTree.makemove(move.san);
          });
        // $(`<a class=\"primary-link\" href=\"#\">${move.linktext()}</a>`).appendTo($("#moves")).on("click", function() {currentTree.makemove(move.san);});
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

  const parsePGNfile = (content) => {
    currentTree = new OpeningTree(content);
  };

  // ========================================
  // DOM interactions
  $(document).on("input", "#file-input", function (e) {
    readOneFile(e, parsePGNfile);
  });

  const loadfromuri = () => {
    // load the content from the uri
    const urlParams = new URLSearchParams(window.location.search);

    const content = urlParams.get("content");

    if (content) {
      const uncompressed = LZString.decompressFromEncodedURIComponent(content);
      if (uncompressed) {
        parsePGNfile(uncompressed);
      }
    }
  };

  loadfromuri();
})();
