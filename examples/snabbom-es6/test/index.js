import chai from 'chai'; // https://www.chaijs.com/
import arraySum from '../src';
// import assert from 'assert'

const { assert } = chai;

describe('arraySum', () => {
  it('should normal', () => {
    assert.equal(arraySum(1, 1), 2);
  });

  it('should normal if first param is Arrray', () => {
    assert.equal(arraySum([1, 1]), 2);
  });
});
