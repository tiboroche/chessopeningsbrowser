import { messages } from "./messages.js";

const DEBUG = document.location.host.startsWith("localhost");

const CHESS_COM_URI = "https://chess.com/explorer?moveList=";
const LICHESS_ORG_URI = "https://lichess.org/analysis/";

const DEFAULT = `
[Event "Italian"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 {Giuoco Piano} *

[Event "Ruy-Lopez"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 *

[Event "Queen Gambit accepted"]

1. d4 d5 2. c4 dxc4 3. Qa4+ *
`;

const WHITE_LETTERS = {
  K: "k",
  Q: "q",
  B: "b",
  N: "h",
  R: "r",
};

const BLACK_LETTERS = {
  K: "l",
  Q: "w",
  B: "n",
  N: "j",
  R: "t",
};

const OPTIONS = {
  fast_forward: false, // auto advance to next node
};

let currentTree = undefined;
let currentlang = "en";

// functions related to the board display
const Board = class Board {
  constructor(chess) {
    const config = {
      viewOnly: true,
    };

    // eslint-disable-next-line new-cap
    const ground = Chessground(document.getElementById("board1"), config);

    this.board = ground;
    this.chess = chess;
  }

  reset() {
    this.board.state.lastMove = undefined;
    this.board.set({ fen: "start" });
  }

  switch() {
    this.board.toggleOrientation();
  }

  setPosition(fen) {
    this.board.set({ fen: fen });
  }

  markmove(move) {
    this.board.state.lastMove = [move.from, move.to];
  }

  showmoves(moves, hightlight= undefined) {
    const shapes = moves.map(function (move) {
      const brush = move == hightlight ? "yellow" : "green"; 
      return { orig: move.from, dest: move.to, brush: brush };
    });

    debug("Drawing shapes", JSON.stringify(shapes));

    this.board.setShapes(shapes);
  }

  move(move) {
    const chessmove = this.chess.move(move.san);

    move.chessmove = chessmove;

    debug("Making move", move.san, this.chess.ascii(), chessmove);
    if (chessmove) {
      const ret = this.board.move(chessmove["from"], chessmove["to"]);
      this.setPosition(this.chess.fen());
      return ret;
    } else {
      alert(_("invalid_move"));
    }
  }

  destroy() {
    this.board.destroy();
  }
};

const Move = class Move {
  san; // the san coordinate of the move
  comment;
  predecessor;
  openings;
  successors;
  chessmove;
  from;
  to;

  constructor(san) {
    this.san = san;
    this.openings = [];
    this.successors = [];
  }

  toString() {
    return `${this.san} (${this.successors.length}successors )`;
  }

  onlysuccessor() {
    if (this.successors.length == 1) {
      return this.successors[0];
    } else {
      return undefined;
    }
  }
};

const OpeningTree = class OpeningTree {
  currentMove;
  startMove;
  chess;

  constructor(content, updateuri) {
    this.content = content;
    this.startMove = new Move("");
    this.currentMove = this.startMove;
    this.chess = new Chess();
    this.board = new Board(this.chess);
    this.gameslength = 0;
    this.errors = undefined;

    let games = this.load();

    if (!games) {
      this.content = DEFAULT;
      updateuri = false;
      games = this.load();
    }

    if (games) {
      this.inittree(games);

      if (updateuri) {
        this.updateuri();
      }

      // make the first move if only one
      const onlysucc = this.currentMove.onlysuccessor();
      if (onlysucc && OPTIONS.fast_forward) {
        this.makemove(onlysucc);
      } else {
        this.displaymoves();
      }
    }
  }

  load() {
    debug("Reading PGN ", this.content);

    const ret = parse(this.content);
    const games = ret[0];
    const errors = ret[1];

    if (!games) {
      alert(_("invalid_pgn"));
      return undefined;
    } else {
      const validgames = [];
      games.forEach(function (game) {
        if (game["headers"] && game["headers"]["Event"] != "") {
          validgames.push(game);
        }
      });

      debug("games loaded", JSON.stringify(validgames));
      log(`Loaded ${validgames.length} games.`);
      if (errors.length) {
        log(`${errors.length} errors found in the file`);
        errors.forEach(function (error) {
          log(error);
        });
        this.errors = errors;
      }

      this.gameslength = validgames.length;

      return validgames;
    }
  }

  updateuri() {
    let url = window.location.origin + window.location.pathname;

    url += "?content=" + LZString.compressToEncodedURIComponent(this.content);

    window.history.pushState(undefined, "", url);

    let message = `${this.gameslength} ${_("loaded")}`;

    debug("Errors found : ", this.errors);

    if (this.errors) {
      message += `\n\n${_("errors_found")}\n` + this.errors.join("\n");
    }

    alert(message);
  }

  inittree(games) {
    const start = this.startMove;
    games.forEach(function (game) {
      const gamename = game["headers"]["Event"];

      let curMove = start;
      const localchess = new Chess();

      game.moves.forEach(function (move) {
        let found = false;
        const movesan = move;
        const chessmove = localchess.move(movesan);
        for (let j = 0; j < curMove.successors.length; j++) {
          const next = curMove.successors[j];
          if (next.san === movesan) {
            // found !
            curMove = next;
            found = true;
            break;
          }
        }
        // not found create a new node
        if (!found) {
          const next = new Move(movesan);
          next.from = chessmove["from"];
          next.to = chessmove["to"];
          curMove.successors.push(next);
          next.predecessor = curMove;
          // debug("New move from", JSON.stringify(move), curMove, next);
          curMove = next;
        }

        // find the comment
        for (let i = 0; i < game["comments"].length; i++) {
          const comment = game["comments"][i];
          if (comment["fen"] === localchess.fen()) {
            curMove.comment = comment["comment"];
          }
        }

        curMove.openings.push(gamename);
      });
    });
  }

  history(move = this.currentMove) {
    const pastmoves = [];
    let past = move;

    while (past.predecessor) {
      pastmoves.unshift(past);
      past = past.predecessor;
    }

    return pastmoves;
  }

  santohtml(move, white, openings = false) {
    // check the first letter for a piece
    let html = "";
    let san = move.san;
    const letters = white ? WHITE_LETTERS : BLACK_LETTERS;
    const pieceletter = letters[san[0]];

    if (pieceletter) {
      html += `<span style="font-family: chessregular;">${pieceletter}</span>`;
      san = san.slice(1);
    }

    html += `<b>${san}`;

    if (openings) {
      if (move.openings.length == 1) {
        html += " [" + move.openings.join(",") + "]";
      } else {
        html += ` [${move.openings[0]} ${_("and")} ${
          move.openings.length - 1
        } ${_("others")}]`;
      }
    }

    html += `</b>`;

    if (move.comment) {
      html += ` <i>${move.comment}</i>`;
    }

    return html;
  }

  showbreadcrumb(movelist) {
    $("#breadcrumb").empty();

    const p = $(`<p>&nbsp;</p>`).appendTo($("#breadcrumb"));

    for (let i = 0; i < movelist.length; i++) {
      const white = i % 2 === 0;
      let breadcrumb = "";
      if (white) {
        // white turn
        breadcrumb += `${i / 2 + 1}.`;
      }
      breadcrumb += ` ${this.santohtml(movelist[i], white)} `;

      $(`<span role="button">${breadcrumb}</a>`)
        .appendTo(p)
        .on("click", () => {
          this.backtomove(movelist[i]);
        });
    }
  }

  displaymoves() {
    const pastmoves = this.history();
    const white = pastmoves.length % 2 == 0;

    const movesdiv = $("#moves");

    this.showbreadcrumb(pastmoves);
    movesdiv.empty();
    $("#toplay").empty();

    const size = "h4";

    if (white) {
      $(`<p class="${size}">${_("white_to_play")}</p>`).appendTo($("#toplay"));
    } else {
      $(`<p class="${size}">${_("black_to_play")}</p>`).appendTo($("#toplay"));
    }

    const buttonsclass = "btn btn-small btn-block";

    const buttonscolorclass =
      (white ? "btn-outline-secondary" : "btn-outline-dark") + " m-1";
    const otherbuttonscss = "btn-secondary m-1";
    const chessbuttonscolorclass = "btn-success m-1";
    const lichessbuttonscolorclass = "btn-dark m-1";

    const topbuttons = $(
      '<div class="btn-group btn-group-sm" role="group" ></div>'
    ).appendTo(movesdiv);

    const button = (to, text, cssclass, clickHandler, mousenter=undefined, mouseleave=undefined) => {
      const button = $(`<button class="${buttonsclass} ${cssclass}">${text}</button>`)
        .appendTo(to)
        .on("click", clickHandler);
        if (mousenter){
          button.on("mouseover", mousenter);
        }
        if (mouseleave){
          button.on("mouseleave", mouseleave);
        }

    };

    button(topbuttons, _("back"), otherbuttonscss, () => {
      this.backonemove();
    });
    button(topbuttons, _("reset"), otherbuttonscss, () => {
      this.resetboard();
    });
    button(topbuttons, _("switch"), otherbuttonscss, () => {
      this.switchboard();
    });

    button(movesdiv, _("chess_com"), chessbuttonscolorclass, () => {
      window
        .open(
          CHESS_COM_URI +
            this.history()
              .map((move) => move.san)
              .join("+"),
          "_blank"
        )
        .focus();
    });

    button(movesdiv, _("lichess_org"), lichessbuttonscolorclass, () => {
      window.open(LICHESS_ORG_URI + this.chess.fen(), "_blank").focus();
    });

    this.currentMove.successors.forEach((move) => {
      button(
        $("#moves"),
        this.santohtml(move, white, true),
        buttonscolorclass,
        () => {
          currentTree.makemove(move, this.currentMove);
        },
        () => {
          this.board.showmoves(this.currentMove.successors, move);
        },
        () => {
          this.board.showmoves(this.currentMove.successors);
        },
      );
    });

    this.board.showmoves(this.currentMove.successors);
  }

  backonemove() {
    this.backtomove(this.currentMove.predecessor);
  }

  backtomove(move) {
    while (this.currentMove != move && this.currentMove.predecessor) {
      this.currentMove = this.currentMove.predecessor;
      this.chess.undo();
    }

    this.board.setPosition(this.chess.fen());
    if (this.currentMove.chessmove) {
      this.board.markmove(this.currentMove.chessmove);
    }
    this.displaymoves();
  }

  resetboard() {
    this.chess.reset();
    this.currentMove = this.startMove;
    this.board.reset();
    this.displaymoves();
  }

  switchboard() {
    this.board.switch();
  }

  async makemove(nextmove) {
    debug("Making move : ", nextmove, this.currentMove);
    if (nextmove.predecessor != this.currentMove) {
      // wrong initial state, probably a click too fast
      return;
    }

    let candidate = nextmove;
    this.currentMove = candidate;

    while (true) {
      await this.board.move(candidate);
      const next = candidate.onlysuccessor();

      if (next && OPTIONS.fast_forward) {
        this.showbreadcrumb(this.history(candidate));
        await sleep(100);
        candidate = next;
        this.currentMove = candidate;
      } else {
        break;
      }
    }

    this.displaymoves();
    return;
  }
};

// ========================================
// PGN parsing

function parse(content) {
  const games = [];
  const errors = [];
  const chess = new Chess();

  content = content.replaceAll("[Event", "~[Event");
  const rawgames = content.split("~");

  debug("rawgames", rawgames);

  const parseonegame = function (str) {
    str = str.trim();
    if (str) {
      debug("Loading ", str);
      const valid = chess.load_pgn(str);
      debug("Got ", valid);

      if (valid) {
        const game = {};
        game["headers"] = chess.header();
        game["moves"] = chess.history();
        game["comments"] = chess.get_comments();
        return game;
      } else {
        const header = chess.header();
        if (header) {
          return `${header["Event"]} is invalid.`;
        }
        return "Invalid game found.";
      }
    }
  };

  rawgames.forEach(function (content) {
    if (content) {
      const parsed = parseonegame(content);
      if (parsed) {
        if (typeof parsed === "string") {
          errors.push(parsed);
        } else {
          games.push(parsed);
        }
      }
    }
  });

  debug("Return ", games, errors);

  return [games, errors];
}

// ========================================
// Helper functions

function _(messageid) {
  return messages[currentlang][messageid];
}

function __log(level, strings) {
  console.log("[" + level + "] " + strings.join(" / "));
}

function log(...args) {
  __log("INFO", args);
}

function debug(...args) {
  if (DEBUG) {
    __log("DEBUG", args);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readOneFile(e, readerfunction) {
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
}

function parsePGNfile(content, updateuri = true) {
  if (currentTree && currentTree.board) {
    try {
      currentTree.board.destroy();
    } catch {}
  }
  currentTree = new OpeningTree(content, updateuri);
}

function setlang(lang) {
  if (lang != currentlang && lang in messages) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("lang", lang);

    window.location.href =
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      urlParams.toString();
  }
}

// ========================================
// DOM interactions
function onload() {
  const urlParams = new URLSearchParams(window.location.search);

  const content = urlParams.get("content");
  const lang = urlParams.get("lang") || navigator.language || "en";

  currentlang = lang.slice(0, 2);
  if (messages[currentlang] === undefined) {
    currentlang = "en";
  }

  $(document).on("change", "#pgnupload", function (e) {
    readOneFile(e, parsePGNfile);
    $("#pgnupload").val("");
  });

  $("#pgndownloadlink").on("click", function () {
    const blob = new Blob([currentTree.content], {
      type: "application/vnd.chess-pgn, application/x-chess-pgn",
    });
    saveAs(blob, "openings.pgn");
  });

  $("#pgnuploadlink").on("click", function () {
    $("#pgnupload").trigger("click");
  });

  $("#flag-fr").on("click", () => {
    setlang("fr");
  });

  $("#flag-us").on("click", () => {
    setlang("en");
  });

  const setMessage = (messageId) => {
    $("#" + messageId).html(_(messageId));
    debug("Setting message", messageId, $(messageId), _(messageId));
  };

  setMessage("title");
  setMessage("pgnuploadlink");
  setMessage("pgndownloadlink");
  setMessage("help_text");

  let loaded = false;

  if (content) {
    const uncompressed = LZString.decompressFromEncodedURIComponent(content);
    if (uncompressed) {
      parsePGNfile(uncompressed, false);
      loaded = true;
    }
  }

  if (!loaded) {
    parsePGNfile(DEFAULT, false);
  }
}

onload();
