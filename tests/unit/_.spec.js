import { expect } from 'chai'
import { commonPathPrefix } from '@/_'

describe('_.vue', () => {
  it('commonPathPrefix should work', () => {
    const prefix = commonPathPrefix(['ab/b/e', 'abab/e', 'ab/a'])
    expect(prefix).to.equal('ab')
  })
  it('commonPathPrefix should work with an empty array', () => {
    const prefix = commonPathPrefix([])
    expect(prefix).to.equal('')
  })
  it('commonPathPrefix should work with an empty strings', () => {
    const prefix = commonPathPrefix(['', ''])
    expect(prefix).to.equal('')
  })
  it('commonPathPrefix should work with an short identical strings', () => {
    const prefix = commonPathPrefix(['a', 'a'])
    expect(prefix).to.equal('a')
  })
})
