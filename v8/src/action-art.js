// Supplied poses only. Single-frame talk clips are neutral idle stances.
// Render at native clip size (scale defaults to 1), subtracting the clip foot
// from its world anchor. Vito's wider cells include the dinosaur, not a giant human.
window.V5_ACTION_ART = {
  connor: {
    talk: { sheet: V8_ART.url('character.connor.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.connor.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  jason: {
    talk: { sheet: V8_ART.url('character.jason.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.jason.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  peachy: {
    talk: { sheet: V8_ART.url('character.peachy.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.peachy.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  mark: {
    talk: { sheet: V8_ART.url('character.mark.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.mark.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  stephanie: {
    talk: { sheet: V8_ART.url('character.stephanie.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.stephanie.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 }
  },
  vito: {
    talk: { sheet: V8_ART.url('character.vito.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    surprised: { sheet: V8_ART.url('character.vito.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    wrestle: { sheet: V8_ART.url('character.vito.wrestle'), frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 6, scale: 1 },
    throw: { sheet: V8_ART.url('character.vito.throw'), frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 6, fps: 6, scale: 1, loop: false },
    recover: { sheet: V8_ART.url('character.vito.recover'), frameWidth: 192, frameHeight: 128, foot: { x: 64, y: 120 }, frames: 3, fps: 3, scale: 1, loop: false }
  },
  brie: {
    talk: { sheet: V8_ART.url('character.brie.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6 },
    yoga: { sheet: V8_ART.url('character.brie.yoga'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3 },
    stand: { sheet: V8_ART.url('character.brie.stand'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 3, loop: false }
  },
  jeff: {
    talk: { sheet: V8_ART.url('character.jeff.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: V8_ART.url('character.jeff.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: V8_ART.url('character.jeff.hurt'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: V8_ART.url('character.jeff.win'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: V8_ART.url('character.jeff.interact'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  ari: {
    talk: { sheet: V8_ART.url('character.ari.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: V8_ART.url('character.ari.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: V8_ART.url('character.ari.hurt'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: V8_ART.url('character.ari.interact'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    kick: { sheet: V8_ART.url('character.ari.kick'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: V8_ART.url('character.ari.win'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false }
  },
  chris: {
    talk: { sheet: V8_ART.url('character.chris.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: V8_ART.url('character.chris.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: V8_ART.url('character.chris.hurt'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: V8_ART.url('character.chris.win'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    interact: { sheet: V8_ART.url('character.chris.interact'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false }
  },
  jaime: {
    talk: { sheet: V8_ART.url('character.jaime.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: V8_ART.url('character.jaime.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: V8_ART.url('character.jaime.hurt'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: V8_ART.url('character.jaime.win'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    phone: { sheet: V8_ART.url('character.jaime.phone'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6 },
    skate: { sheet: V8_ART.url('character.jaime.skate'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  },
  gary: {
    talk: { sheet: V8_ART.url('character.gary.talk'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    surprised: { sheet: V8_ART.url('character.gary.surprised'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6 },
    hurt: { sheet: V8_ART.url('character.gary.hurt'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    win: { sheet: V8_ART.url('character.gary.win'), frameWidth: 64, frameHeight: 80, foot: { x: 32, y: 76 }, frames: 3, fps: 6, loop: false },
    sit: { sheet: V8_ART.url('character.gary.sit'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    drink: { sheet: V8_ART.url('character.gary.drink'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 1, fps: 6, loop: false },
    interact: { sheet: V8_ART.url('character.gary.interact'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 2, fps: 6, loop: false },
    attack: { sheet: V8_ART.url('character.gary.attack'), frameWidth: 128, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    special: { sheet: V8_ART.url('character.gary.special'), frameWidth: 128, frameHeight: 80, foot: { x: 40, y: 72 }, frames: 3, fps: 6, loop: false },
    unique: { sheet: V8_ART.url('character.gary.unique'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 6, loop: false },
    run: { sheet: V8_ART.url('character.gary.run'), frameWidth: 64, frameHeight: 64, foot: { x: 32, y: 60 }, frames: 3, fps: 8 }
  }
};
window.V5_WINDOW_ART = {
  sheet: V8_ART.url('dinosaur.window-head'), frameWidth: 192, frameHeight: 192, frames: 3
};
window.V5_GARY_WALK = {
  sheet: V8_ART.url('character.gary.walk'), frameWidth: 64, frameHeight: 64,
  foot: { x: 32, y: 60 }, frames: 4,
  rows: { down: 0, left: 1, right: 2, up: 3 }, walkRowOffset: 4
};
