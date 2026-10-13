// Supplied poses only. Single-frame talk clips are neutral idle stances.
// Render at native clip size (scale defaults to 1), subtracting the clip foot
// from its world anchor. Vito's wider cells include the dinosaur, not a giant human.
window.V5_ACTION_ART = {
  connor: {
    talk: { sheet: '../v5/assets/characters/connor-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/connor-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  jason: {
    talk: { sheet: '../v5/assets/characters/jason-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/jason-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  peachy: {
    talk: { sheet: '../v5/assets/characters/peachy-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/peachy-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  mark: {
    talk: { sheet: '../v5/assets/characters/mark-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/mark-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  stephanie: {
    talk: { sheet: '../v5/assets/characters/stephanie-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/stephanie-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  vito: {
    talk: { sheet: '../v5/assets/characters/vito-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/vito-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    wrestle: { sheet: '../v5/assets/characters/vito-wrestle.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 6, scale: 1 },
    throw: { sheet: '../v5/assets/characters/vito-throw.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 6, fps: 6, scale: 1, loop: false },
    recover: { sheet: '../v5/assets/characters/vito-recover.png', frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 3, scale: 1, loop: false }
  },
  brie: {
    talk: { sheet: '../v5/assets/characters/brie-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    yoga: { sheet: '../v5/assets/characters/brie-yoga.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3 },
    stand: { sheet: '../v5/assets/characters/brie-stand.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3, loop: false }
  },
  jeff: {
    talk: { sheet: '../v5/assets/characters/jeff-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/jeff-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: '../v5/assets/characters/jeff-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: '../v5/assets/characters/jeff-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: '../v5/assets/characters/jeff-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  ari: {
    talk: { sheet: '../v5/assets/characters/ari-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/ari-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: '../v5/assets/characters/ari-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: '../v5/assets/characters/ari-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    kick: { sheet: '../v5/assets/characters/ari-kick.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: '../v5/assets/characters/ari-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false }
  },
  chris: {
    talk: { sheet: '../v5/assets/characters/chris-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/chris-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: '../v5/assets/characters/chris-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: '../v5/assets/characters/chris-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: '../v5/assets/characters/chris-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  jaime: {
    talk: { sheet: '../v5/assets/characters/jaime-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/jaime-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: '../v5/assets/characters/jaime-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: '../v5/assets/characters/jaime-win.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    phone: { sheet: '../v5/assets/characters/jaime-phone.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6 },
    skate: { sheet: '../v5/assets/characters/jaime-skate.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  },
  gary: {
    talk: { sheet: '../v5/assets/characters/gary-talk.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: '../v5/assets/characters/gary-surprised.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: '../v5/assets/characters/gary-hurt.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: '../v5/assets/characters/gary-win.png', frameWidth: 64, frameHeight: 80, foot: { x: 32, y: 76 }, frames: 3, fps: 6, loop: false },
    sit: { sheet: '../v5/assets/characters/gary-sit.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    drink: { sheet: '../v5/assets/characters/gary-drink.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    interact: { sheet: '../v5/assets/characters/gary-interact.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    attack: { sheet: '../v5/assets/characters/gary-attack.png', frameWidth: 128, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    special: { sheet: '../v5/assets/characters/gary-special.png', frameWidth: 128, frameHeight: 80, foot: { x: 40, y: 72 }, frames: 3, fps: 6, loop: false },
    unique: { sheet: '../v5/assets/characters/gary-unique.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    run: { sheet: '../v5/assets/characters/gary-run.png', frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  }
};
window.V5_WINDOW_ART = {
  sheet: '../v5/assets/dinosaurs/window-head.png', frameWidth: 192, frameHeight: 192, frames: 3
};
window.V5_GARY_WALK = {
  sheet: '../v5/assets/characters/gary-walk.png?v=cleanup-2', frameWidth: 64, frameHeight: 64,
  foot: { x: 32, y: 60 }, frames: 4,
  rows: { down: 0, left: 1, right: 2, up: 3 }, walkRowOffset: 4
};
