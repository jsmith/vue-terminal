import { expect } from 'chai'
import { commonPathPrefix } from '@/_'

describe('_.vue', () => {
  it('commonPathPrefix should work', () => {
    const prefix = commonPathPrefix(['ab/b/e', 'abab/e', 'ab/a'])
    expect(prefix).to.equal('ab')
  })
})
