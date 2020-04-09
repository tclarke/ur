let PieceEnum = Object.freeze({NONE: 0, BLACK: 1, WHITE: 2});

const PieceImages = {};
PieceImages[PieceEnum.NONE] = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
PieceImages[PieceEnum.BLACK] = "images/black_piece.jpg";
PieceImages[PieceEnum.WHITE] = "images/white_piece.jpg";

function Ur() {
    this.state = { 
        b1: PieceEnum.NONE,
        b2: PieceEnum.NONE,
        b3: PieceEnum.NONE,
        b4: PieceEnum.NONE,
        b5: PieceEnum.NONE,
        b6: PieceEnum.NONE,
        w1: PieceEnum.NONE,
        w2: PieceEnum.NONE,
        w3: PieceEnum.NONE,
        w4: PieceEnum.NONE,
        w5: PieceEnum.NONE,
        w6: PieceEnum.NONE,
        c1: PieceEnum.NONE,
        c2: PieceEnum.NONE,
        c3: PieceEnum.NONE,
        c4: PieceEnum.NONE,
        c5: PieceEnum.NONE,
        c6: PieceEnum.NONE,
        c7: PieceEnum.NONE,
        c8: PieceEnum.NONE
    };
    this.in = {
        black: 7,
        white: 7
    };
    this.out = {
        black: 0,
        white: 0
    };
    this.sequence = {};
    this.sequence[PieceEnum.BLACK] = ["b1","b2","b3","b4","c1","c2","c3","c4","c5","c6","c7","c8","b5","b6"];
    this.sequence[PieceEnum.WHITE] = ["w1","w2","w3","w4","c1","c2","c3","c4","c5","c6","c7","c8","w5","w6"];
}

Ur.prototype.get_classes = function () {
    let out = {};
    for (let key in this.state) {
        if (this.state[key] === PieceEnum.BLACK) {
            out[key] = "black-piece";
        } else if (this.state[key] === PieceEnum.WHITE) {
            out[key] = "white-piece";
        }
    }
    return out;
};

Ur.prototype.validate_start_location = function (side, start) {
    if (side === undefined || side === null || start === undefined || start === null) {
        return false;
    }
    return this.state[start] === side;
};

Ur.prototype.validate_end_location = function (side, end) {
    if (side === undefined || side === null || end === undefined || end === null) {
        return false;
    }
    // opponent is on the center rosette and is safe
    if (end == "c4" && (this.state[end] !== side && this.state[end] !== PieceEnum.NONE)) {
        return false;
    }
    // there's already a piece there
    if (this.state[end] === side) {
        return false;
    }
    return true;
}

Ur.prototype.validate = function (side, start, end) {
    if (side === PieceEnum.NONE) {
        throw "Invalid side";
    }
    if (start === undefined || start === null) {  // move a new piece in
        if (side == PieceEnum.BLACK) {
            if (!this.validate_end_location(side, end)) {
                return false;
            }
        } else {
            if (!this.validate_end_location(side, end)) {
                return false;
            }
        }
        return true;
    }
    if (!this.validate_start_location(side, start)) {
        return false;
    }
    if (end === undefined || end === null) {  // move a piece off
        return true;
    }
    if (this.validate_end_location(side, end)) {
        return true;
    }
    return false;
};

Ur.prototype.isRosette = function (end) {
    if (end === undefined || end === null) {
        return false;
    }
    return end == "b4" || end == "b6" || end == "w4" || end == "w6" || end == "c4";
};

Ur.prototype.move = function (side, start, roll) {
    let end = null;
    if (start !== undefined && start !== null) {
        let start_idx = this.sequence[side].findIndex(function (e) {return e == start;});
        if (start_idx < 0) {
            // invalid start
            return false;
        }
        let end_idx = start_idx + roll;
        if (end_idx == this.sequence[side].length) {
            // move off the board
            end_idx = null;
        } else if (end_idx > this.sequence[side.length]) {
            // too high of a roll to move off the board
            return false;
        }
        if (end_idx !== null) {
            end = this.sequence[side][end_idx];
        }
    } else {
        if (roll >= this.sequence[side].length) {
            // roll too big for the board sequence. probably a programmer error
            return false;
        }
        end = this.sequence[side][roll - 1];
    }
    if (!this.validate(side, start, end)) {
        // invalid move
        return false;
    }
    // make the move
    if (start === undefined || start === null) {
        if (side === PieceEnum.BLACK) {
            this.in.black -= 1;
        } else {
            this.in.white -= 1;
        }
        if (this.state[end] == PieceEnum.BLACK) {
            this.in.black += 1;
        } else if (this.state[end] == PieceEnum.WHITE) {
            this.in.white += 1;
        }
        this.state[end] = side;
    } else if (end === undefined || end === null) {
        this.state[start] = PieceEnum.NONE;
        if (side === PieceEnum.BLACK) {
            this.out.black += 1;
        } else {
            this.out.white += 1;
        }
    } else {
        this.state[start] = PieceEnum.NONE;
        if (this.state[end] == PieceEnum.BLACK) {
            this.in.black += 1;
        } else if (this.state[end] == PieceEnum.WHITE) {
            this.in.white += 1;
        }
        this.state[end] = side;
    }
    return end;
};

new Vue({
  el: '#app',
  data: {
    currentRoll: -1,
    side: PieceEnum.BLACK,
    errorMessage: "",
    boardState: new Ur(),
    rtc: new SimpleWebRTC({
        localVideoEl: "",
        remoteVideoEl: "",
        autoRequestMedia: false,
        receiveMedia: {
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        }
    })
  },
  created: function () {
      this.rtc.on('createdPeer', function (peer) {
          console.log('createdPeer', peer);
      };
      this.rtc.on('iceFailed', function (peer) {
          alert("Connection failed");
      };
      this.rtc.on('connectivityError', function (peer) {
          alert("Connection failed");
      };
  },
  computed: {
      sideDisplay: function() {
          if (this.side == PieceEnum.BLACK) {
              return "Black";
          } else if (this.side == PieceEnum.WHITE) {
              return "White";
          }
          return "";
      },
      tileImageB1: function() { return PieceImages[this.boardState.state.b1]; },
      tileImageB2: function() { return PieceImages[this.boardState.state.b2]; },
      tileImageB3: function() { return PieceImages[this.boardState.state.b3]; },
      tileImageB4: function() { return PieceImages[this.boardState.state.b4]; },
      tileImageB5: function() { return PieceImages[this.boardState.state.b5]; },
      tileImageB6: function() { return PieceImages[this.boardState.state.b6]; },
      tileImageW1: function() { return PieceImages[this.boardState.state.w1]; },
      tileImageW2: function() { return PieceImages[this.boardState.state.w2]; },
      tileImageW3: function() { return PieceImages[this.boardState.state.w3]; },
      tileImageW4: function() { return PieceImages[this.boardState.state.w4]; },
      tileImageW5: function() { return PieceImages[this.boardState.state.w5]; },
      tileImageW6: function() { return PieceImages[this.boardState.state.w6]; },
      tileImageC1: function() { return PieceImages[this.boardState.state.c1]; },
      tileImageC2: function() { return PieceImages[this.boardState.state.c2]; },
      tileImageC3: function() { return PieceImages[this.boardState.state.c3]; },
      tileImageC4: function() { return PieceImages[this.boardState.state.c4]; },
      tileImageC5: function() { return PieceImages[this.boardState.state.c5]; },
      tileImageC6: function() { return PieceImages[this.boardState.state.c6]; },
      tileImageC7: function() { return PieceImages[this.boardState.state.c7]; },
      tileImageC8: function() { return PieceImages[this.boardState.state.c8]; },
      isWhite: function () {
        return this.side == PieceEnum.WHITE;
      },
      isBlack: function () {
        return this.side == PieceEnum.BLACK;
      },
      hasError: function () {
          return !!this.errorMessage;
      }
  },
  methods: {
    rollDice: function () {
        let roll = 0;
        for (let i = 0; i < 4; i++) {
            roll += Math.floor(Math.random() * 2);
        }
        this.currentRoll = roll;
        this.errorMessage = "";
    },
    processClick: function (evt) {
        if (this.currentRoll < 0) {
            this.errorMessage = "Must roll the dice first";
            return;
        } else if (this.currentRoll > 0) {
            let id = evt.currentTarget.id;
            if (id == "black-in") {
                if (this.side === PieceEnum.BLACK) {
                    id = null;
                } else {
                    this.errorMessage = "You can only move your own pieces";
                    return;
                }
            }
            if (id == "white-in") {
                if (this.side === PieceEnum.WHITE) {
                    id = null;
                } else {
                    this.errorMessage = "You can only move your own pieces";
                    return;
                }
            }
            let end_state = this.boardState.move(this.side, id, this.currentRoll);
            if (!end_state && end_state !== null) {
                this.errorMessage = "Invalid move (no end state)";
                return;
            }
            if (this.boardState.isRosette(end_state)) {
                // you get another roll
                this.currentRoll = -1;
                return;
            }
        }
        this.side = (this.side === PieceEnum.BLACK) ? PieceEnum.WHITE : PieceEnum.BLACK;
        this.currentRoll = -1;
    }
  }
})
