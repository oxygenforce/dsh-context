import { createElement as h } from 'react'
import assert from 'node:assert/strict'
import { describe, test } from 'vitest'
import { Browser, props, tl } from './browserHarness'
import { mount, query } from '../helpers/kit'

/** Pin the boxes jsdom never lays out, so the card's rows region can report a scroll range. */
function pinBoxes(el: Element, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
}

function tree(): ReturnType<typeof h> {
  return h('div', { style: { overflowY: 'auto' } }, h(Browser, props({ data: tl({}) })))
}

describe('ContextBrowser — containment follows the rows region scroll range', () => {
  test('rows that fit drop the containment so the wheel chains to the page', async () => {
    const m = await mount(tree())
    const region = query<HTMLElement>(m.container, '.lc-br-scroll')

    assert.equal(region.style.overscrollBehavior, 'auto')
    await m.unmount()
  })

  test('rows that overflow keep the containment, and never intercept the wheel in JS', async () => {
    const m = await mount(tree())
    const region = query<HTMLElement>(m.container, '.lc-br-scroll')
    pinBoxes(region, 600, 100)
    await m.update(tree())

    assert.equal(region.style.overscrollBehavior, 'contain')
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 300 })
    region.dispatchEvent(event)
    assert.equal(event.defaultPrevented, false)
    await m.unmount()
  })

  test('a region that fits again lifts the containment again', async () => {
    const m = await mount(tree())
    const region = query<HTMLElement>(m.container, '.lc-br-scroll')
    pinBoxes(region, 600, 100)
    await m.update(tree())
    assert.equal(region.style.overscrollBehavior, 'contain')

    pinBoxes(region, 100, 100)
    await m.update(tree())
    assert.equal(region.style.overscrollBehavior, 'auto')
    await m.unmount()
  })

  test('a few pixels of scroll range count as fitting: the wheel still chains', async () => {
    const m = await mount(tree())
    const region = query<HTMLElement>(m.container, '.lc-br-scroll')
    pinBoxes(region, 102, 100)
    await m.update(tree())

    assert.equal(region.style.overscrollBehavior, 'auto')
    await m.unmount()
  })
})
