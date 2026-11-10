import test from 'node:test'
import assert from 'node:assert/strict'

import { scanFileName, scanText } from '../scripts/check-package-content.mjs'

test('内容检查：本地绝对路径（POSIX / Windows）', () => {
  assert.equal(scanText('docs/a.md', '见 /Users/alice/project').length, 1)
  assert.equal(scanText('docs/a.md', 'C:\\Users\\alice\\project').length, 1)
})

test('内容检查：单层 /home 路径不误判', () => {
  assert.equal(scanText('docs/a.md', '/home/index.vue').length, 0)
  assert.equal(scanText('docs/a.md', '/home/alice/project').length, 1)
})

test('内容检查：内部仓库路径与内部包名', () => {
  assert.equal(scanText('a.md', '见 docs/roadmap/x.md').length, 1)
  assert.equal(scanText('a.md', '见 packages/kit/src').length, 1)
  assert.equal(scanText('a.md', '安装 @ultime/kit').length, 1)
  assert.equal(scanText('a.md', 'docs/typography.md').length, 0)
  assert.equal(scanText('a.md', '@ultime/designcraft').length, 0)
})

test('内容检查：例外按文件与规则放行', () => {
  const allow = [{ file: 'a.md', rule: 'absolute-path', reason: 'test' }]
  assert.equal(scanText('a.md', '/Users/alice/project', allow).length, 0)
  assert.equal(scanText('b.md', '/Users/alice/project', allow).length, 1)
})

test('文件检查：测试、eval、依赖、编辑器与密钥', () => {
  assert.equal(scanFileName('tests/a.md').length, 1)
  assert.equal(scanFileName('evals/golden-tasks.md').length, 1)
  assert.equal(scanFileName('node_modules/a.js').length, 1)
  assert.equal(scanFileName('.trae/a.md').length, 1)
  assert.equal(scanFileName('fixtures/.env').length, 1)
  assert.equal(scanFileName('docs/a.md').length, 0)
})

test('文件检查：例外按路径放行', () => {
  const allow = [{ file: 'fixtures/.env', rule: 'secret', reason: 'test' }]
  assert.equal(scanFileName('fixtures/.env', allow).length, 0)
  assert.equal(scanFileName('other/.env', allow).length, 1)
})
