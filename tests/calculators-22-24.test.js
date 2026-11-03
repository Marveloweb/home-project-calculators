// Hand-worked examples for calculators 22-24: siding, carpet, countertops.
// Each matches the worked example in that calculator's guide.
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/assets/js/formulas.js');
const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

const HOUSE = { perimeter: 140, wallHeight: 9, gables: 2, gableWidth: 30, gableHeight: 6, windows: 12, doors: 2,
  outsideCorners: 4, insideCorners: 0, wastePct: 10 };

test('siding: 40 x 30 ft house, 9 ft walls, two 30 ft gables 6 ft high, vinyl', () => {
  const r = F.siding({ ...HOUSE, material: 'vinyl', wrap: true });
  close(r.wallArea, 1260);                  // 140 x 9
  close(r.gableArea, 210);                  // 2 x 1/2 x 30 x (6 + 1)
  close(r.area, 1470);
  close(r.squares, 16.17);                  // 1,470 x 1.1 / 100
  assert.equal(r.cartons, 9);               // 2 squares per carton
  close(r.rakeFt, 64.62);                   // 2 gables x 2 x sqrt(15^2 + 6^2)
  close(r.eavesFt, 80);                     // 140 - 2 x 30
  assert.equal(r.openingFt, 226);           // 12 x 16 + 2 x 17
  assert.equal(r.jChannel, 34);             // 370.6 x 1.1 / 12
  assert.equal(r.starter, 13);              // 140 x 1.1 / 12
  assert.equal(r.outsidePosts, 4);
  assert.equal(r.insidePosts, 0);
  assert.equal(r.wrapRolls, 2);             // 1,470 x 1.1 / 1,350
  assert.equal(r.planks, 0);
});

test('siding: the same house in HardiePlank at a 7 in exposure', () => {
  const r = F.siding({ ...HOUSE, material: 'fiber', exposure: 7 });
  close(r.pcsPerSq, 14.29);                 // James Hardie: 14.3 per square
  assert.equal(r.planks, 231);              // 16.17 squares x 100 / 7
  assert.equal(r.cornerBoards, 8);          // 2 boards per outside corner
  assert.equal(r.openingTrim, 21);          // 226 x 1.1 / 12
  assert.equal(r.rakeTrim, 14);             // (64.6 + 80) x 1.1 / 12
  assert.equal(r.starterPlanks, 3);         // 13 strips, 5 per plank
  assert.equal(r.cartons, 0);
  assert.equal(r.wrapRolls, 0);
  // Hardie's own table: 4 in exposure = 25 per square, 8 in = 12.5
  close(F.siding({ perimeter: 10, wallHeight: 10, wastePct: 0, material: 'fiber', exposure: 4 }).planks, 25);
  close(F.siding({ perimeter: 10, wallHeight: 10, wastePct: 0, material: 'fiber', exposure: 8 }).planks, 13);
});

test('siding: half of a garage door comes off, and an empty house buys nothing', () => {
  const r = F.siding({ ...HOUSE, largeOpenSqFt: 112, material: 'vinyl' });
  close(r.deduct, 56);
  close(r.area, 1414);
  assert.equal(r.cartons, 8);               // 15.55 squares
  const z = F.siding({ perimeter: 0, wallHeight: 9, material: 'vinyl', outsideCorners: 4 });
  assert.equal(z.cartons, 0); assert.equal(z.starter, 0); assert.equal(z.outsidePosts, 0); assert.equal(z.jChannel, 0);
  assert.equal(F.siding({ perimeter: 100, wallHeight: 12, outsideCorners: 4, insideCorners: 2 }).outsidePosts, 8);
});

test('carpet: 15 x 12 ft room, 12 ft roll: one piece, no seam', () => {
  const r = F.carpet({ shapes: [{ type: 'rect', l: 15, w: 12 }], rollWidth: 12, doorways: 1, pad: true });
  close(r.floorSqFt, 180);
  assert.equal(r.linearFt, 16);             // 15 ft + 3 in each end, rounded up
  assert.equal(r.sqFt, 192);
  assert.equal(r.buySqYd, 22);              // 21.3
  assert.equal(r.seamFt, 0);
  assert.equal(r.padSqYd, 22);              // 180 x 1.1 / 9
  assert.equal(r.tackFt, 51);               // 54 - 3 for the doorway
  assert.equal(r.tackStrips, 15);           // 51 x 1.1 / 4
});

test('carpet: 18 x 14 ft room needs a seam; strips run the cheaper way', () => {
  const r = F.carpet({ shapes: [{ type: 'rect', l: 18, w: 14 }], rollWidth: 12, doorways: 1, pad: false });
  assert.equal(r.cuts[0].strips, 2);
  assert.equal(r.cuts[0].length, 15);       // strips along the 14 ft side: 2 x 15 = 30 ft (vs 2 x 19 = 38)
  assert.equal(r.linearFt, 30);
  assert.equal(r.sqFt, 360);
  assert.equal(r.buySqYd, 40);
  assert.equal(r.seamFt, 14);
  assert.equal(r.seamTapeFt, 16);
  assert.equal(r.padSqYd, 0);
  // A 15 ft roll covers it in one piece: 19 ft x 15 ft
  const w = F.carpet({ shapes: [{ type: 'rect', l: 18, w: 14 }], rollWidth: 15 });
  assert.equal(w.linearFt, 19); assert.equal(w.sqFt, 285); assert.equal(w.seamFt, 0);
});

test('carpet: L-shaped room in two sections; a cut-out lowers the pad, not the carpet', () => {
  const r = F.carpet({ shapes: [{ type: 'rect', l: 12, w: 12 }, { type: 'rect', l: 10, w: 6 }], rollWidth: 12, pad: true });
  assert.equal(r.linearFt, 13 + 7);         // 12 ft + 6 in -> 13; the 6 ft side + 6 in -> 7
  assert.equal(r.sqFt, 240);
  const c = F.carpet({ shapes: [{ type: 'rect', l: 15, w: 12 }, { type: 'rect', l: 3, w: 2, subtract: true }], rollWidth: 12, pad: true });
  assert.equal(c.sqFt, 192);
  assert.equal(c.padSqYd, 22);              // 174 x 1.1 / 9 = 21.3
  assert.equal(F.carpet({ shapes: [], rollWidth: 12 }).buySqYd, 0);
});

const KITCHEN = { run1: 10, run2: 8, depthIn: 25.5, islandL: 6, islandDepthIn: 36, splashIn: 4 };

test('countertop: L kitchen 10 + 8 ft, 6 ft x 36 in island, 4 in splash, quartz', () => {
  const r = F.countertop({ ...KITCHEN, material: 'quartz', slab: 'standard' });
  close(r.counterSqFt, 38.25);              // 18 x 25.5 / 12
  close(r.islandSqFt, 18);
  close(r.splashSqFt, 6);
  close(r.sqFt, 62.25);
  close(r.slabSqFt, 47.08);                 // 120 x 56.5 in
  assert.equal(r.slabs, 3);
  assert.equal(r.seams, 2);                 // the 10 ft run and its splash are longer than 118 in
  assert.equal(F.countertop({ ...KITCHEN, material: 'quartz', slab: 'jumbo' }).slabs, 2);
});

test('countertop: slab packing by hand', () => {
  // Two 25.5 in strips fit across a standard slab (2 x 25.5 = 51 <= 54.5 in usable)
  assert.equal(F.packSlabs([{ len: 96, w: 25.5 }, { len: 96, w: 25.5 }], F.SLABS.standard).slabs, 1);
  // A 36 in island and a 25.5 in counter do not (61.5 in)
  assert.equal(F.packSlabs([{ len: 96, w: 36 }, { len: 96, w: 25.5 }], F.SLABS.standard).slabs, 2);
  // ...but they do on a jumbo slab (62.5 in usable)
  assert.equal(F.packSlabs([{ len: 96, w: 36 }, { len: 96, w: 25.5 }], F.SLABS.jumbo).slabs, 1);
});

test('countertop: laminate and butcher block in stock lengths', () => {
  const r = F.countertop({ ...KITCHEN, material: 'laminate' });
  assert.deepEqual(r.stock, [{ ft: 10, count: 1 }, { ft: 8, count: 1 }, { ft: 6, count: 2 }]);
  assert.equal(r.pieces, 4);
  assert.equal(r.islandAcross, 2);          // 36 in island from 25 in stock
  assert.deepEqual(F.stockPieces(7.5), [8]);
  assert.deepEqual(F.stockPieces(15), [12, 4]);
  assert.deepEqual(F.stockPieces(12), [12]);
  const b = F.countertop({ run1: 5, material: 'butcher' });
  assert.deepEqual(b.stock, [{ ft: 6, count: 1 }]);
  assert.equal(b.islandAcross, 0);
  assert.equal(F.countertop({ material: 'quartz' }).slabs, 0);
});
