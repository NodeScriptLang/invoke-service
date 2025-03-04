import assert from 'assert';

import { findErrorLocation, parseStack } from '../main/util/stack.js';

describe('parseStack', () => {

    it('parses error stack', () => {
        const stack = `
         error: Error [BoomError]: Something bad happened
      at compute (data:text/javascript;base64,...:1:340)
      at root:Hvok7Y1K:SHpmQ5Wn (data:text/javascript;base64,...:1:936)
      at root:Hvok7Y1K:result (data:text/javascript;base64,...:1:816)
      at data:text/javascript;base64,...:1:686
      at compute (data:text/javascript;base64,...:1:209)
      at root:Hvok7Y1K (data:text/javascript;base64,...:1:664)
      at async Promise.all (index 0)
      at async root:result (data:text/javascript;base64,...:1:486)
      at async compute (data:text/javascript;base64,...:1:1434)
      at async derived.computeResponse (file:///foo/bar/baz/InvokeHandler.js:90:28)
        `;
        const parsed = parseStack(stack);
        assert.deepStrictEqual(parsed, [
            { symbol: 'compute', source: 'data:text/javascript;base64,...:1:340' },
            { symbol: 'root:Hvok7Y1K:SHpmQ5Wn', source: 'data:text/javascript;base64,...:1:936' },
            { symbol: 'root:Hvok7Y1K:result', source: 'data:text/javascript;base64,...:1:816' },
            { symbol: 'compute', source: 'data:text/javascript;base64,...:1:209' },
            { symbol: 'root:Hvok7Y1K', source: 'data:text/javascript;base64,...:1:664' },
            { symbol: 'Promise.all', source: 'index 0' },
            { symbol: 'root:result', source: 'data:text/javascript;base64,...:1:486' },
            { symbol: 'compute', source: 'data:text/javascript;base64,...:1:1434' },
            { symbol: 'derived.computeResponse', source: 'file:///foo/bar/baz/InvokeHandler.js:90:28' },
        ]);
    });

    it('finds error location', () => {
        const stack = `
         Graph error {
  error: Error [BoomError]: Something happened, but we don't know what
      at compute (data:text/javascript;base64,...:1:340)
      at root:9uJNBoCS (data:text/javascript;base64,...:1:591)
      at root:result (data:text/javascript;base64,...:1:480)
      at root:Hvok7Y1K:Q8niRNV4 (data:text/javascript;base64,...:1:1264)
      at root:Hvok7Y1K:result (data:text/javascript;base64,...:1:1144)
      at data:text/javascript;base64,...:1:1014
      at compute (data:text/javascript;base64,...:1:209)
      at root:Hvok7Y1K (data:text/javascript;base64,...:1:992)
      at async Promise.all (index 0)
      at async root:result (data:text/javascript;base64,...:1:814)
      `;
        const parsed = parseStack(stack);
        const location = findErrorLocation(parsed);
        assert.strictEqual(location, 'root:Hvok7Y1K:Q8niRNV4');
    });

});
