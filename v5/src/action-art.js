// Supplied poses only. Single-frame talk clips are neutral idle stances.
// Render at native clip size (scale defaults to 1), subtracting the clip foot
// from its world anchor. Vito's wider cells include the dinosaur, not a giant human.
window.V5_ACTION_ART = {
  connor: {
    talk: { sheet: 'assets/characters/connor-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/connor-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  jason: {
    talk: { sheet: 'assets/characters/jason-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/jason-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  peachy: {
    talk: { sheet: 'assets/characters/peachy-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/peachy-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  mark: {
    talk: { sheet: 'assets/characters/mark-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/mark-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  stephanie: {
    talk: { sheet: 'assets/characters/stephanie-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/stephanie-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  vito: {
    talk: { sheet: 'assets/characters/vito-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: 'assets/characters/vito-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    wrestle: { sheet: 'assets/characters/vito-wrestle.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 6, scale: 1 },
    throw: { sheet: 'assets/characters/vito-throw.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 6, fps: 6, scale: 1, loop: false },
    recover: { sheet: 'assets/characters/vito-recover.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 3, scale: 1, loop: false }
  },
  brie: {
    talk: { sheet: 'assets/characters/brie-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    yoga: { sheet: 'assets/characters/brie-yoga.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3 },
    stand: { sheet: 'assets/characters/brie-stand.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3, loop: false }
  },
  jeff: {
    talk: { sheet: 'assets/characters/jeff-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: 'assets/characters/jeff-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: 'assets/characters/jeff-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: 'assets/characters/jeff-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: 'assets/characters/jeff-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  ari: {
    talk: { sheet: 'assets/characters/ari-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: 'assets/characters/ari-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: 'assets/characters/ari-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: 'assets/characters/ari-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    kick: { sheet: 'assets/characters/ari-kick.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: 'assets/characters/ari-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false }
  },
  chris: {
    talk: { sheet: 'assets/characters/chris-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: 'assets/characters/chris-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: 'assets/characters/chris-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: 'assets/characters/chris-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: 'assets/characters/chris-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  jaime: {
    talk: { sheet: 'assets/characters/jaime-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: 'assets/characters/jaime-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: 'assets/characters/jaime-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: 'assets/characters/jaime-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    phone: { sheet: 'assets/characters/jaime-phone.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6 },
    skate: { sheet: 'assets/characters/jaime-skate.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  },
  gary: {
    talk: { sheet: 'assets/characters/gary-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: 'assets/characters/gary-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: 'assets/characters/gary-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: 'assets/characters/gary-win.png', frameWidth: 64, frameHeight: 80, foot: { x: 32, y: 76 }, frames: 3, fps: 6, loop: false },
    sit: { sheet: 'assets/characters/gary-sit.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    drink: { sheet: 'assets/characters/gary-drink.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    interact: { sheet: 'assets/characters/gary-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    attack: { sheet: 'assets/characters/gary-attack.png', frameWidth: 128, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    special: { sheet: 'assets/characters/gary-special.png', frameWidth: 128, frameHeight: 80, foot: { x: 40, y: 72 }, frames: 3, fps: 6, loop: false },
    unique: { sheet: 'assets/characters/gary-unique.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    run: { sheet: 'assets/characters/gary-run.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  }
};
window.V5_WINDOW_ART = {
  sheet: 'assets/dinosaurs/window-head.png', frameWidth: 192, frameHeight: 192, frames: 3
};
window.V5_GARY_WALK = {
  sheet: 'assets/characters/gary-walk.png', frameWidth: 64, frameHeight: 64,
  foot: { x: 32, y: 60 }, frames: 4,
  rows: { down: 0, left: 1, right: 2, up: 3 }, walkRowOffset: 4
};
